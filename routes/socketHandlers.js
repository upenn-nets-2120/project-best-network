const dbsingleton = require('../models/db_access.js');
const chat_route_helper = require('../routes/chat_route_helper.js');


const db = dbsingleton;
db.get_db_connection();

let roomInvites = []; // Store room invitations as objects {   inviteID: number; inviteUsername: string; senderUsername: string; room: Room;}
let connectedUsers = []; // Store connected users as objects { socket_id, username }

// Define socket handlers
const socketHandlers = (io) => {
    io.on('connection', (socket) => {

         // Handle new user connection by processing their username
        socket.on('send_username', async ({ username }) => {
            //get user_id from username and rooms user belongs to
            var user_id = await chat_route_helper.getUserId(username)
            var rooms = await chat_route_helper.getRoomsForUser(user_id)
            rooms.forEach(room => {
                socket.join(room.roomID); //have user join socket room channel for notifications
            });
            socket.emit('chat_rooms', rooms); //send rooms to user
            //send connected users to new user via socket
            socket.emit('connected_users', connectedUsers.filter(user =>  user.username != username).map(user => user.username)) 
            //see if username already has socket ie. is reconnecting via new socket
            var existingUser = connectedUsers.find(user => user.username === username);
            //if already and existing user, remove current socket through force disconnect and update connectedUsers
            if (existingUser) {
                if (existingUser.socket_id !== socket.id) {
                    socket.to(existingUser.socket_id).emit('force_disconnect', 'Another session has been started with your username.');
                    console.log(`User ${username} tried to connect again with a new session.`);
                    existingUser.socket_id = socket.id; // Update the socket ID to the new one
                }
            } else {
                //add new user object to connectedUsers
                connectedUsers.push({ socket_id: socket.id, username: username });
                console.log(`User ${username} connected with socket ID ${socket.id}`);
            }
            //send all current users update about new user connection
            socket.broadcast.emit('user_connected', { username });
        });

        //handle user disconnects
        socket.on('disconnect', async () => {
            //get username of user disconnecting and remove from connected users
            var username = await chat_route_helper.getUsernameBySocketId(connectedUsers,socket.id)
            if (username){
                connectedUsers = connectedUsers.filter(user => user.socket_id !== socket.id); 
                //send update to current users that user left
                socket.broadcast.emit('user_disconnected', { username: username });
            }
            console.log(`User ${username} with socket ID ${socket.id} disconnected`);
        });

        //handle user leaves room
        socket.on('leave_room', async ({room, username}) => {
            if (room == undefined){
                return;
            }
            //get user_id and room_id of user leaving room
            var user_id = await chat_route_helper.getUserId(username)
            var room_id = room.roomID
            //delete from database (if room is empty, then room also removed from database)
            await chat_route_helper.deleteUserFromRoom(room_id, user_id)

            //update users in room
            var user_ids = await chat_route_helper.getUsersInRoom(room_id)
            var users =  await  chat_route_helper.getUsernamesFromUserIds(user_ids)
            room.users = users.filter(user => user !== username)
            
            //remove user socket from rooms socket channel
            socket.leave(room_id);
            //update user that leaving room was a success
            io.to(room.roomID).emit('user_left_room', {room, username});
        });

        //handle user accepts invite to room
        socket.on('accept_invite', async ({ invite }) => {
            //get username of sender
            const senderSocketId = await chat_route_helper.getSocketIdByUsername(connectedUsers, invite.senderUsername);
            //get username of reciever ie. user who accepted
            var receiverUserId = await chat_route_helper.getUserId(invite.inviteUsername);
            //if room is null then create new room with sender and reciever. otherwise, add reciever to current room
            if (invite.room == null){
                //get user id of sender
                var senderUserId = await chat_route_helper.getUserId(invite.senderUsername);
                var user_ids = [senderUserId, receiverUserId]
                var room_id = await chat_route_helper.createChatRoom(user_ids) //call chat_route_helper to add new chat room to database
                socket.join(room_id); //have user join socket channel with room id
                //send notification to socket of sender to have them join socket channel
                io.to(senderSocketId).emit('join_room', room_id); //they will recieve this notification on frontend and then send back
            } else {
                var room_id = invite.room.roomID 
                await chat_route_helper.addUserToRoom(room_id, receiverUserId); //add reciever to room database via chat_route_helper
                socket.join(room_id); //have reciever join room
            }
            var user_ids = await chat_route_helper.getUsersInRoom(room_id)
            var users =  await chat_route_helper.getUsernamesFromUserIds(user_ids)
            io.to(room_id).emit('chat_room', { roomID: room_id, users }); //send updated room to users in room
            io.to(senderSocketId).emit('invite_accepted', invite); //tell sender that invite was accepted
        });

        //handle invite declined
        socket.on('decline_invite', async ({ invite }) => {
            const senderSocketId = await chat_route_helper.getSocketIdByUsername(connectedUsers, invite.senderUsername);
            roomInvites = roomInvites.filter(inv => inv.inviteID !== invite.inviteID);
            io.to(senderSocketId).emit('invite_declined', invite);
        });

        //handle when user requests to join_room
        socket.on('join_room', (roomID) => {
            socket.join(roomID);
        });

        //handle user sending invite to another user to join room
        socket.on('send_chat_invite', async ({ senderUsername, inviteUsername }) => {
            console.log(connectedUsers)
            //get the socket_id of person recieving invite
            const invitedSocketId = await chat_route_helper.getSocketIdByUsername(connectedUsers, inviteUsername);
            if (invitedSocketId) {
                const inviteID = Date.now().toString(); //create invite id, to uniquely idenitfy invite
                const invite = { inviteID, senderUsername, inviteUsername, roomID:null };
                roomInvites.push(invite); //add invite to list of invites
                io.to(invitedSocketId).emit('receive_chat_invite', invite);  //send reciever a socket update with invite
            } else {
                console.log(`User ${inviteUsername} not found or not connected.`);
            }
        });

        //handle user sending group chat invite to existing room
        socket.on('send_group_chat_invite', async ({ room, senderUsername, inviteUsername }) => {
            //get the socket_id of person recieving invite
            const invitedSocketId = await chat_route_helper.getSocketIdByUsername(connectedUsers, inviteUsername);
            console.log(invitedSocketId)
            if (invitedSocketId) {
                const inviteID = Date.now().toString(); //create invite id, to uniquely idenitfy invite
                const invite = { inviteID, senderUsername, inviteUsername, room };
                roomInvites.push(invite); //add invite to list of invites
                io.to(invitedSocketId).emit('receive_chat_invite', invite); //send reciever a socket update with invite
            } else {
                console.log(`User ${inviteUsername} not found or not connected.`);
            }
        });

        //handle user sending new message to room
        socket.on('send_room_message',async  ({room, message, senderUsername}) => {
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); //generate timestamp for message
            var user_id = await chat_route_helper.getUserId(senderUsername)
            await chat_route_helper.sendMessageToDatabase(user_id, room.roomID, message, timestamp) //send message to database
            io.to(room.roomID).emit('receive_room_message', {roomID:room.roomID, sender: senderUsername, timestamp: timestamp, message: message });
        });

        //handle when user gets messages already sent in room
        socket.on('get_room_messages',async  ({room}) => {
            var room_id = room.roomID
            var result = await chat_route_helper.checkIfChatRoomExists(room_id) //check if room exists
            var username= await chat_route_helper.getUsernameBySocketId(connectedUsers,socket.id) //get username of socket that wants messages
            var user_id = await chat_route_helper.getUserId(username) //get user id of socket that wants messages
            var response = await chat_route_helper.getRoomMessages(room_id,user_id) //use helper to get messages in room, helper checks if user_id belongs to room
            socket.emit('receive_room_messages',{messages: response}) //send message notification to all users in room
        });

    });
};

module.exports = { socketHandler: socketHandlers };
