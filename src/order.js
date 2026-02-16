import PDFDocument from "pdfkit";
import fs from "fs";

export default function orderCreate(airtime_rows, data_rows, liquid_rows, zesco_rows, momo_rows, airtime_sum, data_sum, liquid_sum, zesco_sum, momo_sum, clientDetails, date, nowDate, sum_valid) {
    // Create a document
    const doc = new PDFDocument({margins: {top: 20, bottom: 20, left: 72, right: 72}});
    doc.on('pageAdded', () => doc.text(clientDetails.name || 'YallaPay Services', { align: 'center' }));
    
    const filename = `Order_${date}.pdf`;
    const writeStream = fs.createWriteStream(filename);

    const fees_qty = data_rows.length + liquid_rows.length + momo_rows.length

    const airtimeLength = airtime_rows.length > 0 ? 1 : 0;
    const dataLength = data_rows.length > 0 ? 1 : 0;
    const liquidLength = liquid_rows.length > 0 ? 1 : 0;
    const zescoLength = zesco_rows.length > 0 ? 1 : 0;
    const momoLength = momo_rows.length > 0 ? 1 : 0;
    const feesLength = fees_qty > 0 ? 1 : 0;

    const rows = airtimeLength + dataLength + liquidLength + zescoLength + momoLength + feesLength
    const height = rows === 5 ? 160 : rows === 4 ? 140 : rows === 3 ? 120 : rows === 2 ? 95 : 75;
    const lineY = rows === 5 ? 473 : rows === 4 ? 450.5 : rows === 3 ? 428 : rows === 2 ? 405.5 : 383;
    
    doc.pipe(writeStream);
    
    // Client Logo
    if (clientDetails.logo) {doc.image(clientDetails.logo, 20, 10, {height: 60})}
    doc.moveDown();
    
    doc.font('Times-Bold').fontSize(16).text('PURCHASE ORDER', doc.x, 85, { align: 'center' })
    doc.moveDown();
    
    doc.font('Times-Roman').fontSize(12).text(`P.O Number: ${clientDetails.order || date}`)
    doc.moveUp();
    doc.text(`Date: ${nowDate}`, 350, doc.y)
    doc.moveDown();
    
    // PaySmart Payment Portal Details
    doc.lineWidth(0.5);
    doc.rect(33, doc.y, 200, 100).stroke();
    doc.rect(390, doc.y, 200, 100).stroke();
    doc.moveDown();
    doc.font('Times-Bold').fontSize(12).text('Supplier:', 40, doc.y, { align: 'left' });
    doc.moveUp();
    doc.text('Bill To:', 400, doc.y, { align: 'left' });
    
    doc.font('Times-Roman').fontSize(10).text('PaySmart Payment Portal', 40, doc.y, { align: 'left' });
    doc.moveUp();
    doc.text(clientDetails.name || 'YallaPay Services', 400, doc.y, { width: 200, align: 'left' });
    doc.text('Unit 104 Woodgate House', 40, doc.y, { align: 'left' });
    doc.moveUp();
    doc.text(clientDetails.addressLine1 || 'Unit 104 Woodgate House', 400, doc.y, { width: 200, align: 'left' });
    doc.text('Central Business District', 40, doc.y, { align: 'left' });
    doc.moveUp();
    
    doc.text(clientDetails.addressLine2 || 'Lusaka', 400, doc.y, { width: 200, align: 'left' });
    doc.text('Lusaka, Zambia', 40, doc.y, { align: 'left' });
    doc.moveUp();
    
    doc.text(clientDetails.addressLine3 || 'Zambia', 400, doc.y, { width: 200, align: 'left' });
    doc.text('Mobile: 0974339546', 40, doc.y, { align: 'left' });
    doc.moveUp();
    
    doc.text(`Mobile: 0${clientDetails.phone}` || 'Cell 0974339546', 400, doc.y, { align: 'left' });
    doc.fillColor('blue').text('sebastian.israel@paysmart.co.zm', 40, doc.y, { align: 'left' });
    doc.moveUp();
    
    doc.text(clientDetails.email || 'Cell 0974339546', 400, doc.y, { width: 200, align: 'left' });
    
    doc.moveDown(2);
    
    doc.rect(33, doc.y, 200, 60).stroke();
    doc.rect(390, doc.y, 200, 60).stroke();
    doc.moveDown();
    doc.fillColor('black').font('Times-Bold').fontSize(12).text('Load to:', 40, doc.y);
    doc.moveUp();
    doc.text('Requisitioned by:', 400, doc.y, { align: 'left' });
    doc.moveDown();
    doc.font('Times-Roman').fontSize(10).text('List provided on page 2', 40, doc.y)
    doc.moveUp();
    doc.text(clientDetails.requisitioner, 400, doc.y, { align: 'left' })
    doc.moveDown(2);
    
    // Order details headings
    doc.rect(40, doc.y, 540, height).stroke();
    doc.font('Times-Bold').text('Description', 45, 350);
    doc.text('Quantity', 290, 350);
    doc.text('Unit', 350, 350);
    doc.text('Unit Price (ZMW)', 390, 350);
    doc.text('Total (ZMW)', 480, 350);
    doc.moveTo(40, 364).lineTo(580, 364).stroke();
    // Draw vertical lines
    doc.moveTo(285, 339).lineTo(285, lineY).stroke();
    doc.moveTo(345, 339).lineTo(345, lineY).stroke();
    doc.moveTo(385, 339).lineTo(385, lineY).stroke();
    doc.moveTo(475, 339).lineTo(475, lineY).stroke();
    doc.moveDown();    

    const airtime_qty = airtime_rows.length > 0 && airtime_rows.every( (val) => val.amount === airtime_rows[0].amount ) ? airtime_rows.length : 1;
    const airtime_desc = 'Airtime Direct-Topup';
    const unit = 'Each';
    const airtime_unit_price = airtime_rows.length > 0 && airtime_rows.every( (val) => val.amount === airtime_rows[0].amount ) ? airtime_rows[0].amount : airtime_sum;
    const airtime_total = airtime_qty * airtime_unit_price;

    const data_qty = data_rows.length > 0 && data_rows.every( (val) => val.amount === data_rows[0].amount ) ? data_rows.length : 1;
    const data_desc = 'Mobile Data Topup';
    const data_unit_price = data_rows.length > 0 && data_rows.every( (val) => val.amount === data_rows[0].amount ) ? data_rows[0].amount : data_sum;
    const data_total = data_qty * data_unit_price;

    const liquid_qty = liquid_rows.length > 0 && liquid_rows.every( (val) => val.amount === liquid_rows[0].amount ) ? liquid_rows.length : 1;
    const liquid_desc = 'Liquid Data Topup';
    const liquid_unit_price = liquid_rows.length > 0 && liquid_rows.every( (val) => val.amount === liquid_rows[0].amount ) ? liquid_rows[0].amount : liquid_sum;
    const liquid_total = liquid_qty * liquid_unit_price;

    const zesco_qty = zesco_rows.length > 0 && zesco_rows.every( (val) => val.amount === zesco_rows[0].amount ) ? zesco_rows.length : 1;
    const zesco_desc = 'Zesco Token';
    const zesco_unit_price = zesco_rows.length > 0 && zesco_rows.every( (val) => val.amount === zesco_rows[0].amount ) ? zesco_rows[0].amount : zesco_sum;
    const zesco_total = zesco_qty * zesco_unit_price;

    const momo_qty = momo_rows.length > 0 && momo_rows.every( (val) => val.amount === momo_rows[0].amount ) ? momo_rows.length : 1;
    const momo_desc = 'Mobile Money Deposit';
    const momo_unit_price = momo_rows.length > 0 && momo_rows.every( (val) => val.amount === momo_rows[0].amount ) ? momo_rows[0].amount : momo_sum;
    const momo_total = momo_qty * momo_unit_price;    
    
    // Order invoice
    doc.font('Times-Roman')
    if(airtime_rows.length > 0) {
        doc.text(airtime_desc, 45, doc.y);
        doc.moveUp();
        doc.text(airtime_qty, 300, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(unit, 350, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(airtime_unit_price, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(airtime_total, 490, doc.y, { width: 40, align: 'right' });
        doc.moveTo(40, doc.y).lineTo(580, doc.y).stroke();
        doc.moveDown();
    }
    if(data_rows.length > 0) {
        doc.text(data_desc, 45, doc.y);
        doc.moveUp();
        doc.text(data_qty, 300, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(unit, 350, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(data_unit_price, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(data_total, 490, doc.y, { width: 40, align: 'right' });
        doc.moveTo(40, doc.y).lineTo(580, doc.y).stroke();
        doc.moveDown();
    }
    if(liquid_rows.length > 0) {
        doc.text(liquid_desc, 45, doc.y);
        doc.moveUp();
        doc.text(liquid_qty, 300, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(unit, 350, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(liquid_unit_price, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(liquid_total, 490, doc.y, { width: 40, align: 'right' });
        doc.moveTo(40, doc.y).lineTo(580, doc.y).stroke();
        doc.moveDown();
    }
    if(zesco_rows.length > 0) {
        doc.text(zesco_desc, 45, doc.y);
        doc.moveUp();
        doc.text(zesco_qty, 300, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(unit, 350, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(zesco_unit_price, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(zesco_total, 490, doc.y, { width: 40, align: 'right' });
        doc.moveTo(40, doc.y).lineTo(580, doc.y).stroke();
        doc.moveDown();
    }
    if(momo_rows.length > 0) {
        doc.text(momo_desc, 45, doc.y);
        doc.moveUp();
        doc.text(momo_qty, 300, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(unit, 350, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(momo_unit_price, 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(momo_total, 490, doc.y, { width: 40, align: 'right' });
        doc.moveTo(40, doc.y).lineTo(580, doc.y).stroke();
        doc.moveDown();
    }
    if (fees_qty > 0) {
        doc.text("Handling fees", 45, doc.y);
        doc.moveUp();
        doc.text(fees_qty, 300, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text(unit, 350, doc.y, { width: 20, align: 'center' });
        doc.moveUp();
        doc.text("5", 400, doc.y, { width: 40, align: 'right' });
        doc.moveUp();
        doc.text(fees_qty*5, 490, doc.y, { width: 40, align: 'right' });
        doc.moveTo(40, doc.y).lineTo(580, doc.y).stroke();
        doc.moveDown();
    }
    doc.font('Times-Bold').fontSize(12).text('Total purchase order amount (ZMW)', 280, doc.y);
    doc.moveUp();
    doc.text(sum_valid+fees_qty*5, 480, doc.y, { width: 40, align: 'right' });
    doc.moveDown();
    
    // Terms of the order (doc.y === 520 and 525)
    doc.rect(33, doc.y, 560, 230).stroke();
    doc.moveDown();
    doc.text('Additional Notes:', 40, doc.y);
    doc.font('Times-Roman').fontSize(10).text('1. The standard terms and conditions of service as per Paysmart Service Agreement apply to this order');
    doc.text('2. This purchase order when completed and signed by both parties will be binding on both parties')
    doc.text('3. Please notify us immediately if for any reason you are unable to fulfill the order')
    
    // Signatures 1
    doc.moveTo(33, doc.y).lineTo(592, doc.y).stroke();
    doc.moveDown();
    doc.font('Times-Bold').fontSize(12).text('Signatures:', { align: 'center' });
    doc.font('Times-Roman').fontSize(10).text('1. The Supplier agrees to deliver the Services described in this purchase order and to comply with all terms & conditions')
    doc.text('2. Delivery of the Services described in this order constitutes effective execution of this order by the supplier')
    doc.moveTo(33, doc.y).lineTo(592, doc.y).stroke();
    // Straight line down dividing the two signatures
    doc.rect(310, doc.y, 0, 120).stroke();
    doc.moveDown();
    // Section for Signatures of the 2 parties
    doc.font('Times-Bold').fontSize(12).text(`For: ${clientDetails.name}`, { align: 'left' });
    doc.moveUp();
    doc.text('For: Paysmart Payment Portal', 320, doc.y);
    doc.moveDown();
    doc.font('Times-Roman').fontSize(10).text('Signature: ', 40, doc.y);
    doc.moveUp();
    doc.text('Signature: ', 320, doc.y);
    doc.moveTo(33, doc.y).lineTo(592, doc.y).stroke();
    doc.moveDown();
    doc.text('Name: ', 40, doc.y);
    doc.moveUp();
    doc.text('Name: ', 320, doc.y);
    doc.moveTo(33, doc.y).lineTo(592, doc.y).stroke();
    doc.moveDown();
    doc.text('Title: ', 40, doc.y);
    doc.moveUp();
    doc.text('Title: ', 320, doc.y);
    doc.moveTo(33, doc.y).lineTo(592, doc.y).stroke();
    doc.moveDown();
    doc.text('Date: ', 40, doc.y);
    doc.moveUp();
    doc.text('Date: ', 320, doc.y);
    
    // Client List
    // Add different margins on each side
    doc.addPage({
        margins: {
        top: 20,
        bottom: 20,
        left: 72,
        right: 72
        }
    });
    doc.moveTo(25, 50).lineTo(580, 50).stroke();
    doc.font('Times-Roman').fontSize(10).text('Recipient', doc.x, 60);
    doc.text('#', 25, 60);
    doc.text('Phone', 270, 60);
    doc.text('Service', 350, 60);
    doc.text('Amount', 505, 60);
    doc.moveTo(25, 74).lineTo(580, 74).stroke();
    doc.moveDown();
    
    // Order purchase details
    airtime_rows.forEach((item, index) => {
        doc.fontSize(10).text(index + 1, 30, doc.y);
        doc.moveUp();
        doc.fontSize(10).text(item.name, 74, doc.y);
        doc.moveUp();
        doc.text(item.phone, 250, doc.y, { width: 70, align: 'right' });
        doc.moveUp();
        doc.text('Airtime Direct Top up', 350, doc.y, { width: 120, align: 'left' });
        doc.moveUp();
        doc.text(`${item.amount.toFixed(2)}`, 490, doc.y, { width: 50, align: 'right' });
    });
    data_rows.forEach((item, index) => {
        doc.fontSize(10).text(airtime_rows.length + index + 1, 30, doc.y);
        doc.moveUp();
        doc.fontSize(10).text(item.name, 74, doc.y);
        doc.moveUp();
        doc.text(item.phone, 250, doc.y, { width: 70, align: 'right' });
        doc.moveUp();
        doc.text('Mobile Data Topup', 350, doc.y, { width: 120, align: 'left' });
        doc.moveUp();
        doc.text(`${item.amount.toFixed(2)}`, 490, doc.y, { width: 50, align: 'right' });
    });
    liquid_rows.forEach((item, index) => {
        doc.fontSize(10).text(airtime_rows.length + data_rows.length + index + 1, 30, doc.y);
        doc.moveUp();
        doc.fontSize(10).text(item.name, 74, doc.y);
        doc.moveUp();
        doc.text(item.phone, 250, doc.y, { width: 70, align: 'right' });
        doc.moveUp();
        doc.text('Liquid Data Topup', 350, doc.y, { width: 120, align: 'left' });
        doc.moveUp();
        doc.text(`${item.amount.toFixed(2)}`, 490, doc.y, { width: 50, align: 'right' });
    });
    zesco_rows.forEach((item, index) => {
        doc.fontSize(10).text(airtime_rows.length + data_rows.length + liquid_rows.length + index + 1, 30, doc.y);
        doc.moveUp();
        doc.fontSize(10).text(item.name, 74, doc.y);
        doc.moveUp();
        doc.text(item.phone, 250, doc.y, { width: 70, align: 'right' }); 
        doc.moveUp();
        doc.text('Zesco Token', 350, doc.y, { width: 120, align: 'left' });
        doc.moveUp();
        doc.text(`${item.amount.toFixed(2)}`, 490, doc.y, { width: 50, align: 'right' });
    });
    momo_rows.forEach((item, index) => {
        doc.fontSize(10).text(airtime_rows.length + data_rows.length + liquid_rows.length + zesco_rows.length + index + 1, 30, doc.y);
        doc.moveUp();
        doc.fontSize(10).text(item.name, 74, doc.y);
        doc.moveUp();
        doc.text(item.phone, 250, doc.y, { width: 70, align: 'right' });
        doc.moveUp();
        doc.text('Mobile Money Deposit', 350, doc.y, { width: 120, align: 'left' });
        doc.moveUp();
        doc.text(`${item.amount.toFixed(2)}`, 490, doc.y, { width: 50, align: 'right' });
    });
    
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
    
    // Total
    doc.lineWidth(1.5);
    doc.moveDown();
    doc.text(`${sum_valid.toFixed(2)}`, 490, doc.y, { width: 50, align: 'right' });
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
    
    // Footer
    doc.moveDown(2);
    // doc.fontSize(10).text(companyDetails.footer || 'Thank you for your business!', { align: 'left' });
    
    // Finalize PDF file
    doc.end();
}