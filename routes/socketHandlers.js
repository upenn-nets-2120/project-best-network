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
            var room_ids = helper.getRoomsForUser(user_id)
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
            connectedUsers = connectedUsers.filter(user => user.socketId !== socket.id); // Remove disconnected user from connectedUsers
            socket.broadcast.emit('user_disconnected', { username: disconnectedUsername });
            console.log(`User with socket ID ${socket.id} disconnected`);
        });

        socket.on('leave_room', async (username) => {
            var user_id = await helper.getUserId(username)
            chat_route_helper.deleteUserFromRoom(user_id)
        });

        socket.on('accept_invite', async ({ invite }) => {
            const invitation = roomInvitations.find(invite => invite.inviteId === inviteId);
            if (invitation) {
                socket.join(invitation.room);
                console.log(`Socket ${socket.id} joined room ${invitation.room}`);
                roomInvitations = roomInvitations.filter(invite => invite.inviteId !== inviteId);
                io.to(invitation.senderId).emit('invite_accepted', invite);
                if (invitation.roomID == null){
                    var senderUserId = await helper.getUserId(invitation.senderUsername);
                    var receiverUserId = await helper.getUserId(invitation.receiverUsername);
                    var user_ids = [senderUserId, recieverUserId]
                    var roomID = await helper.createChatRoom(user_ids)
                    socket.join(roomID);
                    io.to(invitation.senderId).join(roomID)
                } else {
                    await helper.addUserToRoom(user, invite.roomID);
                    socket.join(roomID);
                }
                var users = await helper.getUsersInRoom(room_id)
                io.to(roomID).emit('chat_room', { roomID, users });
            } else {
                console.log('Invite not found.');
            }
        });

        socket.on('send_chat_invite', ({ senderUsername, inviteUsername }) => {
            const invitedSocketId = helper.getSocketIdByUsername(connectedUsers, inviteUsername);
            if (invitedSocketId) {
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

        socket.on('send_room_message', (data) => {
            const {roomID, message } = data;
            var users = helper.getUsersInRoom()
            users.forEach(user => {
                var username = helper.getUsername(userid)
                var socketId = helper.getSocketIdByUsername(username)
                io.to(invitedSocketId).emit('receive_room_message', { message, messageID });
            })
        });

    });
};

module.exports = { socketHandler: socketHandlers };
