//Description: Module file for generation of userId related to the config.json file.
//Inputs: 
//Outputs: Unique UserID
//Sources: 
//Authors: Matthew Petillo, William Johnson
//Creation date: 9-10-24

const crypto = require('crypto');  // Crypto
const fs = require('fs');  // File system
const path = require('path');  // Path

function generateUniqueId(length = 32) {  // Generate a unique ID
    let id = crypto.randomBytes(length)  // Generate random bytes
        .toString('base64')  // Convert to base64
        .replace(/[^a-zA-Z0-9]/g, '')  // Remove non-alphanumeric characters
        .substring(0, length);  // Trim to the desired length
    return id;  // Return the ID
  }  // End generateUniqueId

function updateUserId(userId){  // Update the user ID
    //read the json file
    const filePath = path.join(__dirname, '../assets/config.json');  // Path to the JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {  // Read the file
        if (err) {  // If there's an error
            console.error('Error reading file:', err);  // Log the error
            return;  // Return
        }  // End if

        // 2. Parse the JSON data into a JavaScript object
        let jsonData = JSON.parse(data);  // Parse the JSON

        if (process.argv[2] === "second" && jsonData.Build === "Dev"){  // If the build is development
            return;  // Return
        }  // End if

        // 3. Modify the object (e.g., update the "age" property)
        jsonData.ClientId = userId;  // Update the client ID
        // 4. Write the updated object back to the JSON file
        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {  // Write the updated data back to the file
            if (err) {  // If there's an error
            console.error('Error writing file:', err);  // Log the error
            } else {  // If there's no error
            console.log('File updated successfully');  // Log the success
            }  // End if
        });  // End write file
    });  // End read file
}  // End updateUserId

function checkClientId(){  // Check the client ID
    const filePath = path.join(__dirname, 'config.json');  // Path to the JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {  // Read the file
        if (err) {  // If there's an error
            console.error('Error reading file:', err); // Log the error
            return; // Return
        } // End if

        // 2. Parse the JSON data into a JavaScript object
        let jsonData = JSON.parse(data); // Parse the JSON
        return jsonData.ClientId; // Return the client ID
    }); // End read file
} // End checkClientId

module.exports = [ checkClientId, updateUserId, generateUniqueId ]

