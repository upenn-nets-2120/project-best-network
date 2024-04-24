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

//vectorStore = await helper.getVectorStore(null);

var getHelloWorld = function(req, res) {
    res.status(200).send({message: "Hello, world!"});
}


// POST /register 
/*  Example body: 
    {
      "username": "vavali",
      "password": "1234",
      "firstName": "Vedha",
      "lastName": "Avali",
      "email": "vedha.avali@gmail.com",
      "birthday": "2004-08-08",
      "affiliation": "Penn",
      "profilePhoto": profile.jpg, -> should be provided as an image file to upload to S3 can be null
      "hashtagInterests": ["hello", "bye"] -> this should be in list format, can be null
    }

*/
var postRegister = async function(req, res) {
  const { username, password, firstName, lastName, email, birthday, affiliation, profilePhoto, hashtagInterests } = req.body;

  if (!username || !password || !firstName || !lastName || !email || !birthday || !affiliation) {
    return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
  }

  try {
    // Hash the password
    var hashed_password = await new Promise((resolve, reject) => {
      helper.encryptPassword(password, (err, hash) => {
        if (err) {
          console.error(err);
          reject(err);  
        } else {
          resolve(hash);  
        }
      });
    });

    // Check if the username already exists
    var query = `SELECT * FROM users WHERE username = '${username}'`;
    var result = await db.send_sql(query);
    if (result.length > 0) {
      return res.status(409).json({ error: 'An account with this username already exists, please try again.' });
    }

    // Insert the new user into the database
    var insertQuery = `
      INSERT INTO users (username, hashed_password, firstName, lastName, email, birthday, affiliation) 
      VALUES ('${username}', '${hashed_password}', '${firstName}', '${lastName}', '${email}', '${birthday}', '${affiliation}')
    `;
    await db.send_sql(insertQuery);

    //Retrieve userID from databse for purposes of inserting hashtags/images
    const userIDQuery = `SELECT id FROM users WHERE username = '${username}'`;
    const [userIDQueryResult] = await db.send_sql(userIDQuery);
    const userID = userIDQueryResult.id;


    if (hashtagInterests){
      var hashtagID = ""

      if (Array.isArray(hashtagInterests) && hashtagInterests.length > 0) {
        for (let i = 0; i < hashtagInterests.length; i++) {
          var hashtag = hashtagInterests[i];

          // Dealing with the hashtag database
          var hashtagExistsQuery = `SELECT * FROM hashtags WHERE text = '${hashtag}'`;
          var hashtagData = await db.send_sql(hashtagExistsQuery);

          if(hashtagData.length > 0) {
          // If hashtag exists in the database -> get ID, increment count
            hashtagID = hashtagData.id;
            const incrementQuery = `UPDATE hashtags SET count = count + 1 WHERE text = ${hashtag}`;
            await db.send_sql(incrementQuery);


          } else {
          // Otherwise insert into database -> get ID, increment count (set to 1 since this is first instance of the hashtag)
            var insertQuery = `INSERT INTO hashtags (text, count) 
            VALUES ('${hashtag}', '1')`;

            await db.send_sql(insertQuery);
            
            //getting ID
            var idQuery = `SELECT * FROM hashtags WHERE text = '${hashtag}'`;
            var hashtagData = await db.send_sql(idQuery);
            hashtagID = hashtagData.id;
          }
          //Dealing with hashtag interests database -> insert hashtag into that database w/ corresponding userID and hashtagID
          var interestQuery = `INSERT INTO hashtags (hashtagID, userID) 
          VALUES ('${hashtagID}', '${userID}')`;
        }

      }
    }
    if (profilePhoto){
      //TODO: set profile photo
      //https://github.com/upenn-nets-2120/homework-2-ms1-vavali08/blob/main/src/main/java/org/nets2120/imdbIndexer/S3Setup.java Reference - Note that this is Java
      await s3Access.put_by_key("best-network-nets212-sp24", userID, profilePhoto, 'image/*');
      
    }

    return res.status(200).json({ username: username });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error querying database.' });
  }
};




// POST /login
var postLogin = async function(req, res) {
  // TODO: check username and password and login
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
  }
  var query = `SELECT hashed_password FROM users WHERE username = '${username}'`;
  try {
      var result = await db.send_sql(query);

      if (result.length == 0) {
          return res.status(401).json({ error: 'Username and/or password are invalid.' });
      }
      const user = result[0];
      bcrypt.compare(password, user.hashed_password, (err, result) => {
          if (err) {
              return res.status(500).json({ error: 'Error during password comparison' });
          }

          if (result) {
              req.session.user_id = user.user_id; 
              req.session.username = user.username
              console.log(req.session)
              console.log("success")
              res.status(200).json({ username: user.username });
          } else {
              res.status(401).json({ error: 'Username and/or password are invalid.' });
          }
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
  }
 
};


// GET /logout
var postLogout = async function(req, res) {
  if (req.session && req.session.user_id) {
    req.session.user_id = null;
    req.session.username = null;

    req.session.destroy(function(err) {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: "Error logging out." });
        }
        res.status(200).json({ message: "You were successfully logged out." });
    });
  } else {
      res.status(200).json({ message: "You were successfully logged out." });
  }
  
};



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


// POST /mostPopularHashtags
var most_popular_hashtags = async function(req, res) {
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



// POST /setProfilePhoto
var set_profile_photo = async function(req, res) {
  //upload to s3
  //then reset in user db
  
};


// GET /getProfile
var get_profile = async function(req, res) {
  var username = req.params.username;
  if (username == null){
    return res.status(403).json({ error: 'Not logged in.' });
  }
  if (!helper.isLoggedIn(req,username)) {
      return res.status(403).json({ error: 'Not logged in.' });
  }
  var query = "SELECT * FROM users WHERE username = '" + username + "'";
  try {
      var result = await db.send_sql(query);
      return result
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
  }
};



var getActors = async function(req, res) {

}

var postActor = async function(req, res) {
  
}










var routes = { 
    get_helloworld: getHelloWorld,
    post_login: postLogin,
    post_register: postRegister,
    post_logout: postLogout,
    get_actors: getActors,
    post_actor: postActor
  };


module.exports = routes;

