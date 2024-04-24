// socketHandlers.js
const dbsingleton = require('../models/db_access.js');

const db = dbsingleton;
db.get_db_connection();

async function getUserId(){
    var query = `SELECT * FROM users WHERE username = '${username}'`;
    var result = await db.send_sql(query);
}

const socketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join_room', (data) => {
            socket.join(data.room_name);
            console.log(data.username)
            console.log(`Socket ${socket.id} and ${data.username} joined room ${data.room_name}`);
        });

        socket.on('create_room', (data) => {
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
};

module.exports = { socketHandler: socketHandlers }; // Updated module exports
