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
            rooms.forEach(room => {
                socket.join(room.roomID);
            });
            socket.emit('chat_rooms', rooms);
            socket.emit('connected_users', connectedUsers.filter(user =>  user.username != username).map(user => user.username))
            var existingUser = connectedUsers.find(user => user.username === username);
            if (existingUser) {
                if (existingUser.socketId !== socket.id) {
                    // Emit an event to the old socket to force it to disconnect
                    socket.to(existingUser.socket_id).emit('force_disconnect', 'Another session has been started with your username.');
                    console.log(`User ${username} tried to connect again with a new session.`);
                    existingUser.socket_id = socket.id; // Update the socket ID to the new one
                }
            } else {
                connectedUsers.push({ socket_id: socket.id, username: username });
                console.log(`User ${username} connected with socket ID ${socket.id}`);
            }
            socket.broadcast.emit('user_connected', { username });

        });

        socket.on('disconnect', async () => {
            var username = await helper.getUsernameBySocketId(connectedUsers,socket.id)
            if (username){
                connectedUsers = connectedUsers.filter(user => user.socket_id !== socket.id); 
                socket.broadcast.emit('user_disconnected', { username: username });
            }
            console.log(`User ${username} with socket ID ${socket.id} disconnected`);
        });

        socket.on('leave_room', async ({room, username}) => {
            if (room == undefined){
                return;
            }
            var user_id = await helper.getUserId(username)
            var room_id = room.roomID
            await chat_route_helper.deleteUserFromRoom(room_id, user_id)

            //update users in room
            var user_ids = await chat_route_helper.getUsersInRoom(room_id)
            var users =  await  chat_route_helper.getUsernamesFromUserIds(user_ids)
            room.users = users.filter(user => user !== username)

            socket.leave(room_id);
            io.to(room.roomID).emit('user_left_room', {room, username});
        });

        socket.on('accept_invite', async ({ invite }) => {
            const senderSocketId = await helper.getSocketIdByUsername(connectedUsers, invite.senderUsername);
            var receiverUserId = await helper.getUserId(invite.inviteUsername);
            if (invite.room == null){
                var senderUserId = await helper.getUserId(invite.senderUsername);
                var user_ids = [senderUserId, receiverUserId]
                console.log(user_ids)
                var room_id = await helper.createChatRoom(user_ids)
                socket.join(room_id);
                io.to(senderSocketId).emit('join_room', room_id);
            } else {
                var room_id = invite.room.roomID
                await helper.addUserToRoom(room_id, receiverUserId);
                socket.join(room_id);
            }
            var user_ids = await helper.getUsersInRoom(room_id)
            var users =  await helper.getUsernamesFromUserIds(user_ids)
            io.to(room_id).emit('chat_room', { roomID: room_id, users });
            io.to(senderSocketId).emit('invite_accepted', invite);
        });

        socket.on('decline_invite', async ({ invite }) => {
            const senderSocketId = await helper.getSocketIdByUsername(connectedUsers, invite.senderUsername);
            io.to(senderSocketId).emit('invite_declined', invite);
        });

        socket.on('join_room', (roomID) => {
            socket.join(roomID);
        });

        socket.on('send_chat_invite', async ({ senderUsername, inviteUsername }) => {
            console.log(connectedUsers)
            const invitedSocketId = await helper.getSocketIdByUsername(connectedUsers, inviteUsername);
            if (invitedSocketId) {
                const inviteID = Date.now().toString(); 
                const invite = { inviteID, senderUsername, inviteUsername, roomID:null };
                roomInvites.push(invite);
                io.to(invitedSocketId).emit('receive_chat_invite', invite);
            } else {
                console.log(`User ${inviteUsername} not found or not connected.`);
            }
        });

        socket.on('send_group_chat_invite', async ({ room, senderUsername, inviteUsername }) => {
            const invitedSocketId = await helper.getSocketIdByUsername(connectedUsers, inviteUsername);
            console.log(invitedSocketId)
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
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
            var user_id = await chat_route_helper.getUserId(senderUsername)
            await helper.sendMessageToDatabase(user_id, room.roomID, message, timestamp)
            var users = await helper.getUsersInRoom(room.roomID)
            io.to(room.roomID).emit('receive_room_message', {roomID:room.roomID, sender: senderUsername, timestamp: timestamp, message: message });
        });


        socket.on('get_room_messages',async  ({room}) => {
            var room_id = room.roomID
            var result = await chat_route_helper.checkIfChatRoomExists(room_id)
            var username= await chat_route_helper.getUsernameBySocketId(connectedUsers,socket.id)
            var user_id = await chat_route_helper.getUserId(username)
            var result = await chat_route_helper.checkIfUserBelongsToRoom(room_id,user_id)
            var query = `
                SELECT cr.roomID, crm.messageID, crm.message, crm.timestamp, crm.userID
                FROM chatRooms cr
                INNER JOIN chatRoomMessages crm ON cr.roomID = crm.roomID
                WHERE cr.roomID = '${room_id}'
                ORDER BY crm.timestamp ASC`; 
            var result = await db.send_sql(query);
            const userIds = result.map(row => row.userID);
            const usernames = await chat_route_helper.getUsernamesFromUserIds(userIds)
            const response = result.map((row, index) => ({
                message: row.message,
                timestamp: row.timestamp,
                sender: usernames[index],
                roomID: room_id
            }));
            socket.emit('receive_room_messages',{messages: response})
        });

    });
};

module.exports = { socketHandler: socketHandlers };
