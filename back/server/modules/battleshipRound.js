/* battleshipRound.js
Description: Battleship Round module. Creates data structures for matches that keeps all necessary information required by server for a single game round
Inputs: None
Outputs: BattleshipRound
Sources: 
Authors: William Johnson
Creation date: 9-13-24
*/

const AIPlayer = 0  //AI player id

const NO_AI = 0;  //AI difficulty levels
const EASY = 1;  //AI difficulty levels
const MEDIUM = 2;  //AI difficulty levels
const HARD = 3;  //AI difficulty levels

//For internal use - creates a map based off a given X, Y format.
class Map {  //creates a map object
    /**
     * Coordinate object, used for addShip, isValid
     * @typedef {Object} Coordinate   // Coordinate object, used for addShip, isValid
     * @property {number} x  // x property
     * @property {number} y  // y property
     */
    /**
     * @typedef  CellData  // CellData object
     * @type {object}  // CellData object
     * @property {?number} shipId  // shipId property
     * @property {bool} isHit  // isHit property
     */
    /**
     * @typedef Ship  // Ship object
     * @type {object}  // Ship object
     * @property {Coordinate[]} Definition  // Definition property
     * @property {bool} IsSunk  // IsSunk property
     */

    //takes dimensions in [x, y] format
    constructor(dimensions) {  // Map constructor
        console.log(dimensions[0]);  // Log the first dimension
        this.dimensions = dimensions  // Set the dimensions

        /** @type {Object.<number, Object.<number, CellData>>} */  // Map object
        this.Map = {};  // Map object
        /** @type {Object.<number, Ship>} */  // Ships object
        this.Ships = {};  // Ships object
        //creates an array based map
        for (let i = 0; i < dimensions[0]; i++) {  // for i in dimensions[0]
            /** @type {Object.<number, CellData>} */  // Row object
            const row = {};  // Row object
            for (let j = 0; j < dimensions[1]; j++) {  // for j in dimensions[1]
                row[j] = { shipId: null, isHit: false };  // Set the row
            }  // End creating the row
            this.Map[i] = row;  // Set the row
        }  // End creating the map
    }  // End Map constructor

    /**
     * @param {int} shipId - number 1-5  // shipId property
     * @param {Coordinate[]} shipDefinition - array of coordinates, length should be equal to shipId.  // shipDefinition property
     */
    addShip(shipId, shipDefinition) {  // Add a ship to the map
        this.Ships[shipId] = {}  // Set the ship
        this.Ships[shipId].Definition = shipDefinition;  // Set the ship definition
        this.Ships[shipId].IsSunk = false;  // Set the ship to not sunk

        shipDefinition.forEach(coordinate => { //coordinate should be an array, so runs through each
            if (this.Map[coordinate.x] === undefined) {  // If the x coordinate is undefined
                this.Map[coordinate.x] = {};  // Set the x coordinate
            }  // End if the x coordinate is undefined
            this.Map[coordinate.x][coordinate.y] = { shipId: shipId, isHit: false };  // Set the map
        });  // End for each coordinate
    }  // End addShip

    /**
     * 
     * @param {Coordinate[]} shipDefinition   // shipDefinition property
     * @returns {boolean} returns if the ship placement would be valid.
     */
    isValid(shipDefinition) {  // Check if a ship placement is valid
        shipDefinition.forEach(coordinate => { //coordinate should be an array, so runs through each
            if (this.Map[coordinate.x][coordinate.y].shipId == null) {  // If the ship ID is null
                return false;  // Return false
            }  // End if the ship ID is null
        });  // End for each coordinate
        return true;  // Return true
    }  // End isValid
    /**
     * 
     * @param {number} shipId should be between 1 and 5
     */
    addAIShip(shipId) {  // Add an AI ship
        const horizontal = (Math.random() >= 0.5)  // Set the horizontal
        while (1) {  // While true

            let x = Math.trunc(Math.random() * (this.dimensions[0] - 1));  // Set the x
            let y = Math.trunc(Math.random() * (this.dimensions[1] - 1));  // Set the y

            /** @type {Coordinate[]} */  // Coordinate array
            let coordinates = [];  // Coordinate array

            for (let i = 0; i < shipId; i++) {  // for i in shipId
                if (horizontal) {  // If horizontal
                    let _x;  // Set the x
                    if (x + i >= 10) {  // If the ship extends off the board
                        _x = x - (x + i - 10) - 1  // Set the x
                    } else {  // If the ship does not extend off the board
                        _x = x + i  // Set the x
                    }  // End if x + i is greater than or equal to 10
                    coordinates.push({ x: _x, y: y })  // Push the coordinates
                } else {  // If not horizontal
                    let _y;  // Set the y
                    if (y + i >= 10) {  // If the ship extends off the board
                        _y = y - (y + i - 10) - 1;  // Set the y
                    } else {  //  If the ship does not extend off the board
                        _y = y + i;  // Set the y
                    }  // End if y + i is greater than or equal to 10
                    coordinates.push({ x: x, y: _y });  // Push the coordinates
                }  // End if horizontal

            }  // End for i in shipId
            if (this.isValid(coordinates)) {  // If the coordinates are valid
                this.addShip(shipId, coordinates)  // Add the ship
                return;  // Return
            }  // End if the coordinates are valid
        }  // End while true
    }  // End addAIShip
}  // End Map class

