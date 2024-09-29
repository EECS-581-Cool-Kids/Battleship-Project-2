//Description: creates the electron client instance.
//Inputs: 
//Outputs: 
//Sources: electronjs.org
//Authors: Matthew Petillo, William Johnson
//Creation date: 9-10-24

const { app, BrowserWindow, ipcMain, contextBridge } = require('electron/main') //electron imports
const fs = require('fs'); //file system
const path = require('path'); //path
const [ checkClientId, updateUserId, generateUniqueId ] = require('./userId')//see userId.js for functions
const { spawn } = require('child_process'); //child process

// Client Setup
const userId = generateUniqueId() //generates a unique id for the client
updateUserId(userId) //updates the user id
console.log("Client " + userId + " Initialized"); //logs the user id

//creates window and added html
const createWindow = () => { //creates window
  const win = new BrowserWindow({ //creates window
    width: 1920, //width
    height: 1080, //height
    webPreferences: { //web preferences
        preload: path.join(__dirname, 'preload.js'), //preload
        nodeIntegration: false, //node integration
        contextIsolation: true, //context isolation
    } //end web preferences
  });   //end BrowserWindow

  ipcMain.on('navigate-to-page', (event, page) => { //triggers when a page is navigated to
    win.loadFile(page); // Load a new HTML file
  }); //end ipcMain

  win.loadFile('../front/homeScreen/homeScreen.html'); //change this if you are changing the front page
}
//waits until computer system is ready then loads client
app.whenReady().then(() => { //waits until computer system is ready then loads client
    ipcMain.handle('ping', () => 'pong') //ping pong
    createWindow() //creates window

  app.on('activate', () => { //triggers when app is activated
    if (BrowserWindow.getAllWindows().length === 0) { //if no windows
      createWindow() //creates window
    } //end if
  }) //end app on activate

  // Handle a request from a loaded page to fetch the config file via load-config.
  ipcMain.handle('load-config', async () => { //loads config
    const configPath = path.join(__dirname, '../assets/config.json'); //path for loading config file
    const secondaryConfigPath = path.join(__dirname, '../assets/config_dev.json'); //if needed, path for loading dev config
    // Read from each config file as needed and return the correct config.
    return new Promise((resolve, reject) => { //promise
        fs.readFile(configPath, 'utf8', (err, data) => { //read file
            if (err) { //if error
                reject(err); //reject
            } else { //else
                const parsedData = JSON.parse(data); //parse data
                if (process.argv[2] === "second" && parsedData.Build === "Dev"){  ///this only triggers if there's a need for a second instance for dev mode
                  console.log("Dev Build Secondary Instance Mode"); //logs
                  fs.readFile(secondaryConfigPath, 'utf8', (err, data) => { //read file
                    if (err) { //if error
                        reject(err); //reject
                    } else { //else
                        resolve(JSON.parse(data)); //resolve
                    } //end else
                  }); //end read file
                } else { //else
                  resolve(parsedData); //resolve
                } //end else
            } //end else
        }); //end read file
    }); //end promise
  }); //end ipcMain handle load-config
}) //end app when ready

app.on('window-all-closed', () => { //triggers upon client closing
  if (process.platform !== 'darwin') { //if not mac
    app.quit() //quit
  } //end if
}); //end app on window all closed