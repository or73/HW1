/*
	 Primary file for the API
*/


// Dependencies
var http 	= require( 'http' );
var https	= require( 'https' );
var url 	= require( 'url' );
var StringDecoder 	= require( 'string_decoder' ).StringDecoder;
var config	= require ( './config' );
var fs		= require( 'fs' );

// Constants & Variables
const HTTP_PORT 	= config.httpPort;
const HTTPS_PORT	= config.httpsPort;
const MODE 				= config.envName;

// Instantiate the HTTP server
var server = http.createServer( function ( req, res ) {
	unifiedServer( req, res );
} );

// Start the HTTP server, and have it listening on some port 3000 --> staging   5000 --> production
server.listen( HTTP_PORT, function () {
	console.log( `The server is listening on <http port> --> ${ HTTP_PORT } in -> ${ MODE.toUpperCase() } <- mode`)
} );


// Define the handlers
var handlers	= {};

// Hello handler
handlers.hello	= function ( data, callback ) {
	// Callback a http status code, and a payload - object
	callback( 406, { 'name': 'Welcome to my application' } );
};

// Not found handler
handlers.notFound	= function ( data, callback ) {
	callback( 404 );
};

// Define a request router
var router = {
	'hello'	:	handlers.hello
};




// For testing purposes:  NODE_ENV=staging node index.js       NODE_ENV=production node index.js


// All the server logic for toth the http and https server
var unifiedServer	= function ( req, res ) {
	// Get the URL and parse it
	var parsedUrl	= url.parse( req.url, true );

	// Get the path from the URL
	var path	= parsedUrl.pathname;
	var trimmedPath	= path.replace( /^\/+|\/+$/g, '' );

	// Get the query string as an object
	var queryStringObject	= parsedUrl.query;

	// Get the HTTP Method
	var method	= req.method.toLowerCase();

	// Get the headers as an object
	var headers	= req.headers;

	// Get the payload, if any
	var decoder	= new StringDecoder( 'utf-8' );
	var buffer	= '';
	req.on( 'data', function ( data ) {
		buffer += decoder.write( data );
	} );

	req.on( 'end', function () {
		buffer += decoder.end();

		// Choose the handler this request should go to. If one is nor found, use the norFound handler
		var chosenHandler	= typeof( router[ trimmedPath ] ) !== 'undefined' ? router[ trimmedPath ] : handlers.notFound;

		// Construct the data object to send to the handler
		var data	= {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': buffer
		};

		// Route the request to the hanlder specified in the router
		chosenHandler( data, function ( statusCode, payload) {
			// Use the statusCode calledback by the handler, or default to 200
			statusCode	= typeof( statusCode ) == 'number' ? statusCode : 200;

			// use the payload called back by the handler, or default to an empty object
			payload	= typeof( payload ) == 'object' ? payload : {};

			// Convert the payload to a string
			var payloadString	= JSON.stringify( payload );

			// Return the response
			res.setHeader( 'Content-Type', 'application/json' );
			res.writeHead( statusCode );
		  res.end( payloadString );

		  // Log the request path
		  console.log( `Returning this response: \n\tstatusCode: ${ statusCode } \n\tPayload: ${ payloadString }` );
		//console.log( `Request is received: \n\tPath: ${ trimmedPath } \n\tMethod: '${ method }' \n\tQuery string parameters: '${ JSON.stringify( queryStringObject, undefined, 2 ) }'\n\tHeaders: ${ JSON.stringify( headers, undefined, 2 ) }\n${ JSON.stringify( decoder, undefined, 2 ) }, \nPayload: ${ buffer  }` );
		} );
	} );
};


