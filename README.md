# Battleship
This is a JavaScript implementation of the classic board game Battleship. The game can be played either locally or online, and is built using Node.js, Electron, and Sockets.io.

---

[//]: # (---)
## Table of Contents
- [Quick Start Guide](#quick-start-guide)
  - [Dependencies](#dependencies)
  - [Starting the Game](#starting-the-game)
  - [Gameplay](#gameplay)
- [In Depth Guide](#in-depth-guide)
  - [The Server](#the-server)
  - [The Client](#the-client)
  - [Cloud Hosting](#cloud-hosting)
  - [Committing Changes](#committing-changes)
- [End Credits](#end-credits)
  - [Estimated Time Required](#estimated-time-required)
  - [Actual Time Required](#actual-time-required)
  - [About the Project](#about-the-project)

[//]: # (---)

---

# Quick Start Guide
This guide will help you get a local installation of the game up and running quickly. For web hosting, etc., please see the [In Depth Guide](#in-depth-guide) below.
## Dependencies
Before doing anything else, ensure that you have done the following:
- Install node.js. Node can be installed from https://nodejs.org/en.
- Open a terminal in this folder (the top level directory) and run `npm install`. This will install some packages and complete required setup steps.
- Once this step completes successfully, you will be able to build, run, and test the game.

## Starting the Game
- open a terminal and navigate to this folder (the top level directory)
- run /scripts/start.sh
  - this script will start the server and two clients, allowing you to play a game locally
  - for online play, see the instructions below

## Gameplay
- The game is played by two players, each with their own game board.
  - if single player is selected, the player will play against a computer opponent
- Players place their ships on their board by clicking on the desired location. The ship rotation may be selected by clicking the rotate button prior to placing the ship.
- Once all ships are placed, players take turns selecting a location on the opponent's board to fire upon.
- The standard shot is a single shot, but players may choose to use a spread shot, which fires a 3x3 grid of shots.
  - Only 3 spread shots are available per game. 
- The game continues until one player has sunk all of the opponent's ships.
- The game will display a message when the game is over, and the players may choose to play again or exit the game.

[//]: # (---)

# In Depth Guide
Whether hosted locally or remotely, this implementation of battleship comes in two parts: The Server, and the Client.

## The Server
The Server is the backend code that controls game state, match making, and player communications. Code for the Server can be found in the `back` and `back/server` folder.

### Testing Locally
To run a local version of the server, open a terminal in this (the top level) folder and run `npm run server`. This will launch a local build of the server at https://localhost:5100.
You can check to see if the server is running by visiting that url in any web browser and ensuring a page is displayed that says the server is operational.


## The Client
The Client is the frontend code that displays the main menu, game board, and provides an area for the user to interact with. Our frontend visuals are constructed via html and css, and presented using Node.JS and electron.

### Testing Against a Local Server
- Edit the Config Script
- Ensure that the "DevServerAddress" value is set to "http://127.0.0.1:5100"
- Set the "Build" value to "Dev"
- Ensure that the "ClientId" value is set to `null`

[//]: # (#### Testing Against Your Own Hosted Server:)
[//]: # (- Use the same settings as testing against our Render server, but make sure you update the LiveServerAddress value to match your server's address.)

[//]: # (### Running the Client)
[//]: # (Once you have the client config.json updated, you can run the client by opening a terminal in this folder &#40;the top level folder&#41; and running `npm run play`. This will build and launch the game client.)

[//]: # (### Testing Locally with Two Clients)
[//]: # (If you want to test two clients locally &#40;to play a match using a local server&#41;, you will need two terminals opened in this folder.)

[//]: # (In the first terminal, run: `npm run play`)
[//]: # (In the second terminal, run: `npm run play second`)

[//]: # (This is necessary because of the way that we track clients. By specifying "second", the client will use a static 'config_dev.json' file instead of 'config.json', so that the ClientIDs will be unique.)
[//]: # (If you run both clients using npm run play, without specifying second for one, the server will not be able to tell the two clients apart and that will result in match communication failure errors.)

### Running Individual Scripts
If desired, it is also possible to manually run either of the clients and or the server locally. This can be done by running the following commands in the terminal:
- `npm run server` to start the server
- `npm run play` to start the first client
- `npm run play second` to start the second client

During normal operations, the start.sh script runs these commands in sequence in a single shell window.In most cases there is no reason to run them individually.


## Cloud Hosting
Version 1.0 was tested on a server instance hosted on render.com. The code should be able to be deployed to any server that supports Node.js and WebSockets. **YMMV**.

Before you run the client, you will need to make some config changes depending on your testing setup:
CONFIG SCRIPT: [config.json](./front/assets/config.json) | ./front/assets/config.json
### Editing the Config Script
- Set the "LiveServerAddress" value to the address of the server you are testing against
  - e.g. `https://battleship-q6f4.onrender.com`
- Set the "Build" value to "Live"
- Ensure that the "ClientId" value is set to `null`

### Render Hosting
To host the server on a cloud service, you'll have to place the backend files on a server. One option which was tested
with earlier versions of the game is to use render.com. It appears to be the simplest way to do so right now. To host on render:
- Sign in to render with your github account. This will allow for direct access to your chosen fork or repo.
- Create a web service (not a private service) and connect the repo to the service.
- Choose your target branch to build and deploy.
- Set "back/server" as the root directory.
- Set "back/server/ $ npm ci" as the build command. Do not set a pre-deploy command.
- Set "node server.js" as the start command. Set autodeploy to yes.
- Click Manual Deploy in the top-right corner, followed by Deploy Latest Commit. This should take you to the Logs tab, which can also be found on the left hand side.

A free account is likely sufficient for this project, as the game is not expected to generate a large amount of traffic. If you need to change the branch or repo for the server, you can do so in the settings tab, found at the left hand side options.

- NOTE: If the server is dormant, it will take about a minute to rebuild and spin back up. The client should update automatically once the server is done doing so. If not, refresh the page. It will become dormant after roughly three hours of no activity.


### Changing the Server Port:
If you change the server port, and you want to test locally, you will also need to update the following files:
- `battleship/front/assets/config.json`
- `battleship/front/assets/config_dev.json`
  These files currently contain DevServer pointers to localhost:5100 that would need to be updated to match the new server port.
  However, in general, there should be no need to modify the server port.

## Committing Changes
If you have tested locally, the ClientID in the config file will have been modified. To clean that up, we recommend running `npm run clean` before committing changes to your branches.

---
# End Credits

## Estimated Time Required

- 5 days x 1 hours/day + 2 days x 2  hours/day = **9 hours per team member total**
- 9 hours per week x 2 weeks = **18 hours per team member total**
- 5 team members x 18 hours = **90 hours total**
- this assumes team members will work 1 hour per day every weekday on average and 2 hours per day on the weekend


## Actual Time Required
(copied from original team google sheet)

### Week 1
| Member    | 9/16   | 9/17    | 9/18  | 9/19  | 9/20    | 9/21  | 9/22    | Total    |
|-----------|--------|---------|-------|-------|---------|-------|---------|----------|
| Derek     | 0      | 0       | 0     | 0     | 0       | 0     | 0       | 0        |
| Ethan     | 0      | 0       | 0     | 1     | 1       | 0     | 0.5     | 2.5      |
| Mo        | 0      | 0       | 0     | 0.5   | 5       | 0     | 0       | 5.5      |
| Jacob     | 0      | 0       | 0     | 2     | 0.5     | 0     | 0       | 2.5      |
| Richard   | 0      | 0.5     | 1     | 0.5   | 0       | 0     | 0       | 2        |
| **Total** | **0**  | **0.5** | **1** | **4** | **6.5** | **0** | **0.5** | **12.5** |


### Week 2
| Member     | 9/23   | 9/24     | 9/25  | 9/26  | 9/27   | 9/28  | 9/29    | Total  |
|------------|--------|----------|-------|-------|--------|-------|---------|--------|
| Derek      | 6      | 6        | 2     | 1     | 11     | 0     | 0.5     | 26.5   |
| Ethan      | 5      | 2        | 0     | 1     | 0      | 0     | 0.5     | 8.5    |
| Mo         | 0.5    | 2.5      | 0     | 0     | 0      | 0     | 0.5     | 3.5    |
| Jacob      | 0.5    | 0        | 0     | 0     | 0      | 0     | 0.5     | 1      |
| Richard    | 0      | 0        | 1     | 4     | 1      | 4     | 0.5     | 10.5   |
| **Total**  | **12** | **10.5** | **3** | **6** | **12** | **4** | **2.5** | **50** |



## About the Project

### Languages:
- Frontend: node.js, css, html, JavaScript
- Backend: node.js
### Technologies:
- Frontend: electron, sockets.io
- Backend: express, sockets.io

For more information and documentation on electron, the tool that allows us to display html/css/js as a native application, please see the project's official website at https://www.electronjs.org/.
