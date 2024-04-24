const express = require('express');
const app = express();
const port = 8080;
const registry = require('./routes/register_routes.js');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
      origin: "http://localhost:4567", // Specify allowed origins
      methods: ["GET", "POST"], // Specify allowed methods
      credentials: true // Optional: Allow credentials
  }
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_room', (data) => {
        socket.join(data.room);
        console.log(`Socket ${socket.id} joined room ${data.room}`);
    });

    socket.on('leave_room', (data) => {
        socket.leave(data.room);
        console.log(`Socket ${socket.id} left room ${data.room}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    socket.on('send_room_message', (data) => {
        console.log('Message received in room', data.room, ':', data.message);
        io.to(data.room).emit('room_message', data.message);
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

server.listen(port, () => {  // Use http.listen instead of app.listen
  console.log(`Main app listening on port ${port}`)
});
