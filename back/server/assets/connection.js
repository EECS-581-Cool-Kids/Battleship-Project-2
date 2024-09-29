//__DEVELOPMENT_COPY_ONLY__//
// The real copy of this script should be in front-end. This version should be a mirror and is only used by test.js for testing comms.

fetch('./config.json')  // Fetch the config file
    .then(response => response.json())  // Parse the JSON
    .then(config => {  // Use the config
        let serverAddress;  // The address of the server
        if (config.Build === "Dev") {  // If the build is development
            serverAddress = config.DevServerAddress;  // Use the development server address
        } else {  // If the build is live
            serverAddress = config.LiveServerAddress;  // Use the live server address
        }  // End if

        const script = document.createElement('script');  // Create a script element
        script.src = serverAddress + "/socket.io/socket.io.js";  // Set the source of the script to the Socket.IO script

        script.onload = () => {  // When the script loads
            console.log("Socket.IO script loaded successfully from:", serverAddress);  // Log that the script loaded successfully

            window.socket = io(serverAddress);  // Create a socket connection to the server

            window.socket.on('getClientId', () => {  // When the server requests the client ID
                socket.emit('registerClientId', { ClientId: config.ClientId });  // Send the client ID to the server
            });  // End when the server requests the client
        };  // End when the script loads

        script.onerror = (err) => {  // If the script fails to load
            console.error("Failed to load the Socket.IO script from:", serverAddress, ":", err);  // Log that the script failed to load
        };  // End if the script fails to load

        document.head.appendChild(script);  // Append the script to the head of the document
    })  // End using the config
    .catch(error => console.error("Error loading config.json:", error));  // Log any errors that occur