//data structure for a battleship round
class BattleshipRound {  //creates a battleship round object
    //takes host clientId, num of ships, grid dimensions for Maps
    constructor(host, numberOfShips, gridDimensions) {  // BattleshipRound constructor
        this.host = host;  // Set the host
        /** @type {number[]} */  // Players array
        this.players = [];  // Players array
        this.numberOfShips = numberOfShips;
        /** @type {Object.<number, Map>} */   // Maps object
        this.maps = {}; // Maps object
        this.guessHistory = {}; // Guess history object
        this.gridDimensions = gridDimensions; // Grid dimensions
        this.whosTurn = null; // Whose turn it is
        this.hasPlacedShips = {}; // Has placed ships object
        this.aiType = NO_AI; // AI type
        this.aiTargetList = []; // AI target list
        this.aiDirection = null; // Tracks the current direction (if any) for the AI to fire in
        this.firstHit = null; // Tracks the last hit coordinate
        this.currentTarget = null;   // Tracks the current target coordinate
        this.hitShipId = null; // Tracks the ship ID of the hit ship
        this.hitCount = 0; // Tracks the number of hits on the current ship
        this.shipLength = 0 // Tracks the length of the current ship

    }
    //adds player and attaches a map
    addPlayer(clientId) {  // Add a player
        this.players.push(clientId); // Push the player
        this.maps[clientId] = new Map(this.gridDimensions); // Set the map
    } // End addPlayer

