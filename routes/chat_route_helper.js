const dbsingleton = require('../models/db_access.js');
const db = dbsingleton;
db.get_db_connection();

const chat_route_helper = () => {
    return {
        createChatRoom: async (user_ids) => {
            try {
                // Insert a placeholder room into chatRooms table to generate auto-incremented roomId
                const insertRoomQuery = `INSERT INTO chatRooms (roomID) VALUES (DEFAULT)`;
                const roomInsertResult = await db.send_sql(insertRoomQuery);
                
                // Now, retrieve the last inserted ID
                const lastInsertIdQuery = `SELECT LAST_INSERT_ID() AS roomID`;
                const lastInsertIdResult = await db.send_sql(lastInsertIdQuery);
                
                const room_id = lastInsertIdResult[0].roomID;
                console.log(room_id);                

                // Insert users into chatRoomUsers table
                const insertUsersQuery = `
                    INSERT INTO chatRoomUsers (roomID, userID) 
                    VALUES ${user_ids.map(user_id => `(${room_id}, ${user_id})`).join(', ')}
                `;
                const usersInsertResult = await db.send_sql(insertUsersQuery);

                // Return the room ID
                return room_id;
            } catch (error) {
                console.error('Error creating chat room:', error);
                throw error;
            }
        },

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
        
        getUserId: async (username) => {
            try {
                console.log(username)
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

        checkIfUserBelongsToRoom: async(room_id, user_id) => {
            try {
                const usersInRoom = await chat_route_helper().getUsersInRoom(room_id);
                return usersInRoom.includes(user_id);
            } catch (error) {
                console.error('Error checking if user belongs to room:', error);
                throw error;
            }
        },

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
            const rooms = roomsForUser.map(room => ({
                roomID: room.roomID,
                users: room.other_users.split(', ')
            }));
            console.log(rooms)
            return rooms;

            } catch (error) {
                console.error('Error getting rooms for user:', error);
                throw error;
            }
        },

        getSocketIdByUsername: async (connectedUsers, username) => {
            try {
                const user = connectedUsers.find(user => user.username === username);
                return user ? user.socketId : null;
            } catch (error) {
                console.error('Error finding socket ID by username:', error);
                throw error;
            }
        },
        getUsernameBySocketId: async (connectedUsers, socket_id) => {
            try {
                var user = connectedUsers.find(user => user.socket_id === socket_id);
                console.log(user)
                return user ? user.username : null;
            } catch (error) {
                console.error('Error finding username by socketID:', error);
                throw error;
            }
        },

        
        deleteUserFromRoom: async (room_id, user_id) => {
            try {
                const deleteQuery = `
                    DELETE FROM chatRoomUsers
                    WHERE roomID = ${room_id} AND userID = ${user_id}
                `;
                const deleteResult = await db.send_sql(deleteQuery);
                console.log(deleteResult)
                console.log(`User with ID ${user_id} deleted from room ${room_id}`);
                const checkEmptyQuery = `
                SELECT COUNT(*) AS userCount FROM chatRoomUsers
                WHERE roomID = ${room_id}
                `;
                const { userCount } = await db.send_sql(checkEmptyQuery);
                if (userCount === 0) {
                    const deleteRoomQuery = `
                        DELETE FROM chatRooms
                        WHERE roomID = ${room_id}
                    `;
                    await db.send_sql(deleteRoomQuery);
                    console.log(`Room ${room_id} deleted as it became empty.`);
                }
                return deleteResult;
            } catch (error) {
                console.error('Error deleting user from room:', error);
                throw error;
            }
        },

        addUserToRoom: async (room_id, user_id) => {
            try {
                const insertQuery = `
                    INSERT INTO chatRoomUsers (roomID, userID) 
                    VALUES (${room_id}, ${user_id})
                `;
                const insertResult = await db.send_sql(insertQuery);
                console.log(`User with ID ${user_id} added to room ${room_id}`);
                return insertResult;
            } catch (error) {
                console.error('Error adding user to room:', error);
            }
        },
        sendMessageToDatabase: async (user_id, room_id, message, timestamp) => {
            try {
                const insertQuery = `
                    INSERT INTO chatRoomMessages (roomID, message, userID, timestamp)
                    VALUES (${room_id}, '${message}', ${user_id}, '${timestamp}')
                `;
                const insertResult = await db.send_sql(insertQuery);
                console.log(`Message added to room ${room_id} by user with ID ${user_id}`);
                return insertResult;
            } catch (error) {
                console.error('Error adding message to room:', error);
                throw error;
            }
        },
        
        
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
    sendMessageToDatabase: chat_route_helper().sendMessageToDatabase
};

