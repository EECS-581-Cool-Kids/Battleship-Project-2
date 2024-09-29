/* server.js
Description: The program that initializes and manages the server that facilitates round management and communication between client instances.
             Uses the express package to host a server on port 5100. The server communicates with clients using sockets.io. Round and Party states
             are managed by dedicated modules.
Inputs: None
Outputs: None
Sources: node.js, sockets.io, and express official documentation
Authors: William Johnson, Matthew Petillo
Creation date: 9-10-24
*/

/*
    Includes relevant packages and libraries. 
    - Express: For hosting the server at a port
    - http: For http communication
    - socket.io: For creating communication link between the server and clients
    - body-parser: for parsing incoming requests to the server
    - BattleshipRound: The round manager for battleship gameplay. Controls shot attempts, ship location management, and player groupings.
    - Match, generateUniqueId: The manager for match making and party grouping. Used to generate codes for sharing and linking players across clients.
*/
const express = require('express');  // Import the express library
const http = require('http'); // Import the http library
const socketIo = require('socket.io'); // Import the socket.io library
const bodyParser = require('body-parser'); // Import the body-parser library
const [ BattleshipRound, AIPlayer, NO_AI, EASY, MEDIUM, HARD ] = require('./modules/battleshipRound'); // Import the BattleshipRound class
const [ Match, generateUniqueId ] = require('./modules/matchmaking') // Import the Match class and the generateUniqueId function

// Initializes the express application and starts hosting the server
const app = express();  // Create an express app
const server = http.createServer(app); // Create a server using the express app

// These are variables that store current active sessions/parties for global referencing and lookup.
// IF we wanted to productionize this, it would be better to use a redis cache. But, time limits and all that.
let playerPartyAssociations = {}; // Stores the party that a player is associated with.
let playerRoundAssociations = {}; // Stores the round that a player is associated with.

let playerSockets = {}; // Stores the socket associated with a player.
let socketClientAssociations = {}; // Stores the player associated with a socket.

let activeParties = {}; // Stores the active parties that are currently in play.

// These are variables and functions that store the necessary structure needed for the server to implement the AI for a single player game.


// Function that cleans up global associations for players to allow them to join new rounds/parties. Also cleans up a party.
function cleanUpRound(players){ //players is an array of player ids
    const party = playerPartyAssociations[players[0]] //gets party from player
    players.forEach(player => { //removes all players from round and party
        playerPartyAssociations[player] = undefined; //removes player from party
        playerRoundAssociations[player] = undefined; //removes player from round
    }); //end forEach

    activeParties[party.id] = undefined; //removes party from active parties
} //end cleanUpRound

// Initializes sockets.io to allow for client-server communication. Allows Cross-Origin for simplicity. Not the most secure, but will work for us.
const io = socketIo(server, { // Create a socket.io server
    cors: { // Enable Cross-Origin Resource Sharing
        origin: "*",  // Allow all origins to post to this server.
        methods: ["GET", "POST"] // Allow GET and POST methods
    } // End enable Cross-Origin Resource Sharing
}); // End create a socket.io server

// Registers the app to use bodyParser to make our lives easier and avoid needing to decode json frequently.
app.use(bodyParser.json()); // Use the body-parser library to parse JSON

// Server definition
const port = 5100; // The port the server will listen on
const localNetworkHost = '0.0.0.0'; // The host the server will listen on

// For setup and original fetching of information
app.post('/data', (req, res) => { // When a POST request is made to /data
    const data = req.body; // Get the data from the request

    // Do Things
    // This is for debug access only.

    res.send({ status: 'success' }); // Send a response to the client

    io.emit('update', data); // Emit an update event to all connected clients
}); // End when a POST request is made to /data

app.get('/', (req, res) => { // When a request is made to the root
    res.sendFile(__dirname + '/assets/serverView.html'); // Send the serverView.html file
}); // End when a request is made to the root

