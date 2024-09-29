 /* connection.js
Description: The program that is used by all client html pages to initialize communication with the server based on the client configuration. Handles the server-client handshake.
Inputs: None
Outputs: None
Sources: node.js and sockets.io official documentation
Authors: William Johnson
Creation date: 9-13-24
*/

// Uses loadConfig defined in main.js to load the config file and then uses its contents to initialize a handshake with the server.
window.api.loadConfig() // Load the config file
    .then(config => { // Use the config
        let serverAddress; // The address of the server
        if (config.Build === "Dev") { // If the build is development
            serverAddress = config.DevServerAddress; // Use the development server address
        } else { // If the build is live
            serverAddress = config.LiveServerAddress; // Use the live server address
        } // End if

        const script = document.createElement('script'); // Create a script element
        script.src = serverAddress + "/socket.io/socket.io.js"; // Set the source of the script to the Socket.IO script

        script.onload = () => { // When the script loads
            console.log("Socket.IO script loaded successfully from:", serverAddress); // Log that the script loaded successfully

            window.clientId = config.ClientId; // Store the client ID in the window object

            const new_socket = io(serverAddress); // Create a socket connection to the server

            // Server handshake request to register our client ID
            new_socket.on('getClientId', () => { // When the server requests the client ID
                new_socket.emit('registerClientId', { ClientId: config.ClientId }); // Send the client ID to the server
            }); // End when the server requests the client

            // Handshake completed, we can now expose the socket for use by the consuming html file.
            new_socket.on('acknowledgeRegistration', ( data ) => { // When the server acknowledges the registration
                window.socket = new_socket; // Store the socket in the window object
            }); // End when the server acknowledges the registration
        }; // End when the script loads

        script.onerror = () => { // If the script fails to load
            console.error("Failed to load the Socket.IO script from:", serverAddress); // Log that the script failed to load
        }; // End if the script fails to load

        document.head.appendChild(script); // Append the script to the head of the document
    }) // End using the config
    .catch(error => console.error("Error loading config.json:", error)); // Log any errors that occur
    