    addAI(difficulty) {  // Add an AI player
        this.aiType = difficulty  // Set the AI difficulty level
        this.players.push(AIPlayer) // Push the AI player
        this.maps[AIPlayer] = new Map(this.gridDimensions);  // Set the AI map
        for (let i = 0; i < this.numberOfShips; i++) { // for i in numberOfShips
            this.maps[AIPlayer].addAIShip(i + 1) // Add an AI ship
            console.log("ship " + (i + 1) + " added"); // Log the ship added
        } // End for i in numberOfShips
    } // End addAI
    aiTurn() { // AI turn
        const opMap = this.maps[this.host] // Set the opponent map

        // Easy difficulty logic: fires randomly
        if (this.aiType == EASY) {  // If the AI is easy
            while (1) { // While true
                let tile = this.randomTile(); // choose a random tile
                if (!opMap.Map[tile.x][tile.y].isHit) {  // If the tile has not been hit
                    return tile;  // Return the tile
                }  // End if the tile has not been hit
            }  // End while true
        }  // End if the AI is easy
        // medium difficulty: fires randomly until hit is achieved, then attacks orthogonally until ship is sunk
        if (this.aiType === MEDIUM) {  // If the AI is medium
            // Continue firing in the determined direction if possible
            if (this.aiDirection !== null && this.currentTarget !== null) {  // If the AI direction is not null
                if (this.hitCount < this.shipLength) {  // If the hit count is less than the ship length
                    let nextTile = this.getNextTileInDirection(this.currentTarget, this.aiDirection, opMap); // Get the next tile in the direction
                    if (nextTile) { // If the next tile is valid
                        if (opMap.Map[nextTile.x][nextTile.y].shipId !== null) { // If the next tile has a ship ID
                            this.currentTarget = nextTile; // Set the current target to the next tile
                            this.hitCount++; // Increment the hit count
                            return nextTile; // Return the next tile
                        }
                        else { // If the next tile does not have a ship ID
                            // If direction no longer valid (e.g., out of bounds or miss), reset direction
                            this.aiDirection = null; // Reset the direction
                            this.currentTarget = null; // Reset the current target
                        } // End if the next tile does not have a ship ID
                    } // End if the next tile is valid
                }  // End if the hit count is less than the ship length
                else { //empty data for ship targeting process, reverts a to random targeting
                    this.aiDirection = null; // Reset the direction
                    this.firstHit = null; // Reset the first hit
                    this.currentTarget = null; // Reset the current target
                    this.hitShipId = null; // Reset the hit ship ID
                    this.hitCount = 0; // Reset the hit count
                    this.shipLength = 0; // Reset the ship length
                } // End if the hit count is not less than the ship length
            } // End if the AI direction is not null
            // Process first hit if it exists but no direction is set
            if (this.firstHit !== null && this.aiDirection === null) { // If the first hit is not null and the AI direction is null
                if (this.hitCount < this.shipLength) { // If the hit count is less than the ship length
                    let adjTiles = this.getAdjacentTiles(this.firstHit.x, this.firstHit.y, opMap); // Get the adjacent tiles
                    for (let tile of adjTiles) { // For each tile in the adjacent tiles
                        if (!opMap.Map[tile.x][tile.y].isHit) { // If the tile has not been hit
                            if (opMap.Map[tile.x][tile.y].shipId !== null) { // If the tile has a ship ID
                                // Determine direction and continue firing
                                this.hitCount++; // Increment the hit count
                                this.aiDirection = this.determineDirection(this.firstHit, tile); // Determine the direction
                                this.currentTarget = tile; // Set current target to the newly hit tile
                                return tile; // Return the tile
                            } else { // If the tile does not have a ship ID
                                // If miss, mark the tile and return
                                return tile; // Return the tile
                            } // End if the tile does not have a ship ID
                        } // End if the tile has not been hit
                    } // End for each tile in the adjacent tiles
                }
                else { //empty data for ship targeting process, reverts a to random targeting
                    this.aiDirection = null; // Reset the direction
                    this.firstHit = null; // Reset the first hit
                    this.currentTarget = null; // Reset the current target
                    this.hitShipId = null;  // Reset the hit ship ID
                    this.hitCount = 0;  // Reset the hit count
                    this.shipLength = 0; // Reset the ship length
                } // End if the hit count is not less than the ship length
            }

            // If no first hit, fire randomly to find a ship
            while (this.firstHit === null) { // While the first hit is null
                let tile = this.randomTile(); // Get a random tile
                if (!opMap.Map[tile.x][tile.y].isHit) { // If the tile has not been hit
                    if (opMap.Map[tile.x][tile.y].shipId !== null) { // If the tile has a ship ID
                        // If a ship is hit, record the first hit
                        this.hitShipId = opMap.Map[tile.x][tile.y].shipId; // Set the hit ship ID
                        this.shipLength = this.shipLengthRetriever(this.hitShipId); // Set the ship length
                        this.hitCount = 1; // Set the hit count
                        this.firstHit = tile; // Set the first hit
                        this.currentTarget = tile; // Set current target to the first hit tile
                        return tile; // Return the tile
                    } else { // If the tile does not have a ship ID
                    return tile; // Return the tile
                } // End if the tile does not have a ship ID
            } // End if the tile has not been hit
        } // End while the first hit is null

        // Hard difficulty logic: only target known ships
        if (this.aiType === HARD) {
            // Return the next tile from the target list
            if (this.aiTargetList.length > 0) {
                return this.aiTargetList.shift(); // Remove and return the next ship tile
            } else {
                this.targetShipTiles(opMap);
                return this.aiTargetList.shift();
            }
        }
    }
    /**
     * @returns {Coordinate}
     */

    //selects tile at random from grid to be targeted. Used in Easy and Medium difficulty
    randomTile() {
        let x = Math.trunc(Math.random() * (this.gridDimensions[0]));
        let y = Math.trunc(Math.random() * (this.gridDimensions[1]));

        return { x: x, y: y }
    }
    //aquires the next coordinate for targeting based on the existing direction of attack. Used in medium difficulty
    getNextTileInDirection(fromTile, direction, opMap) {
        let newX = fromTile.x;
        let newY = fromTile.y;

        switch (direction) {
            case "left":
                newX -= 1;
                break;
            case "right":
                newX += 1;
                break;
            case "up":
                newY -= 1;
                break;
            case "down":
                newY += 1;
                break;
        }

        if (
            newX >= 0 && newX < this.gridDimensions[0] &&
            newY >= 0 && newY < this.gridDimensions[1] &&
            !opMap.Map[newX][newY].isHit
        ) {
            return { x: newX, y: newY };
        }

        return false;
    }
    //once first hit is score the tiles on every side of the first hit will be appended to a list for potential targeting, used in medium difficulty 
    getAdjacentTiles(x, y, opMap) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];

