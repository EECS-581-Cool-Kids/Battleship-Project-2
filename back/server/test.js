/* test.js
Description: A test program that serves a testing web page where sockets.io can be tested easily. This isn't used during run time but is left here as a testing artifact.
Inputs: None
Outputs: None
Sources: node.js and sockets.io official documentation
Authors: William Johnson
Creation date: 9-10-24
*/

const express = require('express'); // Import the express library
const http = require('http'); // Import the http library
const path = require('path'); // Import the path library
const bodyParser = require('body-parser'); // Import the body-parser library

const app = express(); // Create an express app
const server = http.createServer(app); // Create a server using the express app

app.use(bodyParser.json()); // Use the body-parser library to parse JSON

app.use(express.static(path.join(__dirname, 'assets'))); // Serve the assets directory

const port = 3000; // The port the server will listen on
const localNetworkHost = '0.0.0.0'; // The host the server will listen on

app.get('/', (req, res) => { // When a request is made to the root
    res.sendFile(path.join(__dirname, 'assets', 'serverSocketTesting.html')); // Send the serverSocketTesting.html file
}); // End when a request is made to the root

server.listen(port, localNetworkHost, () => { // Listen on the specified port and host
    console.log(`Server Tester is now active on http://${localNetworkHost}:${port}`); // Log that the server is active
}); // End listen on the specified port and host
