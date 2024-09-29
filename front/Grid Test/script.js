/*
Description: Grid creation, placing ships, game logic
Inputs: 
Outputs: Handles Front-End Game Logic and Game page
Sources: stackoverflow.com (refresh how to use javascript and handling containers)
Authors: Chase Curtis, William Johnson, Matthew Petillo, Emily Tso
Creation date: 9-9-24
*/

//details of the ships
const ships = [
    { name: 'Carrier', length: 5, placed: false },
    { name: 'Battleship', length: 4, placed: false },
    { name: 'Cruiser', length: 3, placed: false },
    { name: 'Submarine', length: 2, placed: false },
    { name: 'Destroyer', length: 1, placed: false }
];

const shots = [
    { name: '1x1', length: 1, count: -1 },
    { name: '3x3', length: 3, count: 3  }
];

let selectedShip = ships[4]; //default ship
let selectedShot = shots[0]; //default shot
let selectedSpecialShot = false; //default mode for the special shot
let isHorizontal = true; //default orientation
let placedShips = 0; //number of ships placed
let isAttackMode = false; //game mode
let numShips = 0; //number of ships

//store ship coordinates in objects
const playerShips = {
    Carrier: [],
    Battleship: [],
    Cruiser: [],
    Submarine: [],
    Destroyer: []
};

//grids for player ships and opponent guessing
const playerShipGrid = Array(10).fill(null).map(() => Array(10).fill(null));

//html elements references
const grid = document.getElementById('grid'); 
const shipSelect = document.getElementById('shipSelect');
const toggleOrientationButton = document.getElementById('toggleOrientation');
const startGameButton = document.getElementById('startGame');
const removeShipButton = document.getElementById('removeShip');
const playerBoard = document.getElementById('playerBoard');
const opponentBoard = document.getElementById('opponentBoard');
const gameBoardContainer = document.getElementById('gameBoardContainer');
const specialShotCounter = document.getElementById("specialShotCounter");

