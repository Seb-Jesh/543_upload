import 'dotenv/config';   // ← must be first — loads .env before any other import runs

import express from "express";
import reader from "xlsx";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from 'express-session';
import multer from "multer";

import { testConnection } from './db.js';
import UserModel from './models/UserModel.js';
import { validate } from './public/js/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'hbs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Session ───────────────────────────────────────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge:   60 * 60 * 1000,                          // 1 hour
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',   // HTTPS only in prod
        sameSite: 'strict',
    },
    name: 'appSession',
}));

// ── Upload directories ────────────────────────────────────────────────────────
const UPLOAD_DIR = 'upload';
const CGRATE_DIR = path.join(os.homedir(), 'cgrate_lists');

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${safe}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(_req, file, cb) {
        if (!file.originalname.match(/\.(xlsx|xls|csv)$/))
            return cb(new Error('File must be an Excel sheet (.xlsx / .xls / .csv)'));
        cb(null, true);
    },
});

// ── Auth middleware ───────────────────────────────────────────────────────────

/** Block unauthenticated requests; remember the attempted URL. */
function requireAuth(req, res, next) {
    if (req.session?.user) return next();
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
}

/** Send already-logged-in users straight to the dashboard. */
function redirectIfAuthenticated(req, res, next) {
    if (req.session?.user) return res.redirect('/dashboard');
    next();
}

/** Require a specific role (admin bypasses all role checks). */
function requireRole(role) {
    return (req, res, next) => {
        if (!req.session?.user) return res.redirect('/login');
        if (req.session.user.role === 'admin' || req.session.user.role === role)
            return next();
        res.status(403).render('error', {
            title:   'Access Denied',
            message: 'You do not have permission to view this page.',
            user:    req.session.user,
        });
    };
}

/** Ensure a processed upload exists in the session before download routes. */
function requireUploadData(req, res, next) {
    if (!req.session.uploadData)
        return res.status(400).render('download', {
            title:       'No Data',
            description: 'Please upload a file first.',
            user:        req.session.user,
        });
    next();
}

// Expose user & auth state to every HBS template
app.use((req, res, next) => {
    res.locals.user            = req.session?.user ?? null;
    res.locals.isAuthenticated = !!req.session?.user;
    next();
});

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, './public')));

// ═════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// GET /login
app.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('login', {
        title:   'Sign In',
        error:   req.query.error,
        message: req.query.message,
    });
});

// POST /login
app.post('/login', redirectIfAuthenticated, async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password)
            return res.redirect('/login?error=Please provide username and password');

        // UserModel handles the bcrypt comparison against the DB hash
        const user = await UserModel.verifyPassword(username, password);

        if (!user)
            return res.redirect('/login?error=Invalid username or password');

        // Store only the safe subset in the session (no password hash)
        req.session.user = {
            id:       user.id,
            username: user.username,
            email:    user.email,
            role:     user.role,
        };

        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.redirect('/login?error=Login failed. Please try again.');
            }
            const returnTo = req.session.returnTo || '/dashboard';
            delete req.session.returnTo;
            res.redirect(returnTo);
        });

    } catch (err) {
        console.error('Login error:', err);
        res.redirect('/login?error=An unexpected error occurred. Please try again.');
    }
});

// GET /register
app.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render('register', {
        title: 'Create Account',
        error: req.query.error,
    });
});

// POST /register
app.post('/register', redirectIfAuthenticated, async (req, res) => {
    const { username, password, confirmPassword, email } = req.body;

    try {
        // ── Validate input ────────────────────────────────────────────────
        if (!username || !password || !email)
            return res.redirect('/register?error=All fields are required');

        if (password !== confirmPassword)
            return res.redirect('/register?error=Passwords do not match');

        if (password.length < 6)
            return res.redirect('/register?error=Password must be at least 6 characters');

        // ── Check uniqueness before inserting ─────────────────────────────
        if (await UserModel.usernameExists(username))
            return res.redirect('/register?error=That username is already taken');

        if (await UserModel.emailExists(email))
            return res.redirect('/register?error=An account with that email already exists');

        // ── Persist to MySQL ──────────────────────────────────────────────
        await UserModel.create({ username, password, email });

        console.log(`[register] new user created: ${username}`);
        res.redirect('/login?message=Account created! Please sign in.');

    } catch (err) {
        // Catch MySQL duplicate-key race condition as a last resort
        if (err.code === 'ER_DUP_ENTRY')
            return res.redirect('/register?error=Username or email already in use');

        console.error('Registration error:', err);
        res.redirect('/register?error=An unexpected error occurred. Please try again.');
    }
});

// POST /logout  (GET alias for convenience links)
function logoutHandler(req, res) {
    const username = req.session?.user?.username;
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.clearCookie('appSession');
        console.log(`[logout] "${username}" signed out`);
        res.redirect('/login?message=You have been signed out.');
    });
}
app.post('/logout', logoutHandler);
app.get('/logout',  logoutHandler);

