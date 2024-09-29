/* test.js
Description: A test program that serves a testing web page where sockets.io can be tested easily. This isn't used during run time but is left here as a testing artifact.
Inputs: None
Outputs: None
Sources: node.js and sockets.io official documentation
Authors: William Johnson
Creation date: 9-10-24
*/

const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'assets')));

const port = 3000;
const localNetworkHost = '0.0.0.0';

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'serverSocketTesting.html'));
});

server.listen(port, localNetworkHost, () => {
    console.log(`Server Tester is now active on http://${localNetworkHost}:${port}`);
});
