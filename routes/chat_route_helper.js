const dbsingleton = require('../models/db_access.js');
const db = dbsingleton;
db.get_db_connection();

const chat_route_helper = () => {
    return {
        createChatRoom: async (obj) => {
            try {
                const users = obj.users;
                // Insert a placeholder room into chatRooms table to generate auto-incremented roomId
                const insertRoomQuery = `
                    INSERT INTO chatRooms DEFAULT VALUES
                `;
                const roomInsertResult = await db.send_sql(insertRoomQuery);
                const roomId = roomInsertResult.insertId;

                // Insert users into chatRoomUsers table
                const insertUsersQuery = `
                    INSERT INTO chatRoomUsers (roomID, userID) 
                    VALUES ${users.map(userId => `(${roomId}, ${userId})`).join(', ')}
                `;
                const usersInsertResult = await db.send_sql(insertUsersQuery);

                // Return the room ID
                return { roomId };
            } catch (error) {
                console.error('Error creating chat room:', error);
                throw error;
            }
        },

        checkIfChatRoomExists: async (obj) => {
            try {
                const query = `
                    SELECT * FROM chatRooms 
                    WHERE roomName = '${obj.roomName}'
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
                const query = `SELECT * FROM users WHERE username = '${username}'`;
                const result = await db.send_sql(query);
                return result;
            } catch (error) {
                console.error('Error getting user ID:', error);
                throw error;
            }
        },
        
        getUsersInRoom: async (roomId) => {
            try {
                const query = `
                    SELECT * FROM chatRoomUsers 
                    WHERE roomID = '${roomId}'
                `;
                const usersInRoom = await db.send_sql(query);
                return usersInRoom;
            } catch (error) {
                console.error('Error getting users in room:', error);
                throw error;
            }
        }
        
    };
};





module.exports = {
    createChatRoom: chat_route_helper().createChatRoom,
    checkIfChatRoomExists: chat_route_helper().checkIfChatRoomExists,
    getUserId: chat_route_helper().getUserId
};

