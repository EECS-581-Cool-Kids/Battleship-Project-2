/* battleshipRound.js
Description: Battleship Round module. Creates data structures for matches that keeps all necessary information required by server for a single game round
Inputs: None
Outputs: BattleshipRound
Sources: 
Authors: William Johnson
Creation date: 9-13-24
*/

const AIPlayer = 0

const NO_AI = 0;
const EASY = 1;
const MEDIUM = 2;
const HARD = 3;

//For internal use - creates a map based off a given X, Y format.
class Map {
    /**
     * Coordinate object, used for addShip, isValid
     * @typedef {Object} Coordinate 
     * @property {number} x
     * @property {number} y
     */
    /**
     * @typedef  CellData
     * @type {object}
     * @property {?number} shipId
     * @property {bool} isHit
     */
    /**
     * @typedef Ship
     * @type {object}
     * @property {Coordinate[]} Definition
     * @property {bool} IsSunk
     */

    //takes dimensions in [x, y] format
    constructor(dimensions){
        console.log(dimensions[0]);
        this.dimensions = dimensions
        
        /** @type {Object.<number, Object.<number, CellData>>} */
        this.Map = {};
        /** @type {Object.<number, Ship>} */
        this.Ships = {};
        //creates an array based map
        for (let i = 0; i < dimensions[0]; i++) {
            /** @type {Object.<number, CellData>} */
            const row = {};
            for (let j = 0; j < dimensions[1]; j++) {
                row[j] = { shipId: null, isHit: false };
            }
            this.Map[i] = row;
        }
    }
    
    /**
     * @param {int} shipId - number 1-5
     * @param {Coordinate[]} shipDefinition - array of coordinates, length should be equal to shipId.
     */
    addShip(shipId, shipDefinition){
        this.Ships[shipId] = {}
        this.Ships[shipId].Definition = shipDefinition;
        this.Ships[shipId].IsSunk = false;
        
        shipDefinition.forEach(coordinate => { //coordinate should be an array, so runs through each
            if (this.Map[coordinate.x] === undefined){
                this.Map[coordinate.x] = {};
            }
            this.Map[coordinate.x][coordinate.y] = { shipId: shipId, isHit: false };
        });
    }

    /**
     * 
     * @param {Coordinate[]} shipDefinition 
     * @returns {boolean} returns if the ship placement would be valid.
     */
    isValid(shipDefinition){
        shipDefinition.forEach(coordinate => { //coordinate should be an array, so runs through each
            if (this.Map[coordinate.x][coordinate.y].shipId == null) {
              return false;
            }
        });
        return true;
    }
    /**
     * 
     * @param {number} shipId should be between 1 and 5
     */
    addAIShip(shipId) {
        const horizontal = (Math.random() >= 0.5)
        while (1) {
          
            let x = Math.trunc(Math.random() * (this.dimensions[0]-1));
            let y = Math.trunc(Math.random() * (this.dimensions[1]-1));
            
            /** @type {Coordinate[]} */
            let coordinates = [];
            
            for (let i = 0; i < shipId; i++) {
                if (horizontal) {
                    let _x;
                    if (x + i >= 10) {
                        _x = x - (x + i - 10) - 1
                    } else {
                        _x = x + i
                    }
                    coordinates.push({x:_x, y:y})
                } else {
                    let _y;
                    if (y + i >= 10) {
                        _y = y - (y + i - 10) - 1;
                    } else {
                        _y = y + i;
                    }
                    coordinates.push({x:x,y:_y});
                }
                
            }
            if (this.isValid(coordinates)) {
                this.addShip(shipId, coordinates)
                return;
            }
        }
    }
}

//data structure for a battleship round
class BattleshipRound {
    //takes host clientId, num of ships, grid dimensions for Maps
    constructor(host, numberOfShips, gridDimensions){
        this.host = host;
        /** @type {number[]} */
        this.players = [];
        this.numberOfShips = numberOfShips;
        /** @type {Object.<number, Map>} */
        this.maps = {};
        this.guessHistory = {};
        this.gridDimensions = gridDimensions;
        this.whosTurn = null;
        this.hasPlacedShips = {};
        this.aiType = NO_AI;
        this.aiTargetList = [];
    }
    //adds player and attaches a map
    addPlayer(clientId){
        this.players.push(clientId);
        this.maps[clientId] = new Map(this.gridDimensions);
    }

    addAI(difficulty){
        this.aiType = difficulty
        this.players.push(AIPlayer)
        this.maps[AIPlayer] = new Map(this.gridDimensions);
        for (let i = 0; i < this.numberOfShips; i++) {
            this.maps[AIPlayer].addAIShip(i+1)
            console.log("ship " + (i+1) + " added");
        }
    }
    aiTurn() {
        const opMap = this.maps[this.host]

        if (this.aiType == EASY || this.aiType === MEDIUM) {
            while(1) {
                let tile = this.randomTile();
                if (!opMap.Map[tile.x][tile.y].isHit) {
                    //medium logic to be positioned here
                    return tile;
                    
                }
            }
        }
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
    randomTile() {
        let x = Math.trunc(Math.random() * (this.gridDimensions[0] - 1));
        let y = Math.trunc(Math.random() * (this.gridDimensions[1] - 1));

        return {x:x, y:y}
    }

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
    attemptFire(x, y, targetPlayer, sourcePlayer){
        if (this.maps[targetPlayer] == undefined) { //no player
            return [false, "UndefinedPlayer"];
        } 

        if (x < 0 || y < 0 || x >= this.gridDimensions || y >= this.gridDimensions){ //out of bounds
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

        if (mapSquareData.shipId === null || mapSquareData.shipId === undefined){ //checks to see if the space has not been hit and if there is no ship
            mapSquareData.isHit = true;
            return [false, "TrueMiss"];
        }

        const hitShipObject = this.maps[targetPlayer].Ships[mapSquareData.shipId];
        
        if (hitShipObject === null || hitShipObject.IsSunk || mapSquareData.isHit){ //if bad guess
            return [false, "InvalidGuess"];
        }

        // The ship was hit!
        this.maps[targetPlayer].Map[x][y].isHit = true;

        let isShipSunk = true;
        hitShipObject.Definition.forEach(coordinate => { //checks to see if a ship was sunk
            if (this.maps[targetPlayer].Map[coordinate.x][coordinate.y].isHit === false){
                isShipSunk = false;
            }
        });

        this.maps[targetPlayer].Ships[mapSquareData.shipId].IsSunk = isShipSunk;

        if (isShipSunk){ //if it is sunk, check to see if the whole ship if sunk. if so, check win condition.
            let didSourcePlayerWinGame = true;
            for (let shipID in this.maps[targetPlayer].Ships) {
                if (this.maps[targetPlayer].Ships.hasOwnProperty(shipID)) {
                    let shipObject = this.maps[targetPlayer].Ships[shipID];
                    if (shipObject.IsSunk === false){
                        didSourcePlayerWinGame = false;
                    }
                }
            }

            if (didSourcePlayerWinGame){
                return [true, "GameWin"]
            }
        }

        return [true, "TrueHit", isShipSunk, hitShipObject]

    }

}

module.exports = [ BattleshipRound, AIPlayer, NO_AI, EASY, MEDIUM, HARD ];