        let adjacentTiles = [];

        directions.forEach(dir => {
            let newX = x + dir.dx;
            let newY = y + dir.dy;

            if (newX >= 0 && newX < this.gridDimensions[0] &&
                newY >= 0 && newY < this.gridDimensions[1] &&
                !opMap.Map[newX][newY].isHit) {
                adjacentTiles.push({ x: newX, y: newY });
            }
        });

        return adjacentTiles;
    }
    //if a miss is achieved while trying to sink a ship, the direction of attack will be changed. Used in medium difficulty
    determineDirection(fromTile, toTile) {
        if (fromTile.x === toTile.x) {
            if (fromTile.y < toTile.y) return "down";
            else return "up";
        }
        if (fromTile.y === toTile.y) {
            if (fromTile.x < toTile.x) return "right";
            else return "left";
        }
        return null;
    }
    //maps the ship name to the length of the ship. Used in medium difficulty
    shipLengthRetriever(shipID) {
        if (shipID == 'Destroyer') {
            return 1;
        }
        else if (shipID == 'Submarine') {
            return 2;
        }
        else if (shipID == 'Cruiser') {
            return 3;
        }
        else if (shipID == 'Battleship') {
            return 4;
        }
        else if (shipID == 'Carrier') {
            return 5;
        }
    }
    //creates an array of all coordinates that are hits, used in hard difficulty
    targetShipTiles(opMap) {
        // If the target list is empty, we need to scan the grid and populate it
        for (let x = 0; x < this.gridDimensions[0]; x++) {
            for (let y = 0; y < this.gridDimensions[1]; y++) {
                let cell = opMap.Map[x][y];
                if (cell.shipId !== null && !cell.isHit) {
                    this.aiTargetList.push({ x: x, y: y }); // Save ship tile to the target list
                }
            }
        }
    }

    //attempts to fire at a target
    attemptFire(x, y, targetPlayer, sourcePlayer) {
        if (this.maps[targetPlayer] == undefined) { //no player
            return [false, "UndefinedPlayer"];
        }

        if (x < 0 || y < 0 || x >= this.gridDimensions || y >= this.gridDimensions) { //out of bounds
            return [false, "BoundsRejection"];
        }

        if (!this.guessHistory[sourcePlayer]) { //if no guess history, make a new guest history
            this.guessHistory[sourcePlayer] = [];
        }

        this.guessHistory[sourcePlayer].push({ targetPlayer: targetPlayer, x: x, y: y }); //add guess

        const mapSquareData = this.maps[targetPlayer].Map[x][y]; //pulls a specific square from Map data struct

        if (mapSquareData === undefined || mapSquareData.isHit) { // if this space has been hit
            return [false, "InvalidGuess"]
        }

        if (mapSquareData.shipId === null || mapSquareData.shipId === undefined) { //checks to see if the space has not been hit and if there is no ship
            mapSquareData.isHit = true;
            return [false, "TrueMiss"];
        }

        const hitShipObject = this.maps[targetPlayer].Ships[mapSquareData.shipId];

        if (hitShipObject === null || hitShipObject.IsSunk || mapSquareData.isHit) { //if bad guess
            return [false, "InvalidGuess"];
        }

        // The ship was hit!
        this.maps[targetPlayer].Map[x][y].isHit = true;

        let isShipSunk = true;
        hitShipObject.Definition.forEach(coordinate => { //checks to see if a ship was sunk
            if (this.maps[targetPlayer].Map[coordinate.x][coordinate.y].isHit === false) {
                isShipSunk = false;
            }
        });

        this.maps[targetPlayer].Ships[mapSquareData.shipId].IsSunk = isShipSunk;

        if (isShipSunk) { //if it is sunk, check to see if the whole ship if sunk. if so, check win condition.
            let didSourcePlayerWinGame = true;
            for (let shipID in this.maps[targetPlayer].Ships) {
                if (this.maps[targetPlayer].Ships.hasOwnProperty(shipID)) {
                    let shipObject = this.maps[targetPlayer].Ships[shipID];
                    if (shipObject.IsSunk === false) {
                        didSourcePlayerWinGame = false;
                    }
                }
            }

            if (didSourcePlayerWinGame) {
                return [true, "GameWin"]
            }
        }

        return [true, "TrueHit", isShipSunk, hitShipObject]

    }

}

module.exports = [BattleshipRound, AIPlayer, NO_AI, EASY, MEDIUM, HARD];