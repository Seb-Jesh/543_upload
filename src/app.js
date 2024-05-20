const path = require('path');
const express = require('express');
const reader = require('xlsx');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000

app.set('view engine', 'hbs')

const multer = require('multer');

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'upload');
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
            return cb(new Error("File must be an excel sheet"))
        }
        cb(undefined, true)
    }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, '../public')));

app.get('', (req,res) => {
    res.render('index', {
        title: 'Upload an excel file to sanitize',
        description: 'makes your data ready for batch upload on the paysmart platform'
    })
});

app.post('/upload', upload.single('filename'), (req,res) => {
    // Handle the uploaded file
    const sanitizePhone = ((phone) => {
        // phone = phone.trim();
        phone = phone.toString().replace(/\D/g,'');
        if(phone.startsWith('0260')) {
            phone = phone.substring(4)
        }
        if(phone.startsWith('260')) {
            phone = phone.substring(3)
        }
        if(phone.startsWith('0')) {
            phone = phone.substring(1)
        }
        return phone
    });

    const sanitizeAmount = (amount => {
        amount = amount.toString().replace(/[^0-9$.]/g, '');
        // amount = amount.toString().replace(/\D/g,'');
        return Number(amount)
    })

    const validPrefix = ['97', '96', '95', '77', '76', '75', '21']
    function checkIfPhoneStartsWith(str, validPrefix) {
        return validPrefix.some(validPrefix => str.startsWith(validPrefix));
      }
    function product543(msisdn) {
        if(msisdn.startsWith(97) || msisdn.startsWith(77)) {
            return 'Airtel'
        }
        if(msisdn.startsWith(96) || msisdn.startsWith(76)) {
            return 'MTN'
        }
        if(msisdn.startsWith(95) || msisdn.startsWith(75) || msisdn.startsWith(21)) {
            return 'Zamtel'
        }
    }
    // Reading the uploaded file 
    const file = reader.readFile(req.file.path) 
    
    const csvFile = req.file.path.split('/')[1].split('.')[0]
    
    // const sheets = file.SheetNames    
    
    const data = reader.utils.sheet_to_json( 
            file.Sheets[file.SheetNames[0]]) 
    
    const rows_with_phone = data.filter(item => item.phone !== undefined)
    rows_with_phone.forEach((item) => {
        if(item.phone !== undefined) {
            item.phone = sanitizePhone(item.phone);
            item.ServiceProvider = product543(item.phone)
        }
        if(item.amount !== undefined) {
            item.amount = sanitizeAmount(item.amount);
        }        
    });
    rows_with_phone.forEach((item) => {
        if(!checkIfPhoneStartsWith(item.phone, validPrefix) || item.phone.length !== 9) {
                item.status = "Invalid number"
            }
    })
    const valid_rows = rows_with_phone.filter(row => row.status !== "Invalid number")
    const rows = valid_rows.map(row => ({
        reference: row.name, 
        phone: row.phone, 
        amount: row.amount
    }))
    
    const rows_paysmart = valid_rows.map(row => ({
        Recipient: '260' + row.phone, 
        Amount: row.amount,
        ServiceProvider: row.ServiceProvider,
        VoucherType: 'Direct-Topup'
    }))
   
    const count = rows_with_phone.length
    const sum = rows_with_phone.reduce((accumulator, currentValue) => accumulator + currentValue.amount,
    0,);
    const valid_rows_count = valid_rows.length
    const sum_valid = valid_rows.reduce((accumulator, currentValue) => accumulator + currentValue.amount,
    0,);

    // Printing data 
    // console.log(data)
    // const workbook = reader.utils.book_new();
    // reader.utils.book_append_sheet(workbook, worksheet, "Airtime");
    // reader.writeFile(workbook, "upload.xlsx");
    // var output_file_name = "../../../../Downloads/batch.csv";
    // Extract Data (create a workbook object from the table)
    const worksheet = reader.utils.json_to_sheet(rows);
    var paysmart_file_name = `../../../../Downloads/${csvFile}.csv`
    var stream = reader.stream.to_csv(worksheet);
    stream.pipe(fs.createWriteStream(paysmart_file_name));
    
    const worksheet2 = reader.utils.json_to_sheet(rows_paysmart);
    var cgrate_file_name = `../../../../Downloads/cgrate_lists/${csvFile}.xlsx`
    var stream = reader.stream.to_csv(worksheet2);
    stream.pipe(fs.createWriteStream(cgrate_file_name));

    fs.unlink(req.file.path,
        (err => {
            if (err) console.log(err);
            else {
                console.log("File deleted");
            }
        }))
    
    res.render('myList', {data: rows_with_phone, count, valid_rows_count, sum, sum_valid});
})

app.get('*', (req,res) => {
    res.send("<h1>404</h1><h1>Page Not Found</h1>")
})

app.listen(port, () => {
    console.log("Server is running on port " + port)
});