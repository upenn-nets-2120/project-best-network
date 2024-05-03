const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('./login_route_helper.js');
const process = require('process');
const s3Access = require('../models/s3_access.js'); 


// Database connection setup
const db = dbsingleton;
db.get_db_connection();
const PORT = config.serverPort;

// /setProfileHashTags
var set_profile_hashtags = async function(req, res) {
    var username = req.params.username;
    if (username == null){
      return res.status(403).json({ error: 'Not logged in.' });
    }
    if (!helper.isLoggedIn(req,username)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    //if hashtag is new then add to database of hashtags,
    //otherwise increment the hashtag data base count 
    //then update user database with user's new hashtags
  
    
  };
  
  

  
// GET /getProfile
var get_profile = async function(req, res) {
    var username = req.session.username;
    if (username == null){
        return res.status(403).json({ error: 'Not logged in.' });
    }
    var query = `SELECT * FROM users WHERE username = '${username}'`;
    try {
        var result = await db.send_sql(query);
        if (result.length < 1) {
            return res.status(409).json({ error: 'Account not found' });
        }
        var info = result[0];
        console.log(info);
        return res.status(200).json({email : info.email, username: info.username, hashtags:["#heyjulia", "#juliacodes"], actor:"Awesome Julia", profilePhoto:info.profilePhoto});

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

};



var get_most_similar_actors = async function(req, res) {
res.status(200).json({actors:["julia", "julia susser", "julia is the best"]})
}

var post_actor = async function(req, res) {
res.status(200).json({})
}

var get_recommended_hashtags = async function(req, res) {

//if hashtag is new then add to database of hashtags,
//otherwise increment the hashtag data base count 
//then update user database with user's new hashtags
res.status(200).json({hashtags:["#juliaslays", "#jsusser", "#juliarules"]})


}


var post_add_hashtag = async function(req, res) {
res.status(200).json({})
}


var post_remove_hashtag = async function(req, res) {
res.status(200).json({})
}

var routes = {
    get_most_similar_actors: get_most_similar_actors,
    get_recommended_hashtags: get_recommended_hashtags,
    post_add_hashtag: post_add_hashtag,
    post_remove_hashtag: post_remove_hashtag,
    post_actor: post_actor,
    get_profile: get_profile
}

module.exports = routes;
