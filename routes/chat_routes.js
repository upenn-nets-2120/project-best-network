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






  
var chatRoutes = { 
    is_logged_in : is_logged_in
};

module.exports = chatRoutes;
