//This is for preloading requirements for the electron client to function properly with the html. Don't touch.
//Description: The starting screen and setting selection for joining or creating a game of battleship
//inputs: Game code or how many ships
//Outputs: Links to main.html to play game
//Sources: electronjs.org
//Authors: Matthew Petillo, William Johnson
//Creation date: 9-10-24

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping'),
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('api', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
});

contextBridge.exposeInMainWorld('electronAPI', {
  navigateToPage: (page) => ipcRenderer.send('navigate-to-page', page)
});