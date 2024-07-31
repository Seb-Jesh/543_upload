/*
* Demo file for the API
*
*
*/

// Dependencies
const http = require('http');

// Instantiate the HTTP Server
const httpServer = http.createServer((req, res) => {
    const validPrefix = ['97', '96', '95', '77', '76', '75', '21']
    // function checkIfPhoneStartsWith(str, validPrefix) {
    //     return validPrefix.some(validPrefix => str.startsWith(validPrefix));
    //   }
    // console.log(checkIfPhoneStartsWith('974339546', validPrefix))
    const phone = '994339546'
    console.log(validPrefix.indexOf(phone.substring(0,2)) > -1)
    res.end('Hello World!');
})

// Start the HTTP Server
httpServer.listen(3000, () => {
    console.log('http Server is listening on port 3000');
})