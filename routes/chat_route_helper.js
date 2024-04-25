const dbsingleton = require('../models/db_access.js');
const db = dbsingleton;
db.get_db_connection();

const chat_route_helper = () => {
    return {
        createChatRoom: async (user_ids) => {
            try {
                // Insert a placeholder room into chatRooms table to generate auto-incremented roomId
                const insertRoomQuery = `
                    INSERT INTO chatRooms DEFAULT VALUES
                `;
                const roomInsertResult = await db.send_sql(insertRoomQuery);
                const roomId = roomInsertResult.insertId;

                // Insert users into chatRoomUsers table
                const insertUsersQuery = `
                    INSERT INTO chatRoomUsers (roomID, userID) 
                    VALUES ${user_ids.map(userId => `(${roomId}, ${userId})`).join(', ')}
                `;
                const usersInsertResult = await db.send_sql(insertUsersQuery);

                // Return the room ID
                return { roomId };
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
                const query = `SELECT id FROM users WHERE username = '${username}'`;
                const result = await db.send_sql(query);
                return result;
            } catch (error) {
                console.error('Error getting user ID:', error);
                throw error;
            }
        },

        getUsername: async (userid) => {
            try {
                const query = `SELECT username FROM users WHERE id = '${userid}'`;
                const result = await db.send_sql(query);
                return result;
            } catch (error) {
                console.error('Error getting user ID:', error);
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

        checkIfUserBelongsToRoom: async(room_id, usr_id) => {
            try {
                const usersInRoom = await getUsersInRoom(room_id);
                return usersInRoom.includes(user_id);
            } catch (error) {
                console.error('Error checking if user belongs to room:', error);
                throw error;
            }
        },

        getRoomsForUser: async (user_id) => {
            try {
                const query = `
                    SELECT DISTINCT roomID FROM chatRoomUsers
                    WHERE userID = '${user_id}'
                `;
                const roomsForUser = await db.send_sql(query);
                return roomsForUser.map(row => row.roomID);
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

        deleteUserFromRoom: async (userid) => {
            try {
                const deleteQuery = `
                    DELETE FROM chatRoomUsers
                    WHERE roomID = ${roomId} AND userID = ${userId}
                `;
                const deleteResult = await db.send_sql(deleteQuery);
                console.log(`User with ID ${userId} deleted from room ${roomId}`);
                const checkEmptyQuery = `
            SELECT COUNT(*) AS userCount FROM chatRoomUsers
            WHERE roomID = ${roomId}
        `;
            const { userCount } = await db.send_sql(checkEmptyQuery);
            if (userCount === 0) {
                const deleteRoomQuery = `
                    DELETE FROM chatRooms
                    WHERE roomID = ${roomId}
                `;
                await db.send_sql(deleteRoomQuery);
                console.log(`Room ${roomId} deleted as it became empty.`);
            }

                return deleteResult;
            } catch (error) {
                console.error('Error deleting user from room:', error);
                throw error;
            }
        },

        adUserToRoom: async (userid) => {
            try {
                const insertQuery = `
                    INSERT INTO chatRoomUsers (roomID, userID) 
                    VALUES (${roomId}, ${userId})
                `;
                const insertResult = await db.send_sql(insertQuery);
                console.log(`User with ID ${userId} added to room ${roomId}`);
                return insertResult;
            } catch (error) {
                console.error('Error adding user to room:', error);
                throw error;
            }
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
    getUsersInRoom : chat_route_helper().getUsersInRoom,
    getSocketIdByUsername: chat_route_helper().getSocketIdByUsername,
    deleteUserFromRoom: chat_route_helper().deleteUserFromRoom
};

