const express = require('express');
const app = express();
const port = 8080;
const registry = require('./routes/register_routes.js');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const socketHandler = require('./routes/socketHandlers.js'); 
const server = http.createServer(app);
const config = require('./config.json'); 

const io = socketIo(server, {
  cors: {
      origin: config.ec2+":4567", // Specify allowed origins
      methods: ["GET", "POST"], // Specify allowed methods
      credentials: true // Optional: Allow credentials
  }
});

socketHandler.socketHandler(io);



app.use(cors({
  origin: config.ec2+':4567', // Ensure this matches your front-end URL
  methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: 'nets2120_insecure',
  saveUninitialized: true,
  cookie: { httpOnly: false },
  resave: true
}));

registry.register_routes(app);

server.listen(port, () => {  // Use http.listen instead of app.listen
  console.log(`Main app listening on port ${port}`)
});
