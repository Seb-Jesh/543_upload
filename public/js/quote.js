import PDFDocument from "pdfkit";
import fs from "fs";

export default function quoteCreate(airtime_rows, data_rows, liquid_rows, zesco_rows, momo_rows, airtime_sum, data_sum, liquid_sum, zesco_sum, momo_sum, clientDetails, date, nowDate, sum_valid) {
    const companyDetails = {
        name: 'Paysmart Payment Portal',
        addressLine1: 'Unit 104 Woodgate House',
        addressLine2: 'Cairo road, CBD',
        addressLine3: 'Lusaka, Zambia',
        contact: 'Sebastian Israel, Cell: 097433946',
        bankAccounts: [
            {
                accountName: 'Paysmart Payment Portal',
                bankName: 'Zanaco',
                branchName: 'Waterfalls',
                accountNumber: '5655188500170',
                sortCode: '01-00-99',
                swiftCode: 'ZNCOZMLU'
            },
            {
                accountName: 'Paysmart Payment Portal',
                bankName: 'FNB',
                branchName: 'Chilenje',
                accountNumber: '62762400499',
                sortCode: '26-00-46',
                swiftCode: 'FIRNZMLX'
            }
        ]
    }

    const airtime_qty = airtime_rows.length > 0 && airtime_rows.every( (val) => val.amount === airtime_rows[0].amount ) ? airtime_rows.length : 1;
    const airtime_unit_price = airtime_rows.length > 0 && airtime_rows.every( (val) => val.amount === airtime_rows[0].amount ) ? airtime_rows[0].amount : airtime_sum;
    const airtime_total = airtime_qty * airtime_unit_price;

    const data_qty = data_rows.length > 0 && data_rows.every( (val) => val.amount === data_rows[0].amount ) ? data_rows.length : 1;
    const data_unit_price = data_rows.length > 0 && data_rows.every( (val) => val.amount === data_rows[0].amount ) ? data_rows[0].amount : data_sum;
    const data_total = data_qty * data_unit_price;

    const liquid_qty = liquid_rows.length > 0 && liquid_rows.every( (val) => val.amount === liquid_rows[0].amount ) ? liquid_rows.length : 1;
    const liquid_unit_price = liquid_rows.length > 0 && liquid_rows.every( (val) => val.amount === liquid_rows[0].amount ) ? liquid_rows[0].amount : liquid_sum;
    const liquid_total = liquid_qty * liquid_unit_price;

    const zesco_qty = zesco_rows.length > 0 && zesco_rows.every( (val) => val.amount === zesco_rows[0].amount ) ? zesco_rows.length : 1;
    const zesco_unit_price = zesco_rows.length > 0 && zesco_rows.every( (val) => val.amount === zesco_rows[0].amount ) ? zesco_rows[0].amount : zesco_sum;
    const zesco_total = zesco_qty * zesco_unit_price;

    const momo_qty = momo_rows.length > 0 && momo_rows.every( (val) => val.amount === momo_rows[0].amount ) ? momo_rows.length : 1;
    const momo_unit_price = momo_rows.length > 0 && momo_rows.every( (val) => val.amount === momo_rows[0].amount ) ? momo_rows[0].amount : momo_sum;
    const momo_total = momo_qty * momo_unit_price;

    const fees_qty = data_rows.length + liquid_rows.length + momo_rows.length;
    const fees_unit_price = 5;
    const fees_total = fees_qty * fees_unit_price;

    const sum_total = sum_valid + fees_total;
    
    // Create a document
    const doc = new PDFDocument();
    
    const filename = `Quote_${date}.pdf`;
    const writeStream = fs.createWriteStream(filename);
    
    doc.pipe(writeStream);
    
    // Blue band with company name and address title
    doc.rect(0, 0, 800, 60).lineWidth(0).fillOpacity(0.8).fill("#039dfc");
    doc.fillColor('white').fillOpacity(1).font('Times-Bold').fontSize(24).text("PAYSMART PAYMENT PORTAL", 30,15, { align: 'center' });
    doc.fontSize(10).text("Unit 104 Woodgate House, Cairo road, Lusaka CBD", { align: 'center' })
    doc.moveDown(2);
    
    // Document Title
    doc.fillColor('black').font('Times-Bold').fontSize(24).text("QUOTATION", { align: 'center' });
    doc.moveDown();
    
    // Add Client details
    doc.fillColor('black').fontSize(10).text(clientDetails.name, 30, doc.y)
    doc.moveUp();
    doc.text("Issue date", 260, doc.y);
    doc.font('Times-Roman').text(clientDetails.addressLine1, 30, doc.y);
    doc.moveUp();
    doc.text(nowDate, 260, doc.y);
    doc.text(clientDetails.addressLine2, 30, doc.y);
    doc.text(clientDetails.addressLine3, 30, doc.y);
    doc.moveUp();
    doc.font("Times-Bold").text("Reference", 260, doc.y);
    doc.font("Times-Roman").text(date);
    
    // Add an image, constrain it to a given size, and center it horizontally
    doc.image('public/img/paysmartLogo.jpeg', 400, 80, {
        fit: [400, 90]
      });
    doc.moveDown(3);
    
    // Items table
    doc.rect(0, 200, 800, 30).lineWidth(0).fillOpacity(0.8).fill("#039dfc");
    doc.fillColor('white').fillOpacity(1).font("Times-Bold").text('Description', 30, 210);
    doc.text('Quantity', 300, 210);
    doc.text('Price', 400, 210);
    doc.text('Amount', 500, 210);
    doc.moveDown(2);

    doc.fillColor('black').font("Times-Roman").fontSize(10)
    // Airtime
    if (airtime_rows.length) {
        doc.text("Airtime Direct Topup", 30, doc.y);
        doc.moveUp();
        doc.text(airtime_qty.toString(), 300, doc.y, { width: 30, align: 'right' });
        doc.moveUp();
        doc.text(`${airtime_unit_price.toFixed(2)}`, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(`${airtime_total.toFixed(2)}`, 500, doc.y, { width: 50, align: 'right' });
        doc.strokeColor("blue").strokeOpacity(0.2).moveTo(0, doc.y).lineTo(800, doc.y).stroke();
        doc.moveDown();
    }

    // Mobile Data
    if (data_rows.length) {
        doc.text("Mobile Data Topup", 30, doc.y);
        doc.moveUp();
        doc.text(data_qty.toString(), 300, doc.y, { width: 30, align: 'right' });
        doc.moveUp();
        doc.text(`${data_unit_price.toFixed(2)}`, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(`${data_total.toFixed(2)}`, 500, doc.y, { width: 50, align: 'right' });
        doc.strokeColor("blue").strokeOpacity(0.2).moveTo(0, doc.y).lineTo(800, doc.y).stroke();
        doc.moveDown();
    }

    // Liquid Data
    if (liquid_rows.length) {
        doc.text("Liquid Data Topup", 30, doc.y);
        doc.moveUp();
        doc.text(liquid_qty.toString(), 300, doc.y, { width: 30, align: 'right' });
        doc.moveUp();
        doc.text(`${liquid_unit_price.toFixed(2)}`, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(`${liquid_total.toFixed(2)}`, 500, doc.y, { width: 50, align: 'right' });
        doc.strokeColor("blue").strokeOpacity(0.2).moveTo(0, doc.y).lineTo(800, doc.y).stroke();
        doc.moveDown();
    }

    // Zesco
    if (zesco_rows.length) {
        doc.text("Zesco Token", 30, doc.y);
        doc.moveUp();
        doc.text(zesco_qty.toString(), 300, doc.y, { width: 30, align: 'right' });
        doc.moveUp();
        doc.text(`${zesco_unit_price.toFixed(2)}`, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(`${zesco_total.toFixed(2)}`, 500, doc.y, { width: 50, align: 'right' });
        doc.strokeColor("blue").strokeOpacity(0.2).moveTo(0, doc.y).lineTo(800, doc.y).stroke();
        doc.moveDown();
    }

    // Mobile Money Deposit
    if (momo_rows.length > 0) {
        doc.text("Mobile Money Deposit", 30, doc.y);
        doc.moveUp();
        doc.text(momo_qty.toString(), 300, doc.y, { width: 30, align: 'right' });
        doc.moveUp();
        doc.text(`${momo_unit_price.toFixed(2)}`, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(`${momo_total.toFixed(2)}`, 500, doc.y, { width: 50, align: 'right' });
        doc.strokeColor("blue").strokeOpacity(0.2).moveTo(0, doc.y).lineTo(800, doc.y).stroke();
        doc.moveDown();
    }

    // Handling Fees
    if (fees_qty > 0) {
        doc.text("Handling Fees", 30, doc.y);
        doc.moveUp();
        doc.text(fees_qty.toString(), 300, doc.y, { width: 30, align: 'right' });
        doc.moveUp();
        doc.text(`${fees_unit_price.toFixed(2)}`, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(`${fees_total.toFixed(2)}`, 500, doc.y, { width: 50, align: 'right' });
        doc.strokeColor("blue").strokeOpacity(0.2).moveTo(0, doc.y).lineTo(800, doc.y).stroke();
        doc.moveDown();
    }
    
    // Total
    doc.moveUp()
    doc.rect(460, doc.y, 150, 30).lineWidth(0).fillOpacity(0.8).fill("#039dfc");
    doc.moveDown();
    doc.fillColor('white').fillOpacity(1).font("Times-Bold").fontSize(12).text(`${sum_total.toFixed(2)} ZMW`, 460, doc.y, { width: 100, align: 'right' });
    
    // Bank details
    doc.moveDown(2);
    doc.fillColor('black').font('Times-Bold').fontSize(10).text('BANK DETAILS', 30, doc.y);
    companyDetails.bankAccounts.forEach(item => {
        doc.font('Times-Roman').fontSize(8).text('Account Name:', 30, doc.y).moveUp();
        doc.text(item.accountName, 135, doc.y);
        doc.text('Bank Name:', 30, doc.y).moveUp();
        doc.text(item.bankName, 135, doc.y);
        doc.text('Branch Name:', 30, doc.y).moveUp();
        doc.text(item.branchName, 135, doc.y);
        doc.text('Account Number:', 30, doc.y).moveUp();
        doc.text(item.accountNumber, 135, doc.y);
        doc.text('Sort Code:', 30, doc.y).moveUp();
        doc.text(item.sortCode, 135, doc.y);
        doc.text('Swift Code:', 30, doc.y).moveUp();
        doc.text(item.swiftCode, 135, doc.y);
        doc.moveDown()
    });
    
    // Terms & Conditions
    doc.font('Times-Bold').fontSize(10).text('DELIVERY TERMS', 30, doc.y);
    doc.font('Times-Roman').fontSize(8).text('1. Ex-Stock');
    doc.moveDown()
    doc.font('Times-Bold').fontSize(10).text('PAYMENT TERMS', 30, doc.y);
    doc.font('Times-Roman').fontSize(8).text('1. Prepaid');
    doc.moveDown()
    doc.font('Times-Bold').fontSize(10).text('OTHER TERMS', 30, doc.y);
    doc.font('Times-Roman').fontSize(8).text('1. Airtime & Data bundles are not reversible');
    doc.text("2. Reversal of mobile money incurs a cost and is only possible with the consent of the recipient")
    
    // Footer Ribbon
    doc.rect(0, 750, 800, 50).lineWidth(0).fillOpacity(0.8).fill("#039dfc");
    
    // Finalize PDF file
    doc.end();
}
