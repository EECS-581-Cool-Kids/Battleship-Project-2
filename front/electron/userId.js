//Description: Module file for generation of userId related to the config.json file.
//Inputs: 
//Outputs: Unique UserID
//Sources: 
//Authors: Matthew Petillo, William Johnson
//Creation date: 9-10-24

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateUniqueId(length = 32) {
    let id = crypto.randomBytes(length)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, length);
    return id;
  }

function updateUserId(userId){
    //read the json file
    const filePath = path.join(__dirname, '../assets/config.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // 2. Parse the JSON data into a JavaScript object
    let jsonData = JSON.parse(data);

    if (process.argv[2] === "second" && jsonData.Build === "Dev"){
        return;
    }

    // 3. Modify the object (e.g., update the "age" property)
    jsonData.ClientId = userId;
    // 4. Write the updated object back to the JSON file
    fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
        console.error('Error writing file:', err);
        } else {
        console.log('File updated successfully');
        }
    });
    });
}

function checkClientId(){
    const filePath = path.join(__dirname, 'config.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // 2. Parse the JSON data into a JavaScript object
    let jsonData = JSON.parse(data);
    return jsonData.ClientId;
});
}

module.exports = [ checkClientId, updateUserId, generateUniqueId ]