// For in-game communication
io.on('connection', (socket) => { // When a socket connects to the server
    console.log("Client Connected:", socket.id); // Log that a client connected

    socket.emit('getClientId', {}); // Request the client ID from the client

    // AI implementation
    socket.on('initiateSinglePlayer', (numShips, difficulty) => { // When a client requests to play a single player game

        if (difficulty === 'easy') { // Set the AI type based on the difficulty
            AI_TYPE = EASY; // Easy AI
        } //end if
        else if (difficulty === 'medium') { // Set the AI type based on the difficulty
            AI_TYPE = MEDIUM // Medium AI
        } //end else if
        else if (difficulty === 'hard') { // Set the AI type based on the difficulty
            AI_TYPE = HARD; // Hard AI
        } //end else if

        if (playerPartyAssociations[socket.ClientId] !== undefined) { //checks if player is already in party
            socket.emit("createParty", { //rejects player if they are already in a party
                status: "Rejected", //status of rejection
                reason: "Target player is already registered in a party", //reason for rejection
            }); //end emit
            return; //exit function
        } //end if
        try { //creates party and stores party id serverside
            let matchId = generateUniqueId(); //see modules/matchmaking.js
            while (activeParties[matchId] !== undefined) { //checks for duplicates
                matchId = generateUniqueId(); //generates new id
            } //end while

            const newMatch = new Match(socket.ClientId, numShips, matchId); //creates new match instance
            newMatch.players.push(AIPlayer); //adds AI player to party
            playerSockets[AIPlayer] = {}; //creates socket for AI player
            playerSockets[AIPlayer].emit = (arg1, arg2) => {console.log("AI emit call: " + arg1 + ": " + JSON.stringify(arg2))}; //creates emit function for AI player
            activeParties[matchId] = newMatch; //stores matchid with new match instance
            playerPartyAssociations[socket.ClientId] = newMatch; // associates client with party
            socket.emit("createParty", { status: "Success", matchId: matchId }); //emits success message
            // return;
        } catch (err) { //catches error and logs it
            console.log(err); //logs error
            socket.emit("createParty", { status: "Rejected", reason: err }); //emits rejection message
            return; //exits function
        } //end try-catch

        // -- Round Start Logic -- //
        const party = playerPartyAssociations[socket.ClientId]; //gets party from player

        //creates new round and places all players in that round
        try { //creates new round and places all players in that round
            const newRound = new BattleshipRound( //creates new round instance
                socket.ClientId, //host of round
                party.numShips,  //number of ships
                party.gridDimensions //grid dimensions
            ); //end new round instance

            // const randomIndex = Math.floor(
            //   Math.random() * party.players.length
            // );
            // newRound.whosTurn = party.players[randomIndex];

            newRound.whosTurn = party.players[0]; //sets first player to host

            newRound.addPlayer(party.players[0]); //adds host to round
            newRound.addAI(AI_TYPE); //adds AI to round
            newRound.hasPlacedShips[AIPlayer] = true; //sets AI to have placed ships
            playerRoundAssociations[party.players[0]] = newRound; //associates host with round
            socket.emit("startRound", { //emits start round message
                status: "Success", //status of success
                players: party.players, //players in round
            }); //end emit
        } catch (err) { //catches error and logs it
            socket.emit("startRound", { //emits error message
                status: "Error", //status of error
                reason: err.toString(), //reason for error
            }); //end emit
            console.log(err); //logs error
            return; //exits function
        } //end try-catch
    }); //end on

    socket.on('registerClientId', (data) => { // When the client sends their ID
        playerSockets[data.ClientId] = socket; // Store the socket associated with the client
        socketClientAssociations[socket.id] = data.ClientId; // Store the client associated with the socket
        console.log("Connection Registered for Client " + data.ClientId + " @ Socket " + socket.id); // Log that the client is registered
        socket.ClientId = data.ClientId // Store the client ID in the socket

        socket.emit('acknowledgeRegistration', { status: 'Success' }); // Acknowledge the registration
    }); // End when the client sends their ID

    //Creates party and stores party id serverside
    socket.on('tryCreateParty', (numShips) => { // When a client requests to create a party
        if (playerPartyAssociations[socket.ClientId] !== undefined){//checks if player is already in party
            socket.emit('createParty', { status: 'Rejected', reason: 'Target player is already registered in a party' }); //rejects player if they are already in a party
            return; //exit function
        } //end if
        try{ //creates party and stores party id serverside
            matchId = generateUniqueId();//see modules/matchmaking.js
            while (activeParties[matchId] !== undefined){//checks for duplicates
                matchId = generateUniqueId(); //generates new id
            } //end while
            const newMatch = new Match(socket.ClientId, numShips, matchId) //creates new match instance
            activeParties[matchId] = newMatch;//stories matchid with new match instance
            playerPartyAssociations[socket.ClientId] = newMatch; //associates client with party
            socket.emit('createParty', {status: 'Success', matchId: matchId}); //emits success message
            // return;
        } //end try
        catch(err){ //catches error and logs it
            console.log(err); //logs error
            socket.emit('createParty', {  status: 'Rejected', reason: err}); //emits rejection message
            return; //exits function
        } //end catch

    }); //end on

    //for opponent - associates opponent player with party
    socket.on('tryJoinParty', (partyId) => { // When a client requests to join a party
        if (activeParties[partyId] === undefined){ //checks if party exists
            socket.emit('joinParty', { status: 'Rejected', reason: 'Requested party could not be found' }); //lol you tried to join a bad party
            return; //exit function
        }  //end if
        else if (activeParties[partyId].players.length > 1){ //checks if party already has two players
            socket.emit('joinParty', { status: 'Rejected', reason: 'Party is full'}); //checks if party already has two players
            return; //exit function
        } //end else if
        try{ //associates opponent with party id and lets host know that party is full and game can be started
            const party = activeParties[partyId]; //gets party from active parties
            party.addOpponent(socket.ClientId); //adds opponent to party
            playerPartyAssociations[socket.ClientId] = party; //associates opponent with party
            playerSockets[party.host].emit('opponentJoined', { status: 'Success', reason: 'Opponent has joined the game'}); //lets host know that party is full
            socket.emit('joinParty', { status: 'Success', reason: 'You have joined party' + partyId + 'successfully'}); //emits success message
            return; //exits function
        } //end try
        catch(err){ //catches error and logs it
            socket.emit('joinParty', { status: 'Rejected', reason: err.toString()}); //emits rejection message
            console.log(err); //logs error
            return; //exits function
        } //end catch
    }); //end on


    //starts round if all players are ready
    socket.on('tryStartRound', () => { // When a client requests to start a round
        const party = playerPartyAssociations[socket.ClientId]; //gets party
        //checks for bad party, no party, bad host
        if (party === undefined || party.id == undefined || party.host !== socket.ClientId){ //checks if party exists and host is correct
            socket.emit('startRound', { status: 'Rejected', reason: 'The requesting player is not a member of an active party'}); //rejects player if they are not in a party
            return; //exits function
        } //end if
        //creates new round and places all players in that round
        try{ //creates new round and places all players in that round
            const newRound = new BattleshipRound(socket.ClientId, party.numShips, party.gridDimensions); //creates new round instance
            const randomIndex = Math.floor(Math.random() * party.players.length); //randomly selects first player
            newRound.whosTurn = party.players[randomIndex]; //sets first player to random player
            party.players.forEach(player => { //associates all players with the new round
                playerSockets[player].emit('startRound', { status: 'Success', players: party.players }); //emits start round message
                newRound.addPlayer(player); //adds player to round
                playerRoundAssociations[player] = newRound; //associates player with round
            }); //end forEach
            return; //exits function
        } //end try
        catch (err){ //catches error and logs it
            socket.emit('startRound', {status: 'Error', reason: err.toString()}); //emits error message
            console.log(err); //logs error
            return; //exits function
        } //end catch
    }); //end on


    //returns number of ships
    socket.on('fetchNumberOfShips', () => { // When a client requests the number of ships
        const round = playerRoundAssociations[socket.ClientId]; //gets round
        if (round === undefined){ //this, in theory, should never be activated because it's impossible to run this function unless you're associated with a round
            socket.emit('setNumberOfShips', { status: 'Rejected', reason: 'The requesting player is not associated with a round.' }); //rejects player if they are not in a round
            console.log(round); //logs round
            console.log(playerRoundAssociations); //logs player round associations
            console.log(socket.ClientId); //logs client id
            return; //exits function
        } //end if

        socket.emit('setNumberOfShips', { status: 'Success', numShips: round.numberOfShips }); //returns num of ships to client
    }); //end on

    // Client attempts to register ship placements
    socket.on('registerShipPlacements', (shipData) => { // When a client attempts to register ship placements
        const round = playerRoundAssociations[socket.ClientId]; //gets round
        if (round === undefined){ //checks if player is in round
            socket.emit('registerShips', { status: 'Rejected', reason: 'The requesting player is not associated with a round.' }); //rejects player if they are not in a round
            return; //exits function
        } //end if

        if (round.hasPlacedShips[socket.ClientId] === true){ //checks if player has already placed ships
            socket.emit('registerShips', { status: 'Rejected', reason: 'The requesting player has already placed their ships.' }); //rejects player if they have already placed ships
            return; //exits function
        } //end if

        // We check this to make sure players don't try to place ships multiple times
        round.hasPlacedShips[socket.ClientId] = true; //sets player to have placed ships

        // place the ships
        for (let shipName in shipData) { //places ships
            if (shipData.hasOwnProperty(shipName)) { //checks if ship exists
                round.maps[socket.ClientId].addShip(shipName, shipData[shipName]); //adds ship to map
            } //end if
        } //end for

        socket.emit('registerShips', { status: 'Success', reason: 'Ships placed successfully' }); //emits success message

        if (Object.keys(round.hasPlacedShips).length > 1){ //checks if all players have placed ships
            const party = playerPartyAssociations[socket.ClientId]; //gets party
            party.players.forEach(player => { //emits message to all players
                // if (player === AIPlayer) return;
                playerSockets[player].emit('playersReady', { status: 'Success', players: party.players, firstPlayer: round.whosTurn }); //emits message to all players
            }); //end forEach
        } //end if
    }); //end on

    // Handle player attempting to fire a shot
    socket.on('tryHit', (shotData) => { // When a client attempts to fire a shot
        console.log(shotData.x, shotData.y); // Log the shot data
        const round = playerRoundAssociations[socket.ClientId]; //gets round
        const attackingPlayer = socket.ClientId; //gets attacking player
        const attackedPlayer = round.players.find(player => player !== socket.ClientId); //gets attacked player
        // Make sure we only register an attempted attack if it is the attacking player's turn .
        if (round.whosTurn === attackingPlayer) { //checks if it's the attacking player's turn
            // Attempt to fire a shot and get the result.
            const [ result, reason, sunkShip, hitShipObject ] = round.attemptFire(shotData.x, shotData.y, attackedPlayer, attackingPlayer); //attempts to fire shot
            console.log(result, reason, sunkShip); //logs result, reason, and sunk ship
            if (reason === "InvalidGuess"){ //checks if guess is invalid
                return; // The player attempted to guess somewhere they have already guessed, or somehow guessed off the board.
            } //end if
            if (result === true){ //checks if result is true
                // Hit!
                playerSockets[attackingPlayer].emit('hitTarget', { status: 'Success', coordinates: shotData }); //emits hit target message
                playerSockets[attackedPlayer].emit('gotHit', { status: 'Success', coordinates: shotData });

                if (sunkShip){ //checks if ship is sunk
                    round.players.forEach(player => { //emits sunk ship message to all players
                        playerSockets[player].emit('sunkShip', { status: 'Success', attackedPlayer: attackedPlayer, shipObject: hitShipObject }); //emits sunk ship message
                    }); //end forEach
                } //end if

                // They won the game!
                if (reason == "GameWin"){ //checks if game is won
                    playerSockets[attackingPlayer].emit('youWon', { status: "Success" }); //emits you won message
                    playerSockets[attackedPlayer].emit('youLost', { status: "Success" }); //emits you lost message
                    cleanUpRound([ attackingPlayer, attackedPlayer ]); //cleans up round
                    return; //exits function
                } //end if
            } else { //checks if result is false
                // Miss...
                playerSockets[attackingPlayer].emit('missedTarget', { status: 'Success', coordinates: shotData }); //emits missed target message
                playerSockets[attackedPlayer].emit('theyMissed', { status: 'Success', coordinates: shotData }); //emits they missed message
            } //end else

            // Set the turn to the next player
            if (!shotData.isSpecial || shotData.shotNum >= 9) //checks if shot is special
            { //checks if shot is special
                round.whosTurn = attackedPlayer; //sets turn to attacked player
                round.players.forEach(player => { //emits set turn message to all players
                    playerSockets[player].emit('setTurn', { status: 'Success', whosTurn: attackedPlayer }); //emits set turn message
                }); //end forEach

                if (round.aiType == NO_AI) //checks if there is no AI
                    return; //exits function

                // ===== AI TURN ===== //
                const aiShot = round.aiTurn(); //gets AI shot
                
                const [ aiResult, aiReason, aiSunkShip, aiHitShipObject ] = round.attemptFire(aiShot.x, aiShot.y, attackingPlayer, attackedPlayer); //attempts to fire AI shot
                console.log(aiShot.x, aiShot.y, result, reason, sunkShip); //logs AI shot data
                if (aiReason === "InvalidGuess") { // This should never happen...
                    return;  // The AI tried to guess somewhere it has already guessed, or somehow guessed off the board.
                } //end if
                if (aiResult === true) { //checks if AI result is true
                    // Hit!
                    playerSockets[attackedPlayer].emit("hitTarget", { //emits hit target message
                        status: "Success", //status of success
                        coordinates: aiShot, //coordinates of shot
                    }); //end emit
                    playerSockets[attackingPlayer].emit("gotHit", { //emits got hit message
                        status: "Success", //status of success
                        coordinates: aiShot, //coordinates of shot
                    }); //end emit

                    if (aiSunkShip) { //checks if AI sunk ship
                        round.players.forEach((player) => { //emits sunk ship message to all players
                            playerSockets[player].emit("sunkShip", { //emits sunk ship message
                                status: "Success", //status of success
                                attackedPlayer: attackingPlayer, //attacked player
                                shipObject: aiHitShipObject, //ship object
                            }); //end emit
                        }); //end forEach
                    } //end if

                    // They won the game!
                    if (aiReason == "GameWin") { //checks if AI won game
                        playerSockets[attackedPlayer].emit("youWon", { //emits you won message
                            status: "Success", //status of success
                        }); //end emit
                        playerSockets[attackingPlayer].emit("youLost", { //emits you lost message
                            status: "Success", //status of success
                        }); //end emit
                        cleanUpRound([attackingPlayer, attackedPlayer]); //cleans up round
                    } //end if
                } else { //checks if AI result is false
                    // Miss...
                    playerSockets[attackedPlayer].emit("missedTarget", { //emits missed target message
                        status: "Success", //status of success
                        coordinates: aiShot, //coordinates of shot
                    });
                    playerSockets[attackingPlayer].emit("theyMissed", { //emits they missed message
                        status: "Success", //status of success
                        coordinates: aiShot, //coordinates of shot
                    }); //end emit
                } //end else

                round.whosTurn = attackingPlayer; //sets turn to attacking player
                round.players.forEach(player => { //emits set turn message to all players
                    playerSockets[player].emit('setTurn', { status: 'Success', whosTurn: attackingPlayer }); //emits set turn message
                }); //end forEach
            } //end if
        } //end iF
    }); //end on

    // Socket is disconnecting so we can unregister it with all local storage.
    socket.on('disconnect', () => { // When a socket disconnects
        if (socketClientAssociations[socket.id]){ //checks if socket is associated with a client
            playerSockets[socketClientAssociations[socket.id]] = undefined; //removes player from socket
            socketClientAssociations[socket.id] = undefined; //removes socket from client
        } //end if
        console.log("Client Disconnected:", socket.id); // Log that a client disconnected
    }); // End when a socket disconnects
}); // End when a socket connects

// Host the express server
server.listen(port, localNetworkHost, () => { // Listen on the specified port and host
    console.log(`The BattleShip Server is now active on http://${localNetworkHost}:${port}`) // Log that the server is active
}); // End listen on the specified port and host