const http = require("http");
const { StringDecoder } = require("string_decoder");
const url = require("url");
const stringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer(function (req, res) {
  // Get the url and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the http method
  const method = req.method.toLowerCase();

  // Get headers
  const headers = req.headers;

  // Get payload if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function(data) {
    buffer += decoder.write(data);
  });
  req.on('end', function() {
    buffer += decoder.end();

    // Send the response
    res.end("Hello World!\n");
  
    // LOg the request path
    console.log(
      "Request is received with this payload: ",buffer
    );

  });

});

server.listen(3000, function () {
  console.log("server is listening on port 3000");
});

// Define handlers
const handlers = {};

// Sample handler
handlers.sample = function(data, callback) {
  // Callback a status code and a payload object
  callback(406, {'name': 'sample handler'})
}

// Define not found handler
handlers.notFound = function(data, callback) {
  callback(404)
}

// Define a request router
const router = {
  'sample': handlers.sample,
}