// eventlistener where it ensures content is loaded and executed
document.addEventListener("DOMContentLoaded", function () {
    function waitForSocket(callback) { //waits for socket to load
        if (window.socket) { //socket is loaded
            callback();
        } else { //socket is not loaded
            setTimeout(() => waitForSocket(callback), 100);
        }
    }

    waitForSocket(() => {
        //handle player shot
        function handlePlayerShot(row, col) {
            if (selectedSpecialShot && selectedShot.count > 0)
            {
                selectedShot.count--;
                shotNum = 1;
                for (let x = row-1; x < row+2; x++)
                {
                    for (let y = col-1; y < col+2; y++)
                    {
                        console.log(`Player shot at: Row ${x + 1}, Col ${y + 1}`);
                        window.socket.emit("tryHit", { x: x, y: y, isSpecial: true, shotNum: shotNum });
                        shotNum++;
                    }
                }

                specialShotCounter.textContent = "Special Shots: " + selectedShot.count;
            }
            else
            {
                console.log(`Player shot at: Row ${row + 1}, Col ${col + 1}`);
                window.socket.emit("tryHit", { x: row, y: col, isSpecial: false, shotNum: -1 });
            }
        }
        //adds the right amount of ship options to ./main.html
        function addShipOptions(){ 
            shipSelect.innerHTML = "";
            options = ['<option value="Destroyer">Destroyer (1)</option>', '<option value="Submarine">Submarine (2)</option>', '<option value="Cruiser">Cruiser (3)</option>', '<option value="Battleship">Battleship (4)</option>', '<option value="Carrier">Carrier (5)</option>'];
            for (let i = 0; i < numShips; i++){ //adds ships to the selection
                shipSelect.innerHTML += options[i];
            }
        }   

        //creates 10x10 grid
        function createGrid(container, gridType) {
            container.innerHTML = ''; //clear existing content

            //create grid wrapper
            const gridWrapper = document.createElement('div');
            gridWrapper.classList.add('grid-wrapper');

            //column labels as letters A-J
            const headerRow = document.createElement('div');
            headerRow.classList.add('header-row');

            //dummy cell for grid labels
            const dummyCell = document.createElement('div');
            dummyCell.classList.add('dummy-cell');
            headerRow.appendChild(dummyCell);

            for (let col = 0; col < 10; col++) { 
                const label = document.createElement('div');
                label.classList.add('header-item');
                label.textContent = String.fromCharCode(65 + col); // A-J
                headerRow.appendChild(label);
            }
            gridWrapper.appendChild(headerRow); //append header row to the grid wrapper

            //row labels as number 1-10
            for (let row = 0; row < 10; row++) {
                const rowDiv = document.createElement('div');
                rowDiv.classList.add('row');

                // row label
                const rowLabel = document.createElement('div');
                rowLabel.classList.add('row-label');
                rowLabel.textContent = row + 1; // 1-10
                rowDiv.appendChild(rowLabel);

                // create cells
                for (let col = 0; col < 10; col++) {
                    const cell = document.createElement('div');
                    cell.classList.add('grid-item');
                    cell.dataset.row = row + 1;
                    cell.dataset.col = col + 1;
                    rowDiv.appendChild(cell);

                    // add event listener for player's grid
                    cell.addEventListener('click', function() {
                        const clickedRow = parseInt(this.dataset.row) - 1;
                        const clickedCol = parseInt(this.dataset.col) - 1;

                        if (gridType === 'player' && !isAttackMode) {
                            placeShip(clickedRow, clickedCol);
                        } else if (gridType === 'opponent' && isAttackMode) { 
                            handlePlayerShot(clickedRow, clickedCol);
                        }
                    });
                }
                gridWrapper.appendChild(rowDiv); //append row to the grid wrapper
            }

            // append grid with labels to the grid wrapper
            container.appendChild(gridWrapper);
        }

        createGrid(grid, 'player'); 

        //place ship function
        function placeShip(row, col) {
            if (selectedShip.placed) {
                alert(`${selectedShip.name} has already been placed.`);
                return;
            }

            if (canPlaceShip(row, col, selectedShip.length, isHorizontal)) { //can place ship
                let coordinates = []; // store coordinates of the placed ship

                for (let i = 0; i < selectedShip.length; i++) {
                    if (isHorizontal) { // horizontal placement
                        playerShipGrid[row][col + i] = selectedShip.name;
                        markCellAsShip(row, col + i);
                        coordinates.push({ x: row, y: col + i }); // store coordinates
                    } else { // vertical placement
                        playerShipGrid[row + i][col] = selectedShip.name;
                        markCellAsShip(row + i, col);
                        coordinates.push({ x: row + i, y: col }); // store coordinates
                    }
                }
                selectedShip.placed = true;
                placedShips++;
                playerShips[selectedShip.name] = coordinates; // store ship coordinates in the player ships
                checkAllShipsPlaced();
            } else { // cannot place ship
                alert('Cannot place ship here.');
            }
        }

        // mark cells as part of ship function
        function markCellAsShip(row, col) { 
            const cell = document.querySelector(`[data-row="${row + 1}"][data-col="${col + 1}"]`);
            if (cell) {
                cell.style.backgroundColor = 'gray'; //visual
            }
        }

        // check if the ship can be placed function
        function canPlaceShip(row, col, length, isHorizontal) {
            if (isHorizontal) {
                if (col + length > 10) return false; // horizontal out of bounds
                for (let i = 0; i < length; i++) {
                    if (playerShipGrid[row][col + i] !== null) return false; //collision
                }
            } else {
                if (row + length > 10) return false; // vertical out of bounds
                for (let i = 0; i < length; i++) {
                    if (playerShipGrid[row + i][col] !== null) return false; //collision
                }
            }
            return true;
        }

        // check if all ships are placed
        function checkAllShipsPlaced() {
            let count = 5; //counts backwards to account for how ships are created formatwise
            const curShips = Object.keys(playerShips);
            for (let ship in Object.values(curShips)){
                if (count > numShips && playerShips[curShips[ship]].length != 0){ //checks if ship should be empty
                    return false;
                }
                else if (count <= numShips && playerShips[curShips[ship]].length != count){//checks if ship should be full
                    return false;
                }
                count--;
            }
            startGameButton.disabled = false; // enable start game button if all ships are placed
            return true;
        }

        // handle ship selection change 
        shipSelect.addEventListener('change', function() {
            const shipName = this.value;
            selectedShip = ships.find(ship => ship.name === shipName); // find selected ship
        });

        // toggle ship orientation
        toggleOrientationButton.addEventListener('click', function() {
            isHorizontal = !isHorizontal; //horizontal or vertical
            toggleOrientationButton.textContent = isHorizontal ? 'Horizontal' : 'Vertical'; //change button text
        });

        // remove selected ship
        removeShipButton.addEventListener('click', function() {
            if (!selectedShip.placed) { //ship not placed
                console.log(`${selectedShip.name} is not placed yet.`);
                return;
            }

            // clear the ship's coordinates from the grid
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    if (playerShipGrid[row][col] === selectedShip.name) {
                        playerShipGrid[row][col] = null;
                        const cell = document.querySelector(`[data-row="${row + 1}"][data-col="${col + 1}"]`);
                        if (cell) {
                            cell.style.backgroundColor = 'lightblue';
                        }
                    }
                }
            }
            
            // reset ship placement
            selectedShip.placed = false;
            placedShips--;
            playerShips[selectedShip.name] = []; // clear ship's coordinates
            startGameButton.disabled = true; // disable start game button if all ships are not placed
        });

        // more html elements references
        const gridHeader = document.getElementById('gridHeader');
        const setupControls = document.getElementById('setupControls');
        const turnLabel = document.getElementById('turnIndicatorLabel');
        const waitingForPlayers = document.getElementById('waitingForAllPlayers');
        const errorFooterArea = document.getElementById("errorFooter");
        const errorLabel = document.getElementById("errorLabel");
        const statusLabel = document.getElementById("statusLabel");
        const shotSelect = document.getElementById("shotSelect");
        
        shotSelect.addEventListener('change', function() {
            const shotName = this.value;
            selectedShot = shots.find(shot => shot.name == shotName);
            selectedSpecialShot = selectedShot.count != -1;
        });

        // display player's placed ships on the grid
        function displayPlayerShips() {
            for (let row = 0; row < 10; row++) { 
                for (let col = 0; col < 10; col++) {
                    if (playerShipGrid[row][col] !== null) {
                        const cell = document.querySelector(`#playerBoard [data-row="${row + 1}"][data-col="${col + 1}"]`);
                        if (cell) {
                            cell.style.backgroundColor = 'gray'; // color of the player's ships on the grid
                        }
                    }
                }
            }
        }

        // add event listener click for the start game button
        startGameButton.addEventListener('click', function() {
            if (isAttackMode) return; //attack phase
            isAttackMode = true; 
            
            setupControls.style.display = 'none'; //hide setup controls
            errorFooterArea.style.display = "none"; //hide error footer
            let filledships = {};
            for (let [name, positions] of Object.entries(playerShips)){ //fill ships
                if (positions.length != 0){
                    filledships[name] = positions;
                }
            }
            window.socket.emit("registerShipPlacements", filledships); //emit ship placements to server
        });


        window.socket.on("registerShips", (data) => { //sends response
            if (data.status == "Success"){
                waitingForPlayers.style.display = 'block'; //game is waiting for players
            } else {
                errorLabel.textContent = "Failed to Register Ship Placements: " + data.reason;
                errorFooterArea.style.display = "block"; //error finding players
            }
        });

        window.socket.on("playersReady", (data) => { //players are ready
             // show game board container and header
             gameBoardContainer.style.display = 'flex';
             gridHeader.style.display = 'block';
 
             // hide grid and control buttons
             grid.style.display = 'none';
             waitingForPlayers.style.display = 'none';
             turnLabel.textContent = "It's " + (data.firstPlayer === window.clientId ? "your" : "your opponent's") + " turn!";
             turnLabel.style.display = "block";

             shotSelect.style.display = "";
             specialShotCounter.style.display = "";
 
             // create grids for both player and opponent
             createGrid(playerBoard, 'player'); // player's
             createGrid(opponentBoard, 'opponent'); // opponent's
 
             displayPlayerShips(); // show player's ships on their reference grid
             console.log('Game started! Now in attack mode.');
 
             startGameButton.disabled = true; // disable the "Start Game" button after it's clicked once
             statusLabel.textContent = ""; // clear status label
             statusLabel.style.display = "block"; // show status label
        });

        window.socket.on("setTurn", (data) => { //turns
            turnLabel.textContent = "It's " + (data.whosTurn === window.clientId ? "your" : "your opponent's") + " turn!";
        });

        window.socket.on("hitTarget", (data) => { //player hits target
            const cell = document.querySelector(`#opponentBoard [data-row="${data.coordinates.x + 1}"][data-col="${data.coordinates.y + 1}"]`);
            if (cell) {
                cell.style.backgroundColor = 'red'; // visual for hit
            }
            statusLabel.textContent = "You hit one of their ships!"; //status label
        });

        window.socket.on("missedTarget", (data) => { //player misses target
            const cell = document.querySelector(`#opponentBoard [data-row="${data.coordinates.x + 1}"][data-col="${data.coordinates.y + 1}"]`);
            if (cell) {
                cell.style.backgroundColor = 'white'; // visual for hit
            }
            statusLabel.textContent = "Oops... that was a miss!"; //status label
        });

        window.socket.on("gotHit", (data) => { //player gets hit
            const cell = document.querySelector(`#playerBoard [data-row="${data.coordinates.x + 1}"][data-col="${data.coordinates.y + 1}"]`);
            if (cell) {
                cell.style.backgroundColor = 'red'; // visual for hit
            }
            statusLabel.textContent = "They hit one of your ships!"; //status label
        });

        window.socket.on("theyMissed", (data) => { //opponent misses player
            const cell = document.querySelector(`#playerBoard [data-row="${data.coordinates.x + 1}"][data-col="${data.coordinates.y + 1}"]`);
            if (cell) {
                cell.style.backgroundColor = 'white'; // visual for hit
            }
            statusLabel.textContent = "They missed that shot..."; //status label
        });

        window.socket.on("sunkShip", (data) => { //sunk ships
            const targetBoard = (data.attackedPlayer === window.clientId ? "#playerBoard" : "#opponentBoard"); //target board
            data.shipObject.Definition.forEach(coordinate => { 
                const cell = document.querySelector(`${targetBoard} [data-row="${coordinate.x + 1}"][data-col="${coordinate.y + 1}"]`); //coordinates
                if (cell) {
                    cell.style.backgroundColor = 'DarkRed'; // visual for sunk ships
                }
            });
            statusLabel.textContent = (data.attackedPlayer === window.clientId ? "Oh no! They sunk one of your ships!" : "You sunk one of their ships!"); //status label
        });

        window.socket.on("youWon", (data) => { 
            window.electronAPI.navigateToPage("./gameOver/winner.html"); //navigates to winning page
        });

        window.socket.on("youLost", (data) => {
            window.electronAPI.navigateToPage("./gameOver/looser.html"); //navigates to losing page
        });

        //bounces number of ships to server
        window.socket.on("setNumberOfShips", (data) => {
            if (data.status != "Success"){ //error
                errorLabel.textContent = "Failed to fetch number of ships: " + data.reason; //error message
                errorFooterArea.style.display = "block"; //error footer
                return;
            }
            numShips = data.numShips; //number of ships
            addShipOptions(); //adds ships to selection
        });
        //gets number of ships to server
        window.socket.emit("fetchNumberOfShips", {});
    });
});