// ═════════════════════════════════════════════════════════════════════════════
// PROTECTED APPLICATION ROUTES
// ═════════════════════════════════════════════════════════════════════════════

app.get('/',          requireAuth, (_req, res) => res.redirect('/dashboard'));
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', {
        title:       'Dashboard',
        description: 'Upload an Excel file to sanitize',
        user:        req.session.user,
    });
});

// ── Data-processing helpers ───────────────────────────────────────────────────

function processDataRows(data) {
    return data.map((item) => {
        const obj = {};
        for (const key in item) obj[key.toLowerCase()] = item[key];
        return obj;
    });
}

const VALID_PREFIXES = new Set([
    '098','097','096','095','078','077','076','075','021','058','057','056','055',
]);

// Service-specific validation rules
const SERVICE_VALIDATORS = {
    'airtime': {
        sanitizer: (phone) => validate.sanitizePhone(phone),
        validator: (phone) => VALID_PREFIXES.has(phone.substring(0, 3)) && phone.length === 10,
        provider:  (phone) => validate.product(phone),
    },
    'liquid': {
        sanitizer: (phone) => validate.sanitizeLiquid(phone),
        validator: (phone) => validate.isValidLiquid(phone),
        provider:  () => 'Liquid',
    },
    'data': {
        sanitizer: (phone) => validate.sanitizePhone(phone),
        validator: (phone) => VALID_PREFIXES.has(phone.substring(0, 3)) && phone.length === 10,
        provider:  (phone) => validate.product(phone),
    },
    'zesco': {
        sanitizer: (phone) => validate.sanitizeZesco(phone),
        validator: (phone) => validate.isValidZesco(phone),
        provider:  () => 'Zesco',
    },
    'momo': {
        sanitizer: (phone) => validate.sanitizeMomo(phone),
        validator: (phone) => VALID_PREFIXES.has(phone.substring(0, 3)) && phone.length === 10,
        provider:  (phone) => validate.product(phone),
    },
};

function validateAndEnrichRows(rows) {
    const out = [];
    
    for (const item of rows) {
        // Skip rows with invalid basic data
        if (item.amount == null || item.amount <= 0 || item.phone == null) continue;

        // Determine service type (default to 'airtime' if not specified)
        const serviceType = (item.service || 'airtime').toLowerCase().trim();
        
        // Get the appropriate validator for this service, fallback to airtime
        const validator = SERVICE_VALIDATORS[serviceType] || SERVICE_VALIDATORS['airtime'];

        // Sanitize amount (same for all services)
        const amount = validate.sanitizeAmount(item.amount);

        // Use service-specific phone sanitizer
        const phone = validator.sanitizer(item.phone);

        // Use service-specific validation
        const isValidPhone = validator.validator(phone);

        // Use service-specific provider identification
        const serviceProvider = validator.provider(phone);

        out.push({
            ...item,
            amount,
            phone,
            service: serviceType,  // normalize service name
            ServiceProvider: serviceProvider,
            status: (!isValidPhone || amount <= 0) ? 'Invalid row' : undefined,
        });
    }
    
    return out;
}

function calculateSummaries(rows, validRows, airtimeRows, dataRows, liquidRows, momoRows, zescoRows) {
    const sum      = rows.reduce((a, c) => a + c.amount, 0);
    const validSum = validRows.reduce((a, c) => a + c.amount, 0);
    const airtimeSum = airtimeRows.reduce((a, c) => a + c.amount, 0);
    const dataSum = dataRows.reduce((a, c) => a + c.amount, 0);
    const liquidSum = liquidRows.reduce((a, c) => a + c.amount, 0);
    const momoSum = momoRows.reduce((a, c) => a + c.amount, 0);
    const zescoSum = zescoRows.reduce((a, c) => a + c.amount, 0);
    return {
        count:            rows.length,
        valid_rows_count: validRows.length,
        sum,
        sum_valid:   validSum,
        airtime_sum: airtimeSum,
        data_sum: dataSum,
        liquid_sum: liquidSum,
        momo_sum: momoSum,
        zesco_sum: zescoSum,
    };
}

