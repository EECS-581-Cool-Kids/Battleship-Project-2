/*
Description: Grid creation, placing ships, game logic
Inputs: 
Outputs: Handles Front-End Game Logic and Game page
Sources: stackoverflow.com (refresh how to use javascript and handling containers)
Authors: Chase Curtis, William Johnson, Matthew Petillo, Emily Tso
Creation date: 9-9-24
*/

//details of the ships
const ships = [ //ships
    { name: 'Carrier', length: 5, placed: false }, //carrier
    { name: 'Battleship', length: 4, placed: false }, //battleship
    { name: 'Cruiser', length: 3, placed: false }, //cruiser
    { name: 'Submarine', length: 2, placed: false }, //submarine
    { name: 'Destroyer', length: 1, placed: false } //destroyer
]; //end ships

const shots = [ //shots
    { name: '1x1', length: 1, count: -1 }, //1x1
    { name: '3x3', length: 3, count: 3  } //3x3
]; //end shots

let selectedShip = ships[4]; //default ship
let selectedShot = shots[0]; //default shot
let selectedSpecialShot = false; //default mode for the special shot
let isHorizontal = true; //default orientation
let placedShips = 0; //number of ships placed
let isAttackMode = false; //game mode
let numShips = 0; //number of ships

//store ship coordinates in objects
const playerShips = { //player ships
    Carrier: [], //carrier
    Battleship: [], //battleship
    Cruiser: [], //cruiser
    Submarine: [], //submarine
    Destroyer: [] //destroyer
}; //end player ships

//grids for player ships and opponent guessing
const playerShipGrid = Array(10).fill(null).map(() => Array(10).fill(null)); //player ship grid

//html elements references
const grid = document.getElementById('grid');  //grid
const shipSelect = document.getElementById('shipSelect'); //ship selection
const toggleOrientationButton = document.getElementById('toggleOrientation'); //toggle orientation
const startGameButton = document.getElementById('startGame'); //start game
const removeShipButton = document.getElementById('removeShip'); //remove ship
const playerBoard = document.getElementById('playerBoard'); //player board
const opponentBoard = document.getElementById('opponentBoard'); //opponent board
const gameBoardContainer = document.getElementById('gameBoardContainer'); //game board container
const specialShotCounter = document.getElementById("specialShotCounter"); //special shot counter

