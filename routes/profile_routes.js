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
    console.log(username);
    if (username == null){
        return res.status(403).json({ error: 'Not logged in.' });
    }
    try {
        var query = `SELECT * FROM users WHERE username = '${username}'`;

        var result = await db.send_sql(query);
        if (result.length < 1) {
            return res.status(409).json({ error: 'Account not found' });
        }
        var info = result[0];
        console.log(info);

        var hashtagQuery = `SELECT hashtags.text 
            FROM users
            JOIN hashtagInterests ON users.id = hashtagInterests.userID
            JOIN hashtags ON hashtagInterests.hashtagID = hashtags.id
            WHERE users.id = '${req.session.user_id}'`

        var hashtags = await db.send_sql(hashtagQuery);
        var hashtagsTextList = hashtags.map(hashtag => hashtag.text);
        console.log(hashtagsTextList);

        return res.status(200).json({email : info.email, username: info.username, hashtags: hashtagsTextList, actor:"Awesome Julia", profilePhoto:info.profilePhoto});

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
    const { hashtag } = req.body
    const userID = req.session.user_id;
    console.log(userID);
    console.log(username);

    var hashtagQuery = `SELECT hashtags.text 
            FROM users
            JOIN hashtagInterests ON users.id = hashtagInterests.userID
            JOIN hashtags ON hashtagInterests.hashtagID = hashtags.id
            WHERE users.id = '${userID}'`

    var hashtags = await db.send_sql(hashtagQuery);
    var hashtagsTextList = hashtags.map(hashtag => hashtag.text);

    if (hashtagsTextList.includes(hashtag)) {
        return res.status(400).send("You already follow this hashtag");
    }

    var hashtagExistsQuery = `SELECT * FROM hashtags WHERE text = '${hashtag}'`;
    var hashtagData = await db.send_sql(hashtagExistsQuery);

    if(hashtagData.length > 0) {
        // If hashtag exists in the database -> get ID, increment count
        hashtagID = hashtagData[0].id;
        const incrementQuery = `UPDATE hashtags SET count = count + 1 WHERE text = '${hashtag}'`;
        await db.send_sql(incrementQuery);

        //Dealing with hashtag interests database -> insert hashtag into that database w/ corresponding userID and hashtagID
        var interestQuery = `INSERT INTO hashtagInterests (hashtagID, userID) 
        VALUES ('${hashtagID}', '${userID}')`;

        await db.send_sql(interestQuery);


    } else {
        // Otherwise insert into database -> get ID, increment count (set to 1 since this is first instance of the hashtag)
        var insertQuery = `INSERT INTO hashtags (text, count) 
        VALUES ('${hashtag}', '1')`;
        console.log(insertQuery);
        await db.send_sql(insertQuery);
        
        //getting ID
        var idQuery = `SELECT * FROM hashtags WHERE text = '${hashtag}'`;
        console.log(idQuery);
        var hashtagData = await db.send_sql(idQuery);
        console.log(hashtagData);

        hashtagID = hashtagData[0].id;
        console.log(hashtagID);

        //Dealing with hashtag interests database -> insert hashtag into that database w/ corresponding userID and hashtagID
        var interestQuery = `INSERT INTO hashtagInterests (hashtagID, userID) 
        VALUES ('${hashtagID}', '${userID}')`;
        console.log(interestQuery);

        await db.send_sql(interestQuery);
    }


    res.status(200).json({hashtag: hashtag})
}


var post_remove_hashtag = async function(req, res) {

    const { hashtag } = req.body
    const userID = req.session.user_id;

    var hashtagQuery = `SELECT hashtags.text 
            FROM users
            JOIN hashtagInterests ON users.id = hashtagInterests.userID
            JOIN hashtags ON hashtagInterests.hashtagID = hashtags.id
            WHERE users.id = '${userID}'`

    var hashtags = await db.send_sql(hashtagQuery);
    var hashtagsTextList = hashtags.map(hashtag => hashtag.text);

    if (!hashtagsTextList.includes(hashtag)) {
        return res.status(400).send("You don't follow this hashtag");
    }

    //getting data for hashtag
    var idQuery = `SELECT * FROM hashtags WHERE text = '${hashtag}'`;
    console.log(idQuery);
    var hashtagData = await db.send_sql(idQuery);
    console.log(hashtagData);
    hashtagID = hashtagData[0].id;
    count = hashtagData[0].count;

    var deleteInterestQuery = `DELETE FROM hashtagInterests WHERE hashtagID = '${hashtagID}' AND userID = '${userID}'`;
    await db.send_sql(deleteInterestQuery);

    if(count == 1) {
        var deleteHashtagQuery = `DELETE FROM hashtags WHERE text = '${hashtag}'`;
        await db.send_sql(deleteHashtagQuery);
    } else {
        var decrementQuery = `UPDATE hashtags SET count = count - 1 WHERE text = '${hashtag}'`;
        await db.send_sql(decrementQuery);
    }

    res.status(200).json({hashtag: hashtag})
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
