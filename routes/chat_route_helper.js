const dbsingleton = require('../models/db_access.js');
const db = dbsingleton;
db.get_db_connection();

const chat_route_helper = () => {
    return {
        //check if chat room exists in database
        //returns true or false
        checkIfChatRoomExists: async (room_id) => {
            try {
                const query = `
                    SELECT * FROM chatRooms 
                    WHERE roomID = '${room_id}'
                `;
                const existingRooms = await db.send_sql(query);
                return existingRooms.length > 0; // Returns true if room exists, false otherwise
            } catch (error) {
                console.error('Error checking room:', error);
                throw error;
            }
        },
        
        //get user_id by username from users database
        //returns user_id associated with username
        getUserId: async (username) => {
            try {
                const query = `SELECT id FROM users WHERE username = '${username}'`;
                const result = await db.send_sql(query);
                if (result.length > 0) {
                    return result[0].id;
                } else {
                    return null; //id not found
                }
            } catch (error) {
                console.error('Error getting user ID:', error);
                throw error;
            }
        },

        //get username by user_id from users database
        //returns username associated with username
        getUsername: async (userid) => {
            try {
                const query = `SELECT username FROM users WHERE id = '${userid}'`;
                const result = await db.send_sql(query);
                if (result.length > 0) {
                    return result[0].username;
                } else {
                    return null; //username not found
                }
            } catch (error) {
                console.error('Error getting user ID:', error);
                throw error;
            }
        },

        //get multiple usernames from a list of user_ids
        //returns list of usernames
        getUsernamesFromUserIds: async (user_ids) => {
            try {
                const usernamePromises = user_ids.map(userid => chat_route_helper().getUsername(userid));
                const usernames = await Promise.all(usernamePromises);
                return usernames;
            } catch (error) {
                console.error('Error getting usernames from user IDs:', error);
                throw error;
            }
        },

        //get socket_id of username from inputted list of connected users [{username:username1, socket_id:x}]
        //returns socket_id
        getSocketIdByUsername: async (connectedUsers, username) => {
            try {
                const user = connectedUsers.find(user => user.username === username);
                return user ? user.socket_id : null;
            } catch (error) {
                console.error('Error finding socket ID by username:', error);
                throw error;
            }
        },

        //get username of socket_id from inputted list of connected users [{username:username1, socket_id:x}]
        //returns username
        getUsernameBySocketId: async (connectedUsers, socket_id) => {
            try {
                var user = connectedUsers.find(user => user.socket_id === socket_id);
                return user ? user.username : null;
            } catch (error) {
                console.error('Error finding username by socketID:', error);
                throw error;
            }
        },


        //create a new chat room in database for a list of user_ids
        //return room_id associated with new room
        createChatRoom: async (user_ids) => {
            try {
                //insert new room into chatRooms, auto_increments id
                const insertRoomQuery = `INSERT INTO chatRooms (roomID) VALUES (DEFAULT)`;
                const roomInsertResult = await db.send_sql(insertRoomQuery);
                const lastInsertIdQuery = `SELECT LAST_INSERT_ID() AS roomID`; //get room_id last room inputted into database
                const lastInsertIdResult = await db.send_sql(lastInsertIdQuery);
                const room_id = lastInsertIdResult[0].roomID;                

                // Insert user_ids and room_id into chatRoomUsers table
                const insertUsersQuery = `
                    INSERT INTO chatRoomUsers (roomID, userID) 
                    VALUES ${user_ids.map(user_id => `(${room_id}, ${user_id})`).join(', ')}
                `;
                const usersInsertResult = await db.send_sql(insertUsersQuery);

                return room_id;
            } catch (error) {
                console.error('Error creating chat room:', error);
                throw error;
            }
        },

        //get users in room by room id through query chatRoomUsers database
        //returns user_ids of users in room
        getUsersInRoom: async (room_id) => {
            try {
                const query = `
                    SELECT userID FROM chatRoomUsers 
                    WHERE roomID = '${room_id}'
                `;
                const usersInRoomResult = await db.send_sql(query);
                const usersInRoom = usersInRoomResult.map(row => row.userID);
                return usersInRoom;
            } catch (error) {
                console.error('Error getting users in room:', error);
                throw error;
            }
        },

        //check if user_id belongs to room_id by query chatRoomUsers database
        //return true or false 
        checkIfUserBelongsToRoom: async(room_id, user_id) => {
            try {
                const usersInRoom = await chat_route_helper().getUsersInRoom(room_id);
                return usersInRoom.includes(user_id);
            } catch (error) {
                console.error('Error checking if user belongs to room:', error);
            }
        },

        //get an array of rooms that user_id belongs to by querying chatRoomUsers and users (for usernames) tables that is sent to front end upon connection
        //returns a list of objects {roomID:x, users:[username1, username2,...]}
        getRoomsForUser: async (user_id) => {
            try {
                const query = `
                SELECT DISTINCT cru.roomID, GROUP_CONCAT(u.username SEPARATOR ', ') AS other_users
                FROM chatRoomUsers cru
                INNER JOIN users u ON cru.userID = u.id
                WHERE cru.roomID IN (
                    SELECT DISTINCT roomID
                    FROM chatRoomUsers
                    WHERE userID = '${user_id}'
                )
                GROUP BY cru.roomID;
            `;
            const roomsForUser = await db.send_sql(query);
             //username of sender user_id is included in users to ensure standardization of room data on frontend
            const rooms = roomsForUser.map(room => ({
                roomID: room.roomID,
                users: room.other_users.split(', ')
            }));
            return rooms;

            } catch (error) {
                console.error('Error getting rooms for user:', error);
                throw error;
            }
        },


        
        //delete user from room by deleting row with user_id and room_id from chatRoomUsers
        //if room is empty after deleting user, then remove room from chatRooms table
        //return if success
        deleteUserFromRoom: async (room_id, user_id) => {
            try {
                const deleteQuery = `
                    DELETE FROM chatRoomUsers
                    WHERE roomID = ${room_id} AND userID = ${user_id}
                `;
                const deleteResult = await db.send_sql(deleteQuery);
                const checkEmptyQuery = `
                SELECT COUNT(*) AS userCount FROM chatRoomUsers
                WHERE roomID = ${room_id}
                `;
                var result = await db.send_sql(checkEmptyQuery);
                if (result[0].userCount === 0) {
                    const deleteRoomQuery = `
                        DELETE FROM chatRooms
                        WHERE roomID = ${room_id}
                    `;
                    await db.send_sql(deleteRoomQuery);
                }
                return true
            } catch (error) {
                console.error('Error deleting user from room:', error);
            }
        },

        //add user_id to room via room_id when invited via group chat invite by adding row to userChatRooms
        //return success
        addUserToRoom: async (room_id, user_id) => {
            try {
                const insertQuery = `
                    INSERT INTO chatRoomUsers (roomID, userID) 
                    VALUES (${room_id}, ${user_id})
                `;
                const insertResult = await db.send_sql(insertQuery);
                return true
            } catch (error) {
                console.error('Error adding user to room:', error);
            }
        },
        //add message {user_id, room_id, message, timestamp} to chatRoomMessages tabled
        //return success
        sendMessageToDatabase: async (user_id, room_id, message, timestamp) => {
            try {
                const insertQuery = `
                    INSERT INTO chatRoomMessages (roomID, message, userID, timestamp)
                    VALUES (${room_id}, '${message}', ${user_id}, '${timestamp}')
                `;
                const insertResult = await db.send_sql(insertQuery);
                return true
            } catch (error) {
                console.error('Error adding message to room:', error);
            }
        },
        //get a list of messages for a user_id for room via room_id by query chatRoomMessages
        //return list of messages
        getRoomMessages: async (room_id )=> {
            var query = `
                SELECT cr.roomID, crm.messageID, crm.message, crm.timestamp, crm.userID
                FROM chatRooms cr
                INNER JOIN chatRoomMessages crm ON cr.roomID = crm.roomID
                WHERE cr.roomID = '${room_id}'
                ORDER BY crm.timestamp ASC`; 
            var result = await db.send_sql(query);
            const userIds = result.map(row => row.userID);
            //convert user_ids into usernames to send to frontend
            const usernames = await chat_route_helper().getUsernamesFromUserIds(userIds)
            const response = result.map((row, index) => ({
                message: row.message,
                timestamp: row.timestamp,
                sender: usernames[index],
                roomID: room_id
            }));
            return response
        }
        
        
    };
};





module.exports = {
    createChatRoom: chat_route_helper().createChatRoom,
    checkIfChatRoomExists: chat_route_helper().checkIfChatRoomExists,
    checkIfUserBelongsToRoom: chat_route_helper().checkIfUserBelongsToRoom,
    getRoomsForUser: chat_route_helper().getRoomsForUser,
    
    getUserId: chat_route_helper().getUserId,
    getUsername: chat_route_helper().getUsername,
    getUsernamesFromUserIds: chat_route_helper().getUsernamesFromUserIds,

    getUsersInRoom : chat_route_helper().getUsersInRoom,


    getSocketIdByUsername: chat_route_helper().getSocketIdByUsername,
    getUsernameBySocketId: chat_route_helper().getUsernameBySocketId,

    deleteUserFromRoom: chat_route_helper().deleteUserFromRoom,
    addUserToRoom: chat_route_helper().addUserToRoom,
    sendMessageToDatabase: chat_route_helper().sendMessageToDatabase,
    getRoomMessages: chat_route_helper().getRoomMessages
};

