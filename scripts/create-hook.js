/* create-hook.js
Description: A test program to insert a pre-commit hook to handle clean up. We ended up not using this, but I'm leaving it in as an interesting idea.
Inputs: None
Outputs: None
Sources: git official documentation.
Authors: William Johnson
Creation date: 9-15-24
*/
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'pre-commit');
const destinationPath = path.join(__dirname, '../.git/hooks', 'pre-commit');

if (fs.existsSync(destinationPath)) {
    console.log('File already exists, no action taken.');
} else {
    fs.copyFile(sourcePath, destinationPath, (err) => {
        if (err) {
            console.error('Error moving the file:', err);
        } else {
            console.log(`File moved to ${destinationPath}`);
        }
    });
}
