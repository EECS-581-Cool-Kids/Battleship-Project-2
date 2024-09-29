trap 'trap - SIGTERM && kill -- -$$' SIGINT SIGTERM EXIT  # Kill all child processes when the script is killed

npm run server& # Run the server
npm run play& # Run the first player
npm run play second # Run the second player