const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const helper = require('../routes/chat_route_helper.js');

const db = dbsingleton;
db.get_db_connection();

// get /isLoggedIn
var is_logged_in = async function(req, res) {
    var username = req.params.username;
    // if (username == null){
    //     return res.status(403).json({ error: 'Not logged in.' });
    //   }
    // if (!helper.isLoggedIn(req,username)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }
    res.status(200).json({ isLoggedIn : true });
};

// post /roomMessages
var chat_room_messages = async function(req, res) {
    console.log(req.body)
    var username = req.params.username;
    var room_id = req.body.room_id


    // //check if chat room exists
    var result = await helper.checkIfChatRoomExists(room_id)
    if (!result){
        return res.status(403).json({ error: 'room does not exist' });
    }
    // //get user id from username
    var user_id = await helper.getUserId(username)
        // //check if user belongs to room
    var result = await helper.checkIfUserBelongsToRoom(room_id,user_id)
    if (!result){
        return  res.status(403).json({ error: 'illegal room access: user not in room' });
        
    }
    var query = `
        SELECT cr.roomID, crm.messageID, crm.message, crm.timestamp, crm.userID
        FROM chatRooms cr
        INNER JOIN chatRoomMessages crm ON cr.roomID = crm.roomID
        WHERE cr.roomID = '${room_id}'
        ORDER BY crm.timestamp ASC`; 
    var result = await db.send_sql(query);
    const userIds = result.map(row => row.userID);
    const usernames = userIds.map(async user_id => {return await helper.getUsername(user_id)})
    const response = result.map((row, index) => ({
        message: row.textMessage,
        timestamp: row.timestamp,
        sender: usernames[index] 
    }));

    return res.status(200).json(result);
    
};

// get /chatRoomsForUser
var chat_rooms_for_user = async function(req, res) {
    // var username = req.params.username;
    // //check if chat room exists
    // helper.checkIfChatRoomExists
    // //get user id from username
    // helper.getUserId
    // //check if user belongs to room
    // helper.getUsersInRoom
    // var room_id = req.params.room_name;
    // var query = `
    //     SELECT cr.roomID, crm.messageID, crm.textMessage, crm.timestamp
    //     FROM chatRooms cr
    //     INNER JOIN chatRoomMessages crm ON cr.roomID = crm.roomID
    //     WHERE cr.roomID = '${room_id}'
    //     ORDER BY crm.timestamp DESC`; 
    // var result = await db.send_sql(query);
    // res.json(result);
};



  
var chatRoutes = { 
    is_logged_in : is_logged_in,
    chat_room_messages : chat_room_messages,
    chat_rooms_for_user : chat_rooms_for_user
};

module.exports = chatRoutes;
