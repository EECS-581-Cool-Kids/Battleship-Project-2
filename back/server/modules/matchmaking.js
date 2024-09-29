/* matchmaking.js
Description: Matchmaking module. Creates data structures for matches that keeps all necessary information required by server
Inputs: None
Outputs: Match, generateUniqueId
Sources: 
Authors: Matthew Petillo
Creation date: 9-10-24
*/

const express = require('express'); // Import the express library
const http = require('http'); // Import the http library
const socketIo = require('socket.io'); // Import the socket.io library
const bodyParser = require('body-parser'); // Import the body-parser library
const crypto = require('crypto'); // Import the crypto library
const { match } = require('assert'); // Import the assert module

const generatedIds = new Set(); // Using a Set to store unique IDs

function generateUniqueId(length = 6) {
  let id; // The generated ID
  do { // Keep generating IDs until a unique one is found
    id = crypto.randomBytes(length) // Generate a random ID
      .toString('base64') // Convert the ID to a base64 string
      .replace(/[^a-zA-Z0-9]/g, '') // Remove any non-alphanumeric characters
      .substring(0, length); // Trim the ID to the desired length
  } while (generatedIds.has(id)); // Keep generating if the ID already exists

  generatedIds.add(id); // Add the new ID to the Set
  return id; // Return the generated ID
} // End generateUniqueId

class Match{ // Class to store match data

    constructor(host, numShips, matchId, gridDimensions = [10, 10]){ // Constructor for Match
        this.host = host; // The host of the match
        this.numShips = numShips; // The number of ships in the match
        this.id = matchId; // The ID of the match
        this.players = [ host ]; // The players in the match
        this.gridDimensions = gridDimensions; // The dimensions of the grid
    } // End constructor

    addOpponent(Opponent){ // Method to add an opponent to the match
        this.players.push(Opponent); // Add the opponent to the match
    } // End addOpponent
} // End Match

module.exports = [ Match, generateUniqueId ]; // Export the Match class and the generateUniqueId function
