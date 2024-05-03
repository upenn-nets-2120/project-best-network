const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('./login_route_helper.js');
const process = require('process');
const s3Access = require('../models/s3_access.js'); 

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
// var username = req.params.username;
// if (username == null){
//   return res.status(403).json({ error: 'Not logged in.' });
// }
// if (!helper.isLoggedIn(req,username)) {
//     return res.status(403).json({ error: 'Not logged in.' });
// }
// var query = "SELECT * FROM users WHERE username = '" + username + "'";
// try {
//     var result = await db.send_sql(query);
//     return result
// } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Error querying database.' });
// }
var link = "https://images.moviesanywhere.com/24b204384e43573f3d961c340d33108f/b90afbd0-c8d0-4fe4-9752-a51489480a05.jpg"
res.status(200).json({email:"jsusser@julia.com", username:"julia", hashtags:["#heyjulia", "#juliacodes"], actor:"Awesome Julia", profilePhoto:link})
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
