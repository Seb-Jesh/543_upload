import express from "express";
import reader from "xlsx";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import orderCreate from "./order.js";
import quoteCreate from "../public/js/quote.js";

import {validate} from '../public/js/helpers.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000

app.set('view engine', 'hbs')

import multer from "multer";

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (_, _file, cb) => {
      cb(null, 'upload');
    },
    filename: (_, file, cb) => {
      cb(null, file.originalname);
    },
    limits: {
        fileSize: 1000000,
    },
    fileFilter(_, file, cb) {
        if(!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
            return cb(new Error("File must be an excel sheet"))
        }
        cb(undefined, true)
    }
});

const upload = multer({ storage: storage });

let airtime_rows, data_rows, liquid_rows, zesco_rows, momo_rows, airtime_sum, data_sum, liquid_sum, zesco_sum, momo_sum, clientDetails, date,nowDate,sum_valid, count, valid_rows_count, sum;
let workbook, worksheet, filename;

app.use(express.static(path.join(__dirname, '../public')));

app.get('', (_, res) => {
    res.render('index', {
        title: 'Upload an excel file to sanitize',
        description: 'makes your data ready for batch upload on the paysmart platform'
    })
});

app.post('/upload', upload.single('filename'), async (req,res) => {    
    // Read & Handle the uploaded file
    const file = reader.readFile(req.file.path)
    const sheets = file.SheetNames

    if(!sheets.includes("upload")) {
        res.render('download', {
            title: '404 PAGE NOT FOUND',
            description: 'Please contact the site administrator'
        })
    }
    
    if(sheets.includes("upload")) {
        let sheetIndex = sheets.indexOf('upload');
        let sheetCompany = sheets.indexOf('company');
        const data = reader.utils.sheet_to_json(file.Sheets[sheets[sheetIndex]]) 
        const companyData = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[sheetCompany]])
        
        const dataArray = [];
        data.forEach((item) => {
            var key, keys = Object.keys(item);
            var n = keys.length;
            const newObj = {};
            while (n--) {
                key = keys[n];
                newObj[key.toLowerCase()] = item[key];
            }
            dataArray.push(newObj)
        });

        const rows_with_phone = dataArray.filter(item => item.amount !== undefined && item.amount > 0 && item.phone !== undefined)
        rows_with_phone.forEach((item) => { 
            item.amount = validate.sanitizeAmount(item.amount); 
            const validPrefix = ['097', '096', '095', '077', '076', '075', '021', '057', '056', '055']
            item.phone = validate.sanitizePhone(item.phone);
            if(validPrefix.indexOf(item.phone.substring(0,3)) < 0 || item.phone.length !== 10) {
                item.status = "Invalid row";
            }
            item.ServiceProvider = validate.product(item.phone)    
            if(item.amount <= 0) {
                item.status = "Invalid row";
            }      
        });        
       // Construct arrays for each service
        const valid_rows = rows_with_phone.filter(row => row.status !== "Invalid row");
        // airtime_rows = rows_with_phone.filter(row => row.service.toLowerCase() === "airtime");
        airtime_rows = valid_rows
    
        // const rows_paysmart = valid_rows.map(row => ({
        //     reference: row.name, 
        //     phone: row.phone, 
        //     amount: row.amount
        // }))
        
        const rows_cgrate = airtime_rows.map(row => ({
            ServiceProvider: row.ServiceProvider,
            VoucherType: 'Direct-Topup',
            Recipient: '26' + row.phone, 
            Amount: row.amount,
        }))
       
        count = rows_with_phone.length
        sum = rows_with_phone.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0,);
        airtime_sum = airtime_rows.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0,);
    
        valid_rows_count = valid_rows.length
        sum_valid = valid_rows.reduce((accumulator, currentValue) => accumulator + currentValue.amount,
        0,);
    
        // Create excel file for 543 website
        worksheet = reader.utils.json_to_sheet(rows_cgrate);
        filename = path.join(os.homedir(), 'cgrate_lists', req.file.originalname)
        
        // Create pdf
        clientDetails = companyData[0]
    
        date = Date.now();
        nowDate = new Date(date).toISOString().slice(0,10)
        res.render('myList', {airtime: airtime_rows, data: data_rows, liquid: liquid_rows, momo: momo_rows, zesco: zesco_rows, count, valid_rows_count, sum, airtime_sum, data_sum, liquid_sum, momo_sum, zesco_sum, sum_valid});
    }    

    fs.unlink(req.file.path,
        (err => {
            if (err) console.log(err);
            else {
                console.log("File deleted");
            }
        }))
    
})

function excelDownload() {
    workbook = reader.utils.book_new();
    reader.utils.book_append_sheet(workbook, worksheet, 'cgrate');
    reader.writeFileXLSX(workbook, filename);
}

app.get('/excel', (_,res) => {
    excelDownload()
    res.render('download', {
        title: 'Download Complete',
        description: 'your excel file has been downloaded'
    })
});

app.get('/order', (_,res) => {
    orderCreate(airtime_rows, data_rows, liquid_rows, zesco_rows, momo_rows, airtime_sum, data_sum, liquid_sum, zesco_sum, momo_sum, clientDetails, date, nowDate, sum_valid)
    res.render('download', {
        title: 'Download Complete',
        description: 'your order pdf file has been downloaded'
    })
});

app.get('/quote', (_,res) => {
    quoteCreate(airtime_rows, data_rows, liquid_rows, zesco_rows, momo_rows, airtime_sum, data_sum, liquid_sum, zesco_sum, momo_sum, clientDetails, date, nowDate, sum_valid)
    res.render('download', {
        title: 'Download Complete',
        description: 'your quotation has been downloaded'
    })
});

app.get('/list', (_,res) => {
    res.render('myList', {airtime: airtime_rows, data: data_rows, liquid: liquid_rows, momo: momo_rows, zesco: zesco_rows, count, valid_rows_count, sum, airtime_sum, data_sum, liquid_sum, momo_sum, zesco_sum, sum_valid});
});

app.get('*', (_,res) => {
    res.render('download', {
        title: '404 PAGE NOT FOUND',
        description: 'Please contact the site administrator'
    })
})

app.listen(port, () => {
    console.log("Server is running on port " + port)
});