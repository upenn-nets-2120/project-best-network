const dbsingleton = require('../models/db_access.js');
const chat_route_helper = require('../routes/chat_route_helper.js');
const helper = require('../routes/chat_route_helper.js');

const db = dbsingleton;
db.get_db_connection();

let roomInvitations = []; // Store room invitations as objects { inviteId, senderId, receiverId, room }
let connectedUsers = []; // Store connected users as objects { socketId, username }

const socketHandlers = (io) => {
    io.on('connection', (socket) => {
        socket.emit('connected_users', connectedUsers.map(user => user.username));

        socket.on('send_username', async ({ username }) => {
            var user_id = await helper.getUserId(username)
            var room_ids = await helper.getRoomsForUser(user_id)
            var rooms = room_ids.map((room_id)=> {room_id, helper.getUsersInRoom(room_id)})
            socket.emit('chat_rooms', rooms);

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
            if (invitation.roomID == null){
                var senderUserId = await helper.getUserId(invitation.senderUsername);
                var receiverUserId = await helper.getUserId(invitation.receiverUsername);
                var user_ids = [senderUserId, recieverUserId]
                var roomID = await helper.createChatRoom(user_ids)
                socket.join(roomID);
                io.to(senderSocketId).join(roomID)
            } else {
                await helper.addUserToRoom(user, invite.roomID);
                socket.join(roomID);
            }
            var users = await helper.getUsersInRoom(room_id)
            io.to(roomID).emit('chat_room', { roomID, users });
        });

        socket.on('send_chat_invite', async ({ senderUsername, inviteUsername }) => {
            const invitedSocketId = await helper.getSocketIdByUsername(connectedUsers, inviteUsername);
            console.log("here")
            if (invitedSocketId) {
                console.log(invitedSocketId)
                const inviteID = Date.now().toString(); 
                const invite = { inviteID, senderUsername, inviteUsername, roomID:null };
                roomInvitations.push(invite);
                io.to(invitedSocketId).emit('receive_chat_invite', invite);
            } else {
                console.log(`User ${inviteUsername} not found or not connected.`);
            }
        });

        socket.on('group_chat_invite', ({ roomID, senderUsername, inviteUsername }) => {
            const invitedSocketId = helper.getSocketIdByUsername(connectedUsers, inviteUsername);
            if (invitedSocketId) {
                const inviteID = Date.now().toString(); 
                const invite = { inviteID, senderUsername, inviteUsername, roomID };
                roomInvitations.push(invite);
                io.to(invitedSocketId).emit('receive_chat_invite', invite);
            } else {
                console.log(`User ${inviteUsername} not found or not connected.`);
            }
        });

        socket.on('send_room_message', (message) => {
            //get time stamp
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
            var user_id = chat_route_helper.getUserId(message.username)
            message.timestamp = timestamp
            helper.sendMessageToDatabase(user_id, roomID, message, timestamp)
            var users = helper.getUsersInRoom()
            users.forEach(user => {
                var username = helper.getUsername(userid)
                var socketId = helper.getSocketIdByUsername(username)
                io.to(invitedSocketId).emit('receive_room_message', message);
            })
        });

    });
};

module.exports = { socketHandler: socketHandlers };
