/* update-client-id.js
Description: A script that resets the client ID value in the config.json file to `null`
Inputs: None
Outputs: None
Sources: None.
Authors: William Johnson
Creation date: 9-15-24
*/

const fs = require('fs'); // File system
const path = './front/assets/config.json'; // Path to the JSON file

// Read the config file
fs.readFile(path, 'utf8', (err, data) => { // Read the file
    if (err) { // If there
        console.error(`Error reading file: ${err}`); // Log the error
        process.exit(1); // Exit the
    } // End if

    let config; // Config object
    try { // Try to parse the JSON
        config = JSON.parse(data); // Parse the JSON
    } catch (err) { // If there is an error
        console.error(`Error parsing JSON: ${err}`); // Log the error
        process.exit(1); // Exit the process
    } // End try

    // Set ClientId to null
    config.ClientId = null; // Set the client ID to null

    // Write the updated config back to the file
    fs.writeFile(path, JSON.stringify(config, null, 4), (err) => { // Write the updated data back to the file
        if (err) { // If there's an error
            console.error(`Error writing file: ${err}`); // Log the error
            process.exit(1); // Exit the process
        } // End if
        console.log('ClientId has been set to null.'); // Log the success
    }); // End write file
}); // End read file
