const dbsingleton = require('../models/db_access.js');
const chat_route_helper = require('../routes/chat_route_helper.js');
const helper = require('../routes/chat_route_helper.js');

const db = dbsingleton;
db.get_db_connection();

let roomInvites = []; // Store room invitations as objects { inviteId, senderId, receiverId, room }
let connectedUsers = []; // Store connected users as objects { socketId, username }

const socketHandlers = (io) => {
    io.on('connection', (socket) => {

        socket.on('send_username', async ({ username }) => {
            var user_id = await helper.getUserId(username)
            var rooms = await helper.getRoomsForUser(user_id)
            
            socket.emit('chat_rooms', rooms);
            socket.emit('connected_users', connectedUsers.filter(user =>  user.username != username).map(user => user.username))
            var userExists = false;
            connectedUsers.forEach((user, index) => {
                if (user.username === username) {
                    connectedUsers[index].socketId = socket.id;
                    console.log(`User ${username} reconnected with updated socket ID ${socket.id}`);
                    userExists = true;
                }
            });
            if (!userExists) {
                connectedUsers.push({ socketId: socket.id, username : username });
                console.log(connectedUsers);
                socket.broadcast.emit('user_connected', { username });
            }

        });

        socket.on('disconnect', async () => {
            var username = helper.getUsernameBySocketId(connectedUsers,socket.id)
            if (username){
                connectedUsers = connectedUsers.filter(user => user.socketId !== socket.id); 
                socket.broadcast.emit('user_disconnected', { username: username });
            }
            console.log(`User with socket ID ${socket.id} disconnected`);
        });

        socket.on('leave_room', async (username) => {
            var user_id = await helper.getUserId(username)
            chat_route_helper.deleteUserFromRoom(user_id)
        });

        socket.on('accept_invite', async ({ invite }) => {
            const senderSocketId = await helper.getSocketIdByUsername(connectedUsers, invite.senderUsername);
            io.to(senderSocketId).emit('invite_accepted', invite);
            if (invite.room.roomID == null){
                var senderUserId = await helper.getUserId(invite.senderUsername);
                var receiverUserId = await helper.getUserId(invite.inviteUsername);
                var user_ids = [senderUserId, receiverUserId]
                console.log(user_ids)
                var roomID = await helper.createChatRoom(user_ids)
                socket.join(roomID);
                io.to(senderSocketId).emit('join_room', roomID);
            } else {
                await helper.addUserToRoom(user, invite.roomID);
                socket.join(roomID);
            }
            var users = await helper.getUsersInRoom(roomID)
            io.to(roomID).emit('chat_room', { roomID, users });
        });

        socket.on('join_room', (roomID) => {
            socket.join(roomID);
            console.log(`Socket ${socket.id} joined room ${roomID}`);
        });

        socket.on('send_chat_invite', async ({ senderUsername, inviteUsername }) => {
            const invitedSocketId = await helper.getSocketIdByUsername(connectedUsers, inviteUsername);
            console.log("here")
            if (invitedSocketId) {
                console.log(invitedSocketId)
                const inviteID = Date.now().toString(); 
                const invite = { inviteID, senderUsername, inviteUsername, roomID:null };
                roomInvites.push(invite);
                io.to(invitedSocketId).emit('receive_chat_invite', invite);
            } else {
                console.log(`User ${inviteUsername} not found or not connected.`);
            }
        });

        socket.on('group_chat_invite', ({ room, senderUsername, inviteUsername }) => {
            const invitedSocketId = helper.getSocketIdByUsername(connectedUsers, inviteUsername);
            if (invitedSocketId) {
                const inviteID = Date.now().toString(); 
                const invite = { inviteID, senderUsername, inviteUsername, room };
                roomInvites.push(invite);
                io.to(invitedSocketId).emit('receive_chat_invite', invite);
            } else {
                console.log(`User ${inviteUsername} not found or not connected.`);
            }
        });

        socket.on('send_room_message',async  ({room, message, senderUsername}) => {
            console.log(room)
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
            var user_id = await chat_route_helper.getUserId(senderUsername)
            await helper.sendMessageToDatabase(user_id, room.roomID, message, timestamp)
            var users = await helper.getUsersInRoom(room.roomID)
            users.forEach(async user_id => {
                var username = await helper.getUsername(user_id)
                var socketId = await helper.getSocketIdByUsername(connectedUsers,username)
                console.log(socketId)
                if (socketId){
                    io.to(socketId).emit('receive_room_message', {sender: username, timestamp: timestamp, message: message });
                }
            })
        });

    });
};

module.exports = { socketHandler: socketHandlers };
