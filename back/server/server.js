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
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const [ BattleshipRound, AIPlayer, NO_AI, EASY, MEDIUM, HARD ] = require('./modules/battleshipRound');
const [ Match, generateUniqueId ] = require('./modules/matchmaking')

// Initializes the express application and starts hosting the server
const app = express();
const server = http.createServer(app);

// These are variables that store current active sessions/parties for global referencing and lookup.
// IF we wanted to productionize this, it would be better to use a redis cache. But, time limits and all that.
let playerPartyAssociations = {};
let playerRoundAssociations = {};

let playerSockets = {};
let socketClientAssociations = {};

let activeParties = {};

// These are variables and functions that store the necessary structure needed for the server to implement the AI for a single player game.


// Function that cleans up global associations for players to allow them to join new rounds/parties. Also cleans up a party.
function cleanUpRound(players){
    const party = playerPartyAssociations[players[0]]
    players.forEach(player => {
        playerPartyAssociations[player] = undefined;
        playerRoundAssociations[player] = undefined;
    });

    activeParties[party.id] = undefined;
}

// Initializes sockets.io to allow for client-server communication. Allows Cross-Origin for simplicity. Not the most secure, but will work for us.
const io = socketIo(server, {
    cors: {
        origin: "*",  // Allow all origins to post to this server.
        methods: ["GET", "POST"]
    }
});

// Registers the app to use bodyParser to make our lives easier and avoid needing to decode json frequently.
app.use(bodyParser.json());

// Server definition
const port = 5100;
const localNetworkHost = '0.0.0.0';

// For setup and original fetching of information
app.post('/data', (req, res) => {
    const data = req.body;

    // Do Things
    // This is for debug access only.

    res.send({ status: 'success' });

    io.emit('update', data);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/assets/serverView.html');
});

