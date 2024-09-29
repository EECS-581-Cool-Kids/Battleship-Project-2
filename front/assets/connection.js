/* connection.js
Description: The program that is used by all client html pages to initialize communication with the server based on the client configuration. Handles the server-client handshake.
Inputs: None
Outputs: None
Sources: node.js and sockets.io official documentation
Authors: William Johnson
Creation date: 9-13-24
*/

// Uses loadConfig defined in main.js to load the config file and then uses its contents to initialize a handshake with the server.
window.api.loadConfig()
    .then(config => {
        let serverAddress;
        if (config.Build === "Dev") {
            serverAddress = config.DevServerAddress;
        } else {
            serverAddress = config.LiveServerAddress;
        }

        const script = document.createElement('script');
        script.src = serverAddress + "/socket.io/socket.io.js";

        script.onload = () => {
            console.log("Socket.IO script loaded successfully from:", serverAddress);

            window.clientId = config.ClientId;

            const new_socket = io(serverAddress);

            // Server handshake request to register our client ID
            new_socket.on('getClientId', () => {
                new_socket.emit('registerClientId', { ClientId: config.ClientId });
            });

            // Handshake completed, we can now expose the socket for use by the consuming html file.
            new_socket.on('acknowledgeRegistration', ( data ) => {
                window.socket = new_socket;
            });
        };

        script.onerror = () => {
            console.error("Failed to load the Socket.IO script from:", serverAddress);
        };

        document.head.appendChild(script);
    })
    .catch(error => console.error("Error loading config.json:", error));
    
