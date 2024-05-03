const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('../routes/login_route_helper.js');
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

// check if user exists (Kim inputed for kafka)
var checkRegistration = async function(req, res) {
  try {
      // Extract the username from the request body
      const { federatedUsername } = req.body;

      if (!federatedUsername) {
        return res.status(400).json({ error: 'Username is required.' });
    }

      // Query the database to check if the user exists
      const query = `SELECT * FROM users WHERE username = '${federatedUsername}'`;
      const result = await db.send_sql(query);

      // If the user exists, return a success message
      if (result.length > 0) {
          return res.status(200).json({ registered: true });
      }

      // If the user does not exist, return a message indicating not registered
      return res.status(200).json({ registered: false });
  } catch (error) {
      console.error('Error querying database:', error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
};

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
      "hashtagInterests": ["hello", "bye"] -> this should be in list format, can be null
    }

*/
var postRegister = async function(req, res) {
  const { username, password, firstName, lastName, email, birthday, affiliation, hashtagInterests } = req.body;
  console.log(req.body);
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
      INSERT INTO users (username, hashed_password, firstName, lastName, email, birthday, affiliation, logged_in) 
      VALUES ('${username}', '${hashed_password}', '${firstName}', '${lastName}', '${email}', '${birthday}', '${affiliation}', '1')
    `;
    await db.send_sql(insertQuery);

    //Retrieve userID from databse for purposes of inserting hashtags/images
    const userIDQuery = `SELECT id FROM users WHERE username = '${username}'`;
    const userIDQueryResult = await db.send_sql(userIDQuery);
    const userID = userIDQueryResult[0].id;

    req.session.user_id = userID; 
    req.session.username = userIDQueryResult[0].username;


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

          

        }

      }
    }

    return res.status(200).json({ username: username });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error querying database.' });
  }
};


// POST /setProfilePhoto
var setProfilePhoto = async function(req, res) {
  //upload to s3
  //then reset in user db


  //TODO: set profile photo
  //https://github.com/upenn-nets-2120/homework-2-ms1-vavali08/blob/main/src/main/java/org/nets2120/imdbIndexer/S3Setup.java Reference - Note that this is Java

  const profilePhoto = req.file;
  console.log(profilePhoto);
  const userID = req.session.user_id;

  if (!profilePhoto) {
    return res.status(400).json({ error: 'No profile photo uploaded.' });
  }
  if (!userID) {
    return res.status(403).json({ error: 'Not logged in.' });
  }

  try {
    await s3Access.put_by_key("best-network-nets212-sp24", "/profilePictures/" + userID, profilePhoto.buffer, profilePhoto.mimetype);
    // Get the photo URL from S3
    const photoURL = `https://best-network-nets212-sp24.s3.amazonaws.com//profilePictures/${userID}`

    // Update the user's profile photo URL in the database
    const pfpQuery = `UPDATE users SET profilePhoto = '${photoURL}' WHERE id = '${userID}';`;
    await db.send_sql(pfpQuery);

    return res.status(200).json({ message: 'Profile photo uploaded successfully.' });
  } catch (error) {

    return res.status(500).json({ error: 'Error uploading profile photo.' });
  }
  
  
};




