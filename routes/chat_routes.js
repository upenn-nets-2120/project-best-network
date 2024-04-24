const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('../routes/login_route_helper.js');
const process = require('process');

// get /isLoggedIn
var is_logged_in = async function(req, res) {
    var username = req.params.username;
    // if (username == null){
    //     return res.status(403).json({ error: 'Not logged in.' });
    //   }
    // if (!helper.isLoggedIn(req,username)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }
    res.status(200).json({ isloggedIn : true });
};

// get /roomMessages
var room_messages = async function(req, res) {
    var room = req.params.room;
    var room_name = req.params.room_name;
    var query = `
        SELECT cr.roomName, cr.roomID, crm.messageID, crm.textMessage, crm.timestamp
        FROM chatRooms cr
        INNER JOIN chatRoomMessages crm ON cr.roomID = crm.roomID
        WHERE cr.roomName = '${room_name}'
        ORDER BY crm.timestamp DESC`; 
    var result = await db.send_sql(query);
    res.json(result);
};

  
var chatRoutes = { 
    is_logged_in : is_logged_in,
    room_messages : room_messages
};

module.exports = chatRoutes;
