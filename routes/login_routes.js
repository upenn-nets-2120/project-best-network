const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('./login_route_helper.js');
const process = require('process');


// Database connection setup
const db = dbsingleton;
db.get_db_connection();
const PORT = config.serverPort;

vectorStore = await helper.getVectorStore(null);

var getHelloWorld = function(req, res) {
    res.status(200).send({message: "Hello, world!"});
}


// POST /register 
var postRegister = async function(req, res) {
  const { username, password, firstName, lastName, email, birthday, affiliation, profilePhoto, hashtagInterests } = req.body;
  if (!username || !password || !firstName || !lastName || !email || !birthday || !affiliation) {
    return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
  }

  // POST /register 
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
    var query = "SELECT * FROM users WHERE username = '" + username + "'";
    var result = await db.send_sql(query);
    if (result.length > 0) {
      return res.status(409).json({ error: 'An account with this username already exists, please try again.' });
    }

    // Insert the new user into the database
    var insertQuery = `
      INSERT INTO users (username, hashed_password, firstName, lastName, email, birthday, affiliation, profilePhoto, hashtagInterests) 
      VALUES ('${username}', '${hashed_password}', '${firstName}', '${lastName}', '${email}', '${birthday}', '${affiliation}', '${profilePhoto}', '${hashtagInterests}')
    `;
    await db.send_sql(insertQuery);

    return res.status(200).json({ username: username });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Error querying database.' });
    }
  };

};



// POST /login
var postLogin = async function(req, res) {
  // TODO: check username and password and login
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
  }
  var query = "SELECT * FROM users WHERE username = '" + username + "'";
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



// POST /setHashTags
var postSetHashTags = async function(req, res) {
  var username = req.params.username;
  if (username == null){
    return res.status(403).json({ error: 'Not logged in.' });
  }
  if (!helper.isLoggedIn(req,username)) {
      return res.status(403).json({ error: 'Not logged in.' });
  }
  
};


// POST /setProfilePhoto
var postSetProfilePhoto = async function(req, res) {
  //upload to s3
  //then reset in user db
  
};


// GET /getProfile
var getProfile = async function(req, res) {
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












var routes = { 
    get_helloworld: getHelloWorld,
    post_login: postLogin,
    post_register: postRegister,
    post_logout: postLogout, 
  };


module.exports = routes;

