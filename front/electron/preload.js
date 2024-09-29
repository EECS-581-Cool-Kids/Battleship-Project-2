//This is for preloading requirements for the electron client to function properly with the html. Don't touch.
//Description: The starting screen and setting selection for joining or creating a game of battleship
//inputs: Game code or how many ships
//Outputs: Links to main.html to play game
//Sources: electronjs.org
//Authors: Matthew Petillo, William Johnson
//Creation date: 9-10-24

const { contextBridge, ipcRenderer } = require('electron') //electron imports

contextBridge.exposeInMainWorld('versions', { //exposes versions
  node: () => process.versions.node, //node version
  chrome: () => process.versions.chrome, //chrome version
  electron: () => process.versions.electron, //electron version
  ping: () => ipcRenderer.invoke('ping'), //ping
  // we can also expose variables, not just functions
}) //end contextBridge

contextBridge.exposeInMainWorld('api', { //exposes api
  loadConfig: () => ipcRenderer.invoke('load-config'), //loads config
}); //end contextBridge

contextBridge.exposeInMainWorld('electronAPI', { //exposes electronAPI
  navigateToPage: (page) => ipcRenderer.send('navigate-to-page', page) //navigates to page
}); //end contextBridge