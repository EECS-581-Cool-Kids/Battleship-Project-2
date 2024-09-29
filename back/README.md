# BattleShip Server
### Created by William Johnson and Matthew Petillo

## Installation
The battleship server can be run locally, or hosted via a cloud service. We recommend https://render.com/ 's free tier for simplicity.
To run a BattlShip Server locally, do the following:

### 0. Ensure that you have Node.JS installed. It can be found at https://nodejs.org/en. 
### 1. Go to the top level folder (above this one), and run "npm install" if running for the first time. Then run "npm run server".
### 2. Monitor. The terminal will now host the server. By default, the server will be hosted on http://localhost:5100.
### 3. To ensure that the clients use the local server, you will need to update the `battleship/front/assets/config.json` file so that the 'Build' value is set to 'Dev' instead of 'Live'.

## Configuring your Server Client
The main script for the server can be found at battleship/back/server/server.js. 
A server is hosted by using the node.js express package. The default port, 5100, is specified in the code at line 65 (search "server definition" in the code).
### IF YOU CHANGE THE SERVER PORT:
If you change the server port, and you want to test locally, you will also need to update the following files:
- `battleship/front/assets/config.json`
- `battleship/front/assets/config_dev.json`

These files currently contain DevServer pointers to localhost:5100 that would need to be updated to match the new server port.
However, in general, there should be no need to modify the server port.

## Running in Live Mode
To play using a cloud hosted server, you'll need to place the backend files on a server. We recommend, again, using render. It appears to be the simpliest way to do so right now. To host on render:

### 0. Sign in to render with your github account. This will allow for direct access to your chosen fork or repo.
### 1. Create a web service (not a private service) and connect the repo to the service.
### 2. Choose your target branch to build and deploy.
### 3. Set "back/server" as the root directory.
### 4. Set "back/server/ $ npm ci" as the build command. Do not set a pre-deploy command.
### 5. Set "node server.js" as the start command. Set autodeploy to yes.
### 6. Click Manual Deploy in the top-right corner, followed by Deploy Latest Commit. This should take you to the Logs tab, which can also be found on the left hand side.

The server should be started after this. Given the low amount of traffic this game uses, there is no reason to pay or scale the amount of server space. If you need to change the branch or repo for the server, you can do so in the settings tab, found at the left hand side options.

A note on runtime - if you send a request while the server is dormant, it will take about a minute to rebuild and spin back up. The client should update automatically once the server is done doing so. If not, refresh the page. It will become dormant after roughly three hours of no activity.

A reminder: you cannot test locally with two different instances unless you have the dev build running, even with a cloud server.. See the other README.md file, found on the top level of the techstack, for further instructions.