// For in-game communication
io.on('connection', (socket) => {
    console.log("Client Connected:", socket.id);

    socket.emit('getClientId', {});

    // Placeholder for future AI implementation
    socket.on('initiateSinglePlayer', (numShips) => {
        const AI_TYPE = EASY;

        if (playerPartyAssociations[socket.ClientId] !== undefined) {
            socket.emit("createParty", {
                status: "Rejected",
                reason: "Target player is already registered in a party",
            });
            return;
        }
        try {
            let matchId = generateUniqueId(); //see modules/matchmaking.js
            while (activeParties[matchId] !== undefined) {
                //checks for duplicates
                matchId = generateUniqueId();
            }

            const newMatch = new Match(socket.ClientId, numShips, matchId);
            newMatch.players.push(AIPlayer);
            playerSockets[AIPlayer] = {};
            playerSockets[AIPlayer].emit = (arg1, arg2) => {console.log("AI emit call: " + arg1 + ": " + JSON.stringify(arg2))};
            activeParties[matchId] = newMatch; //stores matchid with new match instance
            playerPartyAssociations[socket.ClientId] = newMatch; // associates client with party
            socket.emit("createParty", { status: "Success", matchId: matchId });
            // return;
        } catch (err) {
            console.log(err);
            socket.emit("createParty", { status: "Rejected", reason: err });
            return;
        }

        // -- Round Start Logic -- //
        const party = playerPartyAssociations[socket.ClientId];

        //creates new round and places all players in that round
        try {
            const newRound = new BattleshipRound(
                socket.ClientId,
                party.numShips,
                party.gridDimensions
            );

            // const randomIndex = Math.floor(
            //   Math.random() * party.players.length
            // );
            // newRound.whosTurn = party.players[randomIndex];

            newRound.whosTurn = party.players[0];

            newRound.addPlayer(party.players[0]);
            newRound.addAI(AI_TYPE);
            newRound.hasPlacedShips[AIPlayer] = true;
            playerRoundAssociations[party.players[0]] = newRound;
            socket.emit("startRound", {
                status: "Success",
                players: party.players,
            });
        } catch (err) {
            socket.emit("startRound", {
                status: "Error",
                reason: err.toString(),
            });
            console.log(err);
            return;
        }
    });

    socket.on('registerClientId', (data) => {
        playerSockets[data.ClientId] = socket;
        socketClientAssociations[socket.id] = data.ClientId;
        console.log("Connection Registered for Client " + data.ClientId + " @ Socket " + socket.id);
        socket.ClientId = data.ClientId

        socket.emit('acknowledgeRegistration', { status: 'Success' });
    });

    //Creates party and stores party id serverside
    socket.on('tryCreateParty', (numShips) => {
        if (playerPartyAssociations[socket.ClientId] !== undefined){//checks if player is already in party
            socket.emit('createParty', { status: 'Rejected', reason: 'Target player is already registered in a party' });
            return;
        }
        try{
            matchId = generateUniqueId();//see modules/matchmaking.js
            while (activeParties[matchId] !== undefined){//checks for duplicates
                matchId = generateUniqueId();
            }
            const newMatch = new Match(socket.ClientId, numShips, matchId)
            activeParties[matchId] = newMatch;//stories matchid with new match instance
            playerPartyAssociations[socket.ClientId] = newMatch; //associates client with party
            socket.emit('createParty', {status: 'Success', matchId: matchId});
            // return;
        }
        catch(err){
            console.log(err);
            socket.emit('createParty', {  status: 'Rejected', reason: err});
            return;
        }

    });

    //for opponent - associates opponent player with party
    socket.on('tryJoinParty', (partyId) => {
        if (activeParties[partyId] === undefined){
            socket.emit('joinParty', { status: 'Rejected', reason: 'Requested party could not be found' }); //lol you tried to join a bad party
            return;
        }
        else if (activeParties[partyId].players.length > 1){
            socket.emit('joinParty', { status: 'Rejected', reason: 'Party is full'}); //checks if party already has two players
            return;
        }
        try{ //associates opponent with party id and lets host know that party is full and game can be started
            const party = activeParties[partyId];
            party.addOpponent(socket.ClientId);
            playerPartyAssociations[socket.ClientId] = party;
            playerSockets[party.host].emit('opponentJoined', { status: 'Success', reason: 'Opponent has joined the game'});
            socket.emit('joinParty', { status: 'Success', reason: 'You have joined party' + partyId + 'successfully'});
            return;
        }
        catch(err){
            socket.emit('joinParty', { status: 'Rejected', reason: err.toString()});
            console.log(err);
            return;
        }
    });


    //starts round if all players are ready
    socket.on('tryStartRound', () => {
        const party = playerPartyAssociations[socket.ClientId];
        //checks for bad party, no party, bad host
        if (party === undefined || party.id == undefined || party.host !== socket.ClientId){
            socket.emit('startRound', { status: 'Rejected', reason: 'The requesting player is not a member of an active party'});
            return;
        }
        //creates new round and places all players in that round
        try{        
            const newRound = new BattleshipRound(socket.ClientId, party.numShips, party.gridDimensions);
            const randomIndex = Math.floor(Math.random() * party.players.length);
            newRound.whosTurn = party.players[randomIndex];
            party.players.forEach(player => { //associates all players with the new round
                playerSockets[player].emit('startRound', { status: 'Success', players: party.players });
                newRound.addPlayer(player);
                playerRoundAssociations[player] = newRound;
            });
            return;
        }
        catch (err){
            socket.emit('startRound', {status: 'Error', reason: err.toString()});
            console.log(err);
            return;
        }
    });


    //returns number of ships
    socket.on('fetchNumberOfShips', () => {
        const round = playerRoundAssociations[socket.ClientId];
        if (round === undefined){ //this, in theory, should never be activated because it's impossible to run this function unless you're associated with a round
            socket.emit('setNumberOfShips', { status: 'Rejected', reason: 'The requesting player is not associated with a round.' });
            console.log(round);
            console.log(playerRoundAssociations);
            console.log(socket.ClientId);
            return;
        }

        socket.emit('setNumberOfShips', { status: 'Success', numShips: round.numberOfShips }); //returns num of ships to client
    });

    // Client attempts to register ship placements
    socket.on('registerShipPlacements', (shipData) => {
        const round = playerRoundAssociations[socket.ClientId];
        if (round === undefined){
            socket.emit('registerShips', { status: 'Rejected', reason: 'The requesting player is not associated with a round.' });
            return;
        }

        if (round.hasPlacedShips[socket.ClientId] === true){
            socket.emit('registerShips', { status: 'Rejected', reason: 'The requesting player has already placed their ships.' });
            return;
        }

        // We check this to make sure players don't try to place ships multiple times
        round.hasPlacedShips[socket.ClientId] = true;

        // place the ships
        for (let shipName in shipData) {
            if (shipData.hasOwnProperty(shipName)) {
                round.maps[socket.ClientId].addShip(shipName, shipData[shipName]);
            }
        }

        socket.emit('registerShips', { status: 'Success', reason: 'Ships placed successfully' });

        if (Object.keys(round.hasPlacedShips).length > 1){
            const party = playerPartyAssociations[socket.ClientId];
            party.players.forEach(player => {
                // if (player === AIPlayer) return;
                playerSockets[player].emit('playersReady', { status: 'Success', players: party.players, firstPlayer: round.whosTurn });
            });
        }
    });

    // Handle player attempting to fire a shot
    socket.on('tryHit', (shotData) => {
        console.log(shotData.x, shotData.y);
        const round = playerRoundAssociations[socket.ClientId];
        const attackingPlayer = socket.ClientId;
        const attackedPlayer = round.players.find(player => player !== socket.ClientId);
        // Make sure we only register an attempted attack if it is the attacking player's turn.
        if (round.whosTurn === attackingPlayer) {
            // Attempt to fire a shot and get the result.
            const [ result, reason, sunkShip, hitShipObject ] = round.attemptFire(shotData.x, shotData.y, attackedPlayer, attackingPlayer);
            console.log(result, reason, sunkShip);
            if (reason === "InvalidGuess"){
                return; // The player attempted to guess somewhere they have already guessed, or somehow guessed off the board.
            }
            if (result === true){
                // Hit!
                playerSockets[attackingPlayer].emit('hitTarget', { status: 'Success', coordinates: shotData });
                playerSockets[attackedPlayer].emit('gotHit', { status: 'Success', coordinates: shotData });

                if (sunkShip){
                    round.players.forEach(player => {
                        playerSockets[player].emit('sunkShip', { status: 'Success', attackedPlayer: attackedPlayer, shipObject: hitShipObject });
                    });
                }

                // They won the game!
                if (reason == "GameWin"){
                    playerSockets[attackingPlayer].emit('youWon', { status: "Success" });
                    playerSockets[attackedPlayer].emit('youLost', { status: "Success" });
                    cleanUpRound([ attackingPlayer, attackedPlayer ]);
                    return;
                }
            } else {
                // Miss...
                playerSockets[attackingPlayer].emit('missedTarget', { status: 'Success', coordinates: shotData });
                playerSockets[attackedPlayer].emit('theyMissed', { status: 'Success', coordinates: shotData });
            }

            // Set the turn to the next player
            if (!shotData.isSpecial || shotData.shotNum >= 9)
            {
                round.whosTurn = attackedPlayer;
                round.players.forEach(player => {
                    playerSockets[player].emit('setTurn', { status: 'Success', whosTurn: attackedPlayer });
                });

                if (round.aiType == NO_AI)
                    return;

                // ===== AI TURN ===== //
                const aiShot = round.aiTurn();
                
                const [ aiResult, aiReason, aiSunkShip, aiHitShipObject ] = round.attemptFire(aiShot.x, aiShot.y, attackingPlayer, attackedPlayer);
                console.log(aiShot.x, aiShot.y, result, reason, sunkShip);
                if (aiReason === "InvalidGuess") { // This should never happen...
                    return; 
                }
                if (aiResult === true) {
                    // Hit!
                    playerSockets[attackedPlayer].emit("hitTarget", {
                        status: "Success",
                        coordinates: aiShot,
                    });
                    playerSockets[attackingPlayer].emit("gotHit", {
                        status: "Success",
                        coordinates: aiShot,
                    });

                    if (aiSunkShip) {
                        round.players.forEach((player) => {
                            playerSockets[player].emit("sunkShip", {
                                status: "Success",
                                attackedPlayer: attackingPlayer,
                                shipObject: aiHitShipObject,
                            });
                        });
                    }

                    // They won the game!
                    if (aiReason == "GameWin") {
                        playerSockets[attackedPlayer].emit("youWon", {
                            status: "Success",
                        });
                        playerSockets[attackingPlayer].emit("youLost", {
                            status: "Success",
                        });
                        cleanUpRound([attackingPlayer, attackedPlayer]);
                    }
                } else {
                    // Miss...
                    playerSockets[attackedPlayer].emit("missedTarget", {
                        status: "Success",
                        coordinates: aiShot,
                    });
                    playerSockets[attackingPlayer].emit("theyMissed", {
                        status: "Success",
                        coordinates: aiShot,
                    });
                }

                round.whosTurn = attackingPlayer;
                round.players.forEach(player => {
                    playerSockets[player].emit('setTurn', { status: 'Success', whosTurn: attackingPlayer });
                });

            }

            
        }
    });

    // Socket is disconnecting so we can unregister it with all local storage.
    socket.on('disconnect', () => {
        if (socketClientAssociations[socket.id]){
            playerSockets[socketClientAssociations[socket.id]] = undefined;
            socketClientAssociations[socket.id] = undefined;
        }
        console.log("Client Disconnected:", socket.id);
    });
});

// Host the express server
server.listen(port, localNetworkHost, () => {
    console.log(`The BattleShip Server is now active on http://${localNetworkHost}:${port}`)
});