// eventlistener where it ensures content is loaded and executed
document.addEventListener("DOMContentLoaded", function () { //waits for content to load
    function waitForSocket(callback) { //waits for socket to load
        if (window.socket) { //socket is loaded
            callback(); //callback
        } else { //socket is not loaded
            setTimeout(() => waitForSocket(callback), 100); //wait for socket
        } //end if
    } //end waitForSocket

    waitForSocket(() => { //waits for socket
        //handle player shot
        function handlePlayerShot(row, col) { //player shot
            if (selectedSpecialShot && selectedShot.count > 0) //special shot
            { //special shot
                selectedShot.count--; //decrement special shot
                shotNum = 1; //shot number
                for (let x = row-1; x < row+2; x++) // for x in +/- 1 row
                { //for x in +/- 1 row
                    for (let y = col-1; y < col+2; y++) // for y in +/- 1 col
                    { //for y in +/- 1 col
                        console.log(`Player shot at: Row ${x + 1}, Col ${y + 1}`); //print shot to console
                        window.socket.emit("tryHit", { x: x, y: y, isSpecial: true, shotNum: shotNum }); //emit shot to server
                        shotNum++; //increment shot number
                    } //end for y in +/- 1 col
                } //end for x in +/- 1 row

                specialShotCounter.textContent = "Special Shots: " + selectedShot.count; //update special shot counter
            }  //end special shot
            else //normal shot
            { //normal shot
                console.log(`Player shot at: Row ${row + 1}, Col ${col + 1}`); //print shot to console
                window.socket.emit("tryHit", { x: row, y: col, isSpecial: false, shotNum: -1 }); //emit shot to server
            } //end normal shot
        } //end player shot
        //adds the right amount of ship options to ./main.html
        function addShipOptions(){  //adds ship options
            shipSelect.innerHTML = ""; //clears ship selection
            options = ['<option value="Destroyer">Destroyer (1)</option>', '<option value="Submarine">Submarine (2)</option>', '<option value="Cruiser">Cruiser (3)</option>', '<option value="Battleship">Battleship (4)</option>', '<option value="Carrier">Carrier (5)</option>']; //options
            for (let i = 0; i < numShips; i++){ //adds ships to the selection
                shipSelect.innerHTML += options[i]; //adds ship to selection
            } //end for
        }    //end addShipOptions

        //creates 10x10 grid
        function createGrid(container, gridType) { //creates grid
            container.innerHTML = ''; //clear existing content

            //create grid wrapper
            const gridWrapper = document.createElement('div'); //grid wrapper
            gridWrapper.classList.add('grid-wrapper'); //grid wrapper

            //column labels as letters A-J
            const headerRow = document.createElement('div'); //header row
            headerRow.classList.add('header-row'); //header row

            //dummy cell for grid labels
            const dummyCell = document.createElement('div'); //dummy cell
            dummyCell.classList.add('dummy-cell'); //dummy cell
            headerRow.appendChild(dummyCell); //append dummy cell to header row

            for (let col = 0; col < 10; col++) {  //for col in 0-9
                const label = document.createElement('div'); //label
                label.classList.add('header-item'); //label
                label.textContent = String.fromCharCode(65 + col); // A-J
                headerRow.appendChild(label); //append label to header row
            } //end for
            gridWrapper.appendChild(headerRow); //append header row to the grid wrapper

            //row labels as number 1-10
            for (let row = 0; row < 10; row++) { //for row in 0-9
                const rowDiv = document.createElement('div'); //row div
                rowDiv.classList.add('row'); //row div

                // row label
                const rowLabel = document.createElement('div'); //row label
                rowLabel.classList.add('row-label'); //row label
                rowLabel.textContent = row + 1; // 1-10
                rowDiv.appendChild(rowLabel); //append row label to row div

                // create cells
                for (let col = 0; col < 10; col++) { //for col in 0-9
                    const cell = document.createElement('div'); //cell
                    cell.classList.add('grid-item'); //cell
                    cell.dataset.row = row + 1; // 1-10
                    cell.dataset.col = col + 1; // 1-10
                    rowDiv.appendChild(cell); //append cell to row div

                    // add event listener for player's grid
                    cell.addEventListener('click', function() { //click event
                        const clickedRow = parseInt(this.dataset.row) - 1; //clicked row
                        const clickedCol = parseInt(this.dataset.col) - 1; //clicked col

                        if (gridType === 'player' && !isAttackMode) { //player grid
                            placeShip(clickedRow, clickedCol); //place ship
                        } else if (gridType === 'opponent' && isAttackMode) {  //opponent grid
                            handlePlayerShot(clickedRow, clickedCol); //handle player shot
                        } //end if
                    }); //end click event
                } //end for
                gridWrapper.appendChild(rowDiv); //append row to the grid wrapper
            } //end for

            // append grid with labels to the grid wrapper
            container.appendChild(gridWrapper); //append grid wrapper to container
        } //end createGrid

        createGrid(grid, 'player');  // create player's grid

        //place ship function
        function placeShip(row, col) { //place ship
            if (selectedShip.placed) { //ship placed
                alert(`${selectedShip.name} has already been placed.`); //alert
                return; //return
            } //end if

            if (canPlaceShip(row, col, selectedShip.length, isHorizontal)) { //can place ship
                let coordinates = []; // store coordinates of the placed ship

                for (let i = 0; i < selectedShip.length; i++) { //for i in ship length
                    if (isHorizontal) { // horizontal placement
                        playerShipGrid[row][col + i] = selectedShip.name; //player ship grid
                        markCellAsShip(row, col + i); //mark cell as ship
                        coordinates.push({ x: row, y: col + i }); // store coordinates
                    } else { // vertical placement
                        playerShipGrid[row + i][col] = selectedShip.name; //player ship grid
                        markCellAsShip(row + i, col); //mark cell as ship
                        coordinates.push({ x: row + i, y: col }); // store coordinates
                    } //end if
                } //end for
                selectedShip.placed = true; //ship placed
                placedShips++; //increment placed ships
                playerShips[selectedShip.name] = coordinates; // store ship coordinates in the player ships
                checkAllShipsPlaced(); // check if all ships are placed
            } else { // cannot place ship
                alert('Cannot place ship here.'); //alert
            } //end if
        } //end place ship

        // mark cells as part of ship function
        function markCellAsShip(row, col) {  //mark cell as ship
            const cell = document.querySelector(`[data-row="${row + 1}"][data-col="${col + 1}"]`); //cell
            if (cell) { //cell exists
                cell.style.backgroundColor = 'gray'; //visual
            } //end if
        } //end mark cell as ship

        // check if the ship can be placed function
        function canPlaceShip(row, col, length, isHorizontal) { //can place ship
            if (isHorizontal) { // horizontal placement
                if (col + length > 10) return false; // horizontal out of bounds
                for (let i = 0; i < length; i++) { //for i in length
                    if (playerShipGrid[row][col + i] !== null) return false; //collision
                } //end for
            } else { // vertical placement
                if (row + length > 10) return false; // vertical out of bounds
                for (let i = 0; i < length; i++) { //for i in length
                    if (playerShipGrid[row + i][col] !== null) return false; //collision
                } //end for
            } //end if
            return true; //can place ship
        } //end can place ship

        // check if all ships are placed
        function checkAllShipsPlaced() {
            let count = 5; //counts backwards to account for how ships are created formatwise
            const curShips = Object.keys(playerShips); //current ships
            for (let ship in Object.values(curShips)){ //for ship in current ships
                if (count > numShips && playerShips[curShips[ship]].length != 0){ //checks if ship should be empty
                    return false; //return false
                } //end if
                else if (count <= numShips && playerShips[curShips[ship]].length != count){//checks if ship should be full
                    return false; //return false
                } //end else if
                count--; //decrement count
            } //end for
            startGameButton.disabled = false; // enable start game button if all ships are placed
            return true; //return true
        } //end check all ships placed

        // handle ship selection change 
        shipSelect.addEventListener('change', function() { //ship selection
            const shipName = this.value; //ship name
            selectedShip = ships.find(ship => ship.name === shipName); // find selected ship
        }); //end ship selection

        // toggle ship orientation
        toggleOrientationButton.addEventListener('click', function() { //toggle orientation
            isHorizontal = !isHorizontal; //horizontal or vertical
            toggleOrientationButton.textContent = isHorizontal ? 'Horizontal' : 'Vertical'; //change button text
        }); //end toggle orientation

        // remove selected ship
        removeShipButton.addEventListener('click', function() { //remove ship
            if (!selectedShip.placed) { //ship not placed
                console.log(`${selectedShip.name} is not placed yet.`); //print to console
                return;  //return
            } //end if

            // clear the ship's coordinates from the grid
            for (let row = 0; row < 10; row++) { //for row in 0-9
                for (let col = 0; col < 10; col++) { //for col in 0-9
                    if (playerShipGrid[row][col] === selectedShip.name) { //player ship grid
                        playerShipGrid[row][col] = null; //clear cell
                        const cell = document.querySelector(`[data-row="${row + 1}"][data-col="${col + 1}"]`); //cell
                        if (cell) {  //cell exists
                            cell.style.backgroundColor = 'lightblue'; //color of the player's ships on the grid
                        } //end if
                    } //end if
                } //end for
            } //end for
            
            // reset ship placement
            selectedShip.placed = false; //ship not placed
            placedShips--; //decrement placed ships
            playerShips[selectedShip.name] = []; // clear ship's coordinates
            startGameButton.disabled = true; // disable start game button if all ships are not placed
        }); //end remove ship

        // more html elements references
        const gridHeader = document.getElementById('gridHeader'); //grid header
        const setupControls = document.getElementById('setupControls'); //setup controls
        const turnLabel = document.getElementById('turnIndicatorLabel'); //turn label
        const waitingForPlayers = document.getElementById('waitingForAllPlayers'); //waiting for players
        const errorFooterArea = document.getElementById("errorFooter"); //error footer
        const errorLabel = document.getElementById("errorLabel"); //error label
        const statusLabel = document.getElementById("statusLabel"); //status label
        const shotSelect = document.getElementById("shotSelect"); //shot selection
        
        shotSelect.addEventListener('change', function() { //shot selection
            const shotName = this.value; //shot name
            selectedShot = shots.find(shot => shot.name == shotName); //find selected shot
            selectedSpecialShot = selectedShot.count != -1; //special shot
        }); //end shot selection

        // display player's placed ships on the grid
        function displayPlayerShips() { //display player ships
            for (let row = 0; row < 10; row++) {  //for row in 0-9
                for (let col = 0; col < 10; col++) { //for col in 0-9
                    if (playerShipGrid[row][col] !== null) { //player ship grid
                        const cell = document.querySelector(`#playerBoard [data-row="${row + 1}"][data-col="${col + 1}"]`); //cell
                        if (cell) { //cell exists
                            cell.style.backgroundColor = 'gray'; // color of the player's ships on the grid
                        } //end if
                    } //end if
                } //end for
            } //end for
        } //end display player ships

        // add event listener click for the start game button
        startGameButton.addEventListener('click', function() { //start game
            if (isAttackMode) return; //attack phase
            isAttackMode = true;  //attack phase
            
            setupControls.style.display = 'none'; //hide setup controls
            errorFooterArea.style.display = "none"; //hide error footer
            let filledships = {}; //filled ships
            for (let [name, positions] of Object.entries(playerShips)){ //fill ships
                if (positions.length != 0){ //positions exist
                    filledships[name] = positions; //fill ships
                } //end if
            } //end for
            window.socket.emit("registerShipPlacements", filledships); //emit ship placements to server
        }); //end start game


        window.socket.on("registerShips", (data) => { //sends response
            if (data.status == "Success"){ //success
                waitingForPlayers.style.display = 'block'; //game is waiting for players
            } else { //error
                errorLabel.textContent = "Failed to Register Ship Placements: " + data.reason; //error message
                errorFooterArea.style.display = "block"; //error finding players
            }
        });  //end register ships

        window.socket.on("playersReady", (data) => { //players are ready
             // show game board container and header
             gameBoardContainer.style.display = 'flex'; //game board container
             gridHeader.style.display = 'block'; //grid header
 
             // hide grid and control buttons
             grid.style.display = 'none'; //hide grid
             waitingForPlayers.style.display = 'none'; //hide waiting for players
             turnLabel.textContent = "It's " + (data.firstPlayer === window.clientId ? "your" : "your opponent's") + " turn!"; //turn label
             turnLabel.style.display = "block"; //show turn

             shotSelect.style.display = ""; //show shot selection
             specialShotCounter.style.display = ""; //show special shot counter
 
             // create grids for both player and opponent
             createGrid(playerBoard, 'player'); // player's
             createGrid(opponentBoard, 'opponent'); // opponent's
 
             displayPlayerShips(); // show player's ships on their reference grid
             console.log('Game started! Now in attack mode.'); //print to console
 
             startGameButton.disabled = true; // disable the "Start Game" button after it's clicked once
             statusLabel.textContent = ""; // clear status label
             statusLabel.style.display = "block"; // show status label
        });

        window.socket.on("setTurn", (data) => { //turns
            turnLabel.textContent = "It's " + (data.whosTurn === window.clientId ? "your" : "your opponent's") + " turn!"; //turn label
        }); //end set turn

        window.socket.on("hitTarget", (data) => { //player hits target
            const cell = document.querySelector(`#opponentBoard [data-row="${data.coordinates.x + 1}"][data-col="${data.coordinates.y + 1}"]`); //cell
            if (cell) { //cell exists
                cell.style.backgroundColor = 'red'; // visual for hit
            } //end if
            statusLabel.textContent = "You hit one of their ships!"; //status label
        }); //end hit target

        window.socket.on("missedTarget", (data) => { //player misses target
            const cell = document.querySelector(`#opponentBoard [data-row="${data.coordinates.x + 1}"][data-col="${data.coordinates.y + 1}"]`); //cell
            if (cell) { //cell exists
                cell.style.backgroundColor = 'white'; // visual for hit
            } //end if
            statusLabel.textContent = "Oops... that was a miss!"; //status label
        }); //end missed target

        window.socket.on("gotHit", (data) => { //player gets hit
            const cell = document.querySelector(`#playerBoard [data-row="${data.coordinates.x + 1}"][data-col="${data.coordinates.y + 1}"]`); //cell
            if (cell) { //cell exists
                cell.style.backgroundColor = 'red'; // visual for hit
            } //end if
            statusLabel.textContent = "They hit one of your ships!"; //status label
        }); //end got hit

        window.socket.on("theyMissed", (data) => { //opponent misses player
            const cell = document.querySelector(`#playerBoard [data-row="${data.coordinates.x + 1}"][data-col="${data.coordinates.y + 1}"]`); //cell
            if (cell) { //cell exists
                cell.style.backgroundColor = 'white'; // visual for hit
            } //end if
            statusLabel.textContent = "They missed that shot..."; //status label
        }); //end they missed

        window.socket.on("sunkShip", (data) => { //sunk ships
            const targetBoard = (data.attackedPlayer === window.clientId ? "#playerBoard" : "#opponentBoard"); //target board
            data.shipObject.Definition.forEach(coordinate => {  //coordinates
                const cell = document.querySelector(`${targetBoard} [data-row="${coordinate.x + 1}"][data-col="${coordinate.y + 1}"]`); //coordinates
                if (cell) { //cell exists
                    cell.style.backgroundColor = 'DarkRed'; // visual for sunk ships
                } //end if
            }); //end coordinates
            statusLabel.textContent = (data.attackedPlayer === window.clientId ? "Oh no! They sunk one of your ships!" : "You sunk one of their ships!"); //status label
        });  //end sunk ship

        window.socket.on("youWon", (data) => {  //player wins
            window.electronAPI.navigateToPage("./gameOver/winner.html"); //navigates to winning page
        }); //end you won

        window.socket.on("youLost", (data) => { //player loses
            window.electronAPI.navigateToPage("./gameOver/looser.html"); //navigates to losing page
        }); //end you lost

        //bounces number of ships to server
        window.socket.on("setNumberOfShips", (data) => { //sets number of ships
            if (data.status != "Success"){ //error
                errorLabel.textContent = "Failed to fetch number of ships: " + data.reason; //error message
                errorFooterArea.style.display = "block"; //error footer
                return; //return
            } //end if
            numShips = data.numShips; //number of ships
            addShipOptions(); //adds ships to selection
        }); //end set number
        //gets number of ships to server
        window.socket.emit("fetchNumberOfShips", {});
    }); //end waitForSocket
}); //end content loaded
