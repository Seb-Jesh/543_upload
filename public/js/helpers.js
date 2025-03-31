const validate = {}
validate.sanitizePhone = ((phone) => {
    phone = phone.toString().replace(/\D/g,'');
    if(phone.startsWith('00260')) {
        phone = phone.substring(4)
    }
    if(phone.startsWith('0260')) {
        phone = phone.substring(3)
    }
    if(phone.startsWith('+260')) {
        phone = phone.substring(3)
    }
    if(phone.startsWith('260')) {
        phone = phone.substring(2)
    }
    if(!phone.startsWith('0') && phone.length === 9) {
        phone = '0' + phone
    }
    return phone
});

validate.sanitizeLiquid = (phone) => {
    phone = phone.toString().replace(/\D/g,'');
    if (phone.startsWith('630')) {
        phone = '260' + phone;
    }
    return phone
}

validate.sanitizeZesco = (phone) => {
    phone = phone.toString().replace(/\D/g,'');
    return phone;
}

validate.sanitizeAmount = (amount) => {
    amount = amount.toString().replace(/[^0-9$.]/g, '');
    return Number(amount);
}

validate.product543 = (msisdn) => {
    if (msisdn.startsWith('097') || msisdn.startsWith('077')) {
        return 'Airtel'
    }
    if (msisdn.startsWith('096') || msisdn.startsWith('076')) {
        return 'MTN'
    }
    if (msisdn.startsWith('095') || msisdn.startsWith('075') || msisdn.startsWith('021')) {
        return 'Zamtel'
    }
}

module.exports = validate;