// POST /login
var postLogin = async function(req, res) {
  // TODO: check username and password and login
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
  }
  var query = `SELECT * FROM users WHERE username = '${username}'`;
  try {
      var result = await db.send_sql(query);

      if (result.length == 0) {
          return res.status(401).json({ error: 'Username and/or password are invalid.' });
      }
      const user = result[0];

      const loginQuery = `UPDATE users SET logged_in = '1' WHERE id = '${user.id}';`;
      await db.send_sql(loginQuery);

      bcrypt.compare(password, user.hashed_password, (err, result) => {
          if (err) {
              return res.status(500).json({ error: 'Error during password comparison' });
          }

          if (result) {
              req.session.user_id = user.id; 
              console.log(user.id); 
              req.session.username = user.username;
              console.log(req.session);
              console.log("success");
              req.session.save(); 
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
    try {
      const logoutQuery = `UPDATE users SET logged_in = '0' WHERE id = '${req.session.user_id}';`;
      await db.send_sql(logoutQuery);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
    }

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

// Put
var change_username = async function(req, res) {
  // TODO: check username and password and login
  const { username } = req.body;

  if (!req.session.user_id) {
    return res.status(403).json({ error: 'Not logged in.' });
  }
  if (!username) {
      return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
  }
  try {
      const updateQuery = `UPDATE users SET username = '${username}' WHERE id = '${req.session.user_id}';`;
      await db.send_sql(updateQuery);
      req.session.username = user.username;
      console.log(req.session);
      console.log("success");
      res.status(200).json({ username: user.username });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
  }
 
};

// Put
var change_firstname = async function(req, res) {
  const { firstName } = req.body;

  if (!req.session.user_id) {
    return res.status(403).json({ error: 'Not logged in.' });
  }
  if (!firstName) {
    return res.status(400).json({ error: 'First name cannot be empty.' });
  }
  try {
    const updateQuery = `UPDATE users SET firstName = '${firstName}' WHERE id = '${req.session.user_id}';`;
    await db.send_sql(updateQuery);
    req.session.firstName = firstName;
    res.status(200).json({ firstName: firstName });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error querying database.' });
  }
};

// Put
var change_lastname = async function(req, res) {
  const { lastName } = req.body;

  if (!req.session.user_id) {
    return res.status(403).json({ error: 'Not logged in.' });
  }
  if (!lastName) {
    return res.status(400).json({ error: 'Last name cannot be empty.' });
  }
  try {
    const updateQuery = `UPDATE users SET lastName = '${lastName}' WHERE id = '${req.session.user_id}';`;
    await db.send_sql(updateQuery);
    req.session.lastName = lastName;
    res.status(200).json({ lastName: lastName });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error querying database.' });
  }
};

// Put
var change_email = async function(req, res) {
  const { email } = req.body;

  if (!req.session.user_id) {
    return res.status(403).json({ error: 'Not logged in.' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Email cannot be empty.' });
  }
  try {
    const updateQuery = `UPDATE users SET email = '${email}' WHERE id = '${req.session.user_id}';`;
    await db.send_sql(updateQuery);
    req.session.email = email;
    res.status(200).json({ email: email });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error querying database.' });
  }
};

// Put
var change_birthday = async function(req, res) {
  const { birthday } = req.body;

  if (!req.session.user_id) {
    return res.status(403).json({ error: 'Not logged in.' });
  }
  if (!birthday) {
    return res.status(400).json({ error: 'Birthday cannot be empty.' });
  }
  try {
    const updateQuery = `UPDATE users SET birthday = '${birthday}' WHERE id = '${req.session.user_id}';`;
    await db.send_sql(updateQuery);
    req.session.birthday = birthday;
    res.status(200).json({ birthday: birthday });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error querying database.' });
  }
};

// Put
var change_affiliation = async function(req, res) {
  const { affiliation } = req.body;
  console.log(affiliation);
  if (!req.session.user_id) {
    return res.status(403).json({ error: 'Not logged in.' });
  }
  if (!affiliation) {
    return res.status(400).json({ error: 'Affiliation cannot be empty.' });
  }
  try {
    const updateQuery = `UPDATE users SET affiliation = '${affiliation}' WHERE id = '${req.session.user_id}';`;
    console.log(updateQuery);

    await db.send_sql(updateQuery);
    req.session.affiliation = affiliation;
    res.status(200).json({ affiliation: affiliation });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error querying database.' });
  }
};


// Put
var change_password = async function(req, res) {
  const { password } = req.body;

  if (!req.session.user_id) {
    return res.status(403).json({ error: 'Not logged in.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password cannot be empty.' });
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
    const updateQuery = `UPDATE users SET password = '${hashed_password}' WHERE id = '${req.session.user_id}';`;
    await db.send_sql(updateQuery);
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error querying database.' });
  }
};





// get /isLoggedIn
//this is required for chatRoom
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



var routes = { 
    get_helloworld: getHelloWorld,
    get_registration: checkRegistration,
    post_login: postLogin,
    post_register: postRegister,
    post_set_profile_photo: setProfilePhoto,
    post_logout: postLogout,
    get_most_similar_actors: get_most_similar_actors,
    get_recommended_hashtags: get_recommended_hashtags,
    post_add_hashtag: post_add_hashtag,
    post_remove_hashtag: post_remove_hashtag,
    post_actor: post_actor,
    get_profile: get_profile,
    change_username: change_username,
    change_firstname: change_firstname,
    change_lastname: change_lastname,
    change_email: change_email,
    change_birthday: change_birthday,
    change_affiliation: change_affiliation,
    change_password: change_password,
    is_logged_in : is_logged_in
  };


module.exports = routes;

