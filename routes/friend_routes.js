const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const helper = require('../routes/login_route_helper.js');
const s3Access = require('../models/s3_access.js'); 

const db = dbsingleton;
db.get_db_connection();
const PORT = config.serverPort;

var getHelloWorld = function(req, res) {
  res.status(200).send({message: "Hello, world!"});
}


// POST /addFriend
var addFriend = async function(req, res) {
    // Implementation to add a friend
    // turn into try catch and check if already friends !!!
    try {
      if (!req.session.user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
      }

      const {username} = req.body;
      if (!username) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
      }
      console.log(username);
      // get new friend id
      const getID = `SELECT id FROM users WHERE username = '${username}'`;
      const friend_id_result = await db.send_sql(getID);
      console.log(friend_id_result);
      const friend_id = friend_id_result[0].id;
      console.log(friend_id);
      // check if friend relationship already exists by checking friends table of (frendID, user_id) exists
      const checkFriendshipQuery = `
          SELECT *
          FROM friends
          WHERE followed = ${friend_id} AND follower = ${req.session.user_id}
      `;
      const friendshipResult = await db.send_sql(checkFriendshipQuery);

      if (friendshipResult.length > 0) {
          return res.status(400).json({ error: 'Friendship already exists.' });
      }
      // add to friends table
      const addFriend = `INSERT INTO friends (followed, follower)
      VALUES (${friend_id}, ${req.session.user_id})
      ` 
      await db.send_sql(addFriend);

      const addFriend2 = `INSERT INTO friends (followed, follower)
      VALUES (${req.session.user_id}, ${friend_id})
      ` 
      await db.send_sql(addFriend2);

      return res.status(201).json({ message: `now following ${username}` });
    } catch (error) {
      // Handle database query errors
      console.error("Error querying database:", error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
  };
  
  // POST /removeFriend
 // POST /removeFriend
var removeFriend = async function(req, res) {
  try {
      // Check if a user is logged in
      if (!req.session.user_id) {
          return res.status(403).json({ error: 'Not logged in.' });
      }

      // Extract friend username from request body
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
      }
      console.log(username);
      // Get friend ID from the users table
      const getIDQuery = `SELECT id FROM users WHERE username = '${username}'`;
      const friendIDResult = await db.send_sql(getIDQuery);
      const friendID = friendIDResult[0].id;

      // Remove friend relationship from the friends table
      const removeFriendQuery = `
          DELETE FROM friends
          WHERE followed = '${friendID}' AND follower = ${req.session.user_id}
      `;
      await db.send_sql(removeFriendQuery);

      const removeFriendQuery2 = `
          DELETE FROM friends
          WHERE followed = '${req.session.user_id}' AND follower = ${friendID}
      `;
      await db.send_sql(removeFriendQuery2);

      // Respond with success message
      return res.status(200).json({ message: 'Friend removed successfully.' });
  } catch (error) {
      // Handle database query errors
      console.error("Error querying database:", error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
};

  
  
// /GET friends online
// Function to get online friends
var getOnlineFriends = async function(req, res) {
  try {
      // Check if a user is logged in
      if (!req.session.user_id) {
          return res.status(403).json({ error: 'Not logged in.' });
      }

      // Query to get online friends
      const onlineFriendsQuery = `
          SELECT users.*
          FROM friends
          JOIN users ON friends.followed = users.id
          WHERE friends.follower = ${req.session.user_id} AND users.logged_in = 1;
      `;
      const onlineFriends = await db.send_sql(onlineFriendsQuery);

      // Return the online friends
      console.log("online friends: " + onlineFriends);

      return res.status(200).json({ results: onlineFriends });
  } catch (error) {
      // Handle database query errors
      console.error("Error querying database:", error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
};

var getOfflineFriends = async function(req, res) {
  try {
      // Check if a user is logged in
      if (!req.session.user_id) {
          return res.status(403).json({ error: 'Not logged in.' });
      }

      // Query to get online friends
      const offlineFriendsQuery = `
          SELECT users.*
          FROM friends
          JOIN users ON friends.followed = users.id
          WHERE friends.follower = ${req.session.user_id} AND users.logged_in = 0;
      `;
      const offlineFriends = await db.send_sql(offlineFriendsQuery);
      
      console.log(offlineFriends);
      // Return the online friends
      return res.status(200).json({ results: offlineFriends });
  } catch (error) {
      // Handle database query errors
      console.error("Error querying database:", error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
};

var getRecommendedFriends = async function (req, res) {
  try {
    // Check if a user is logged in
    if (!req.session.user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    // Query to get friend recommendations
    const recommendationsQuery = `
      SELECT users.*
      FROM socialNetworkFriendRecommendations s
      JOIN users ON s.userID = users.id
      WHERE s.userLabelID = ${req.session.user_id}
      ORDER BY s.weight DESC;
  `;

   
    const recommendedFriends = await db.send_sql(recommendationsQuery);
    console.log("friend recs: ")
    console.log(recommendedFriends);

    return res.status(200).json({ results: recommendedFriends });
} catch (error) {
    // Handle database query errors
    console.error("Error querying database:", error);
    return res.status(500).json({ error: 'Error querying database.' });
}
}



  
  var routes = { 

    add_friend: addFriend,
    remove_friend: removeFriend,

    get_online_friends: getOnlineFriends,
    get_offline_friends: getOfflineFriends,
    get_recommended_friends: getRecommendedFriends
  };
  
  module.exports = routes;
  