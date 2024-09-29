//Description: creates the electron client instance.
//Inputs: 
//Outputs: 
//Sources: electronjs.org
//Authors: Matthew Petillo, William Johnson
//Creation date: 9-10-24

const { app, BrowserWindow, ipcMain, contextBridge } = require('electron/main')
const fs = require('fs');
const path = require('path');
const [ checkClientId, updateUserId, generateUniqueId ] = require('./userId')//see userId.js for functions
const { spawn } = require('child_process');

// Client Setup
const userId = generateUniqueId()
updateUserId(userId)
console.log("Client " + userId + " Initialized");

//creates window and added html
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
    }
  });

  ipcMain.on('navigate-to-page', (event, page) => {
    win.loadFile(page); // Load a new HTML file
  });

  win.loadFile('../front/homeScreen/homeScreen.html'); //change this if you are changing the front page
}
//waits until computer system is ready then loads client
app.whenReady().then(() => {
    ipcMain.handle('ping', () => 'pong')
    createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow() //creates window
    }
  })

  // Handle a request from a loaded page to fetch the config file via load-config.
  ipcMain.handle('load-config', async () => {
    const configPath = path.join(__dirname, '../assets/config.json'); //path for loading config file
    const secondaryConfigPath = path.join(__dirname, '../assets/config_dev.json'); //if needed, path for loading dev config
    // Read from each config file as needed and return the correct config.
    return new Promise((resolve, reject) => {
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                const parsedData = JSON.parse(data);
                if (process.argv[2] === "second" && parsedData.Build === "Dev"){  ///this only triggers if there's a need for a second instance for dev mode
                  console.log("Dev Build Secondary Instance Mode");
                  fs.readFile(secondaryConfigPath, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(JSON.parse(data));
                    }
                  });
                } else {
                  resolve(parsedData);
                }
            }
        });
    });
  });
})

app.on('window-all-closed', () => { //triggers upon client closing
  if (process.platform !== 'darwin') {
    app.quit()
  }
});