// POST /upload
app.post('/upload', requireAuth, upload.single('filename'), async (req, res) => {
    let filePath = null;

    try {
        if (!req.file)
            return res.status(400).render('download', {
                title: 'Error', description: 'No file was uploaded.', user: req.session.user,
            });

        filePath = req.file.path;

        const file     = reader.readFile(filePath);
        const sheets   = file.SheetNames;
        const isCsv    = req.file.originalname.toLowerCase().endsWith('.csv');

        // CSV files have a single auto-named sheet — use it directly.
        // Excel files must have a sheet explicitly named "upload".
        if (!isCsv && !sheets.includes('upload'))
            return res.status(400).render('download', {
                title:       'Invalid File',
                description: 'Your workbook must contain a sheet named "upload".',
                user:        req.session.user,
            });

        const sheetIndex   = isCsv ? 0 : sheets.indexOf('upload');
        const sheetCompany = isCsv ? -1 : sheets.indexOf('company');

        const data        = reader.utils.sheet_to_json(file.Sheets[sheets[sheetIndex]]);
        const companyData = sheetCompany >= 0
            ? reader.utils.sheet_to_json(file.Sheets[file.SheetNames[sheetCompany]])
            : [];

        const dataArray     = processDataRows(data);
        const processedRows = validateAndEnrichRows(dataArray);
        const validRows     = processedRows.filter(r => r.status !== 'Invalid row');
        const airtime_rows   = processedRows.filter(r => r.service === 'airtime');
        const airtime_rows_valid   = validRows.filter(r => r.service === 'airtime');
        const data_rows     = processedRows.filter(r => r.service === 'data');
        const liquid_rows   = processedRows.filter(r => r.service === 'liquid');
        const zesco_rows    = processedRows.filter(r => r.service === 'zesco');
        const momo_rows     = processedRows.filter(r => r.service === 'momo');

        const rows_cgrate = airtime_rows_valid.map(row => ({
            ServiceProvider: row.ServiceProvider,
            VoucherType:     'Direct-Topup',
            Recipient:       '26' + row.phone,
            Amount:          row.amount,
        }));

        const summaries     = calculateSummaries(processedRows, validRows, airtime_rows, data_rows, liquid_rows, momo_rows, zesco_rows);
        const worksheet     = reader.utils.json_to_sheet(rows_cgrate);
        
        // Always output as .xlsx, even if input was .csv
        const baseFilename  = req.file.originalname.replace(/\.(csv|xlsx|xls)$/i, '');
        const filename      = path.join(CGRATE_DIR, `${Date.now()}-${baseFilename}.xlsx`);
        
        const clientDetails = companyData[0] || {};

        // Store processed results in the session
        req.session.uploadData = {
            airtime_rows,
            data_rows,
            liquid_rows,
            zesco_rows,
            momo_rows,
            worksheet,
            filename,
            clientDetails,
            nowDate:    new Date().toISOString().slice(0, 10),
            uploadedBy: req.session.user.username,
            uploadedAt: new Date(),
            ...summaries,
        };

        console.log(`[upload] ${req.session.user.username} — ${validRows.length} valid rows`);

        res.render('myList', {
            airtime: airtime_rows,
            data: data_rows, liquid: liquid_rows, momo: momo_rows, zesco: zesco_rows,
            ...summaries,
            user: req.session.user,
        });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).render('download', {
            title:       'Processing Error',
            description: 'Something went wrong while processing your file.',
            user:        req.session.user,
        });
    } finally {
        if (filePath)
            await fs.unlink(filePath).catch(e => console.error('File cleanup error:', e));
    }
});

// ── Download routes ───────────────────────────────────────────────────────────

async function buildExcel(worksheet, filename) {
    const workbook = reader.utils.book_new();
    reader.utils.book_append_sheet(workbook, worksheet, 'cgrate');
    await reader.writeFileXLSX(workbook, filename);
}

app.get('/excel', requireAuth, requireUploadData, async (req, res) => {
    try {
        const { worksheet, filename } = req.session.uploadData;
        await buildExcel(worksheet, filename);
        res.render('download', {
            title: 'Download Complete', description: 'Your Excel file has been saved.',
            user: req.session.user,
        });
    } catch (err) {
        console.error('Excel error:', err);
        res.status(500).render('download', {
            title: 'Download Failed', description: 'Could not create the Excel file.',
            user: req.session.user,
        });
    }
});

app.get('/list', requireAuth, requireUploadData, (req, res) => {
    const d = req.session.uploadData;
    res.render('myList', {
        airtime: d.airtime_rows, data: d.data_rows,
        liquid:  d.liquid_rows,  momo: d.momo_rows, zesco: d.zesco_rows,
        count:            d.count,
        valid_rows_count: d.valid_rows_count,
        sum:              d.sum,
        airtime_sum:      d.airtime_sum,
        data_sum:         d.data_sum,
        liquid_sum:       d.liquid_sum,
        momo_sum:         d.momo_sum,
        zesco_sum:        d.zesco_sum,
        sum_valid:        d.sum_valid,
        user:             req.session.user,
    });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).render('download', {
        title:       '404 – Not Found',
        description: 'The page you requested does not exist.',
        user:        res.locals.user,
    });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let server;

process.on('SIGTERM', () => {
    console.log('SIGTERM – shutting down gracefully');
    if (server) {
        server.close(() => { console.log('Server closed'); process.exit(0); });
    }
});

// ── Async startup ─────────────────────────────────────────────────────────────
async function startServer() {
    try {
        // Test DB connection before starting
        await testConnection();

        // Create required directories
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.mkdir(CGRATE_DIR, { recursive: true });

        // Start server
        server = app.listen(port, () => {
            console.log(`🚀  Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the application
startServer();
