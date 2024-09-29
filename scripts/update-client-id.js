/* update-client-id.js
Description: A script that resets the client ID value in the config.json file to `null`
Inputs: None
Outputs: None
Sources: None.
Authors: William Johnson
Creation date: 9-15-24
*/

const fs = require('fs');
const path = './front/assets/config.json';

// Read the config file
fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading file: ${err}`);
        process.exit(1);
    }

    let config;
    try {
        config = JSON.parse(data);
    } catch (err) {
        console.error(`Error parsing JSON: ${err}`);
        process.exit(1);
    }

    // Set ClientId to null
    config.ClientId = null;

    // Write the updated config back to the file
    fs.writeFile(path, JSON.stringify(config, null, 4), (err) => {
        if (err) {
            console.error(`Error writing file: ${err}`);
            process.exit(1);
        }
        console.log('ClientId has been set to null.');
    });
});
