/* create-hook.js
Description: A test program to insert a pre-commit hook to handle clean up. We ended up not using this, but I'm leaving it in as an interesting idea.
Inputs: None
Outputs: None
Sources: git official documentation.
Authors: William Johnson
Creation date: 9-15-24
*/
const fs = require('fs'); //file system
const path = require('path'); //path

const sourcePath = path.join(__dirname, 'pre-commit'); //path to pre-commit file
const destinationPath = path.join(__dirname, '../.git/hooks', 'pre-commit'); //path to pre-commit file in .git/hooks

if (fs.existsSync(destinationPath)) { //if file exists
    console.log('File already exists, no action taken.'); //log
} else { //else
    fs.copyFile(sourcePath, destinationPath, (err) => { //copy file
        if (err) { //if error
            console.error('Error moving the file:', err); //log
        } else { //else
            console.log(`File moved to ${destinationPath}`); //log
        } //end if
    }); //end copyFile
} //end if
