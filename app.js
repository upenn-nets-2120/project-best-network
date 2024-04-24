const express = require('express');
const app = express();
const port = 8080;
const registry = require('./routes/register_routes.js');
const session = require('express-session');
const cors = require('cors');
const http = require('http').createServer(app); // Create an HTTP server passing in the Express app

const socketIO = require('socket.io')(http, {  // Attach Socket.IO to the HTTP server, not the express instance
    cors: {
        origin: "http://localhost:4567", // Make sure this is the correct client URL
        methods: ["GET", "POST"] // Specify which methods are allowed
    }
});

socketIO.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);
    socket.on('disconnect', () => {
      console.log('🔥: A user disconnected');
    });
});

app.use(cors({
  origin: 'http://localhost:4567', // Ensure this matches your front-end URL
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

http.listen(port, () => {  // Use http.listen instead of app.listen
  console.log(`Main app listening on port ${port}`)
});
