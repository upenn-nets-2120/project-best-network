const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const helper = require('../routes/login_route_helper.js');
const s3Access = require('../models/s3_access.js'); 
//const PORT = config.serverPort;
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

      // Respond with success message
      return res.status(200).json({ message: 'Friend removed successfully.' });
  } catch (error) {
      // Handle database query errors
      console.error("Error querying database:", error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
};

  
  // GET /feed
  var feed = async function(req, res) {
    // Implementation to fetch feed data
    // Check if a user is logged in
    console.log(req.session.user_id);
    if (req.session.user_id === null) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    try {
        // Query to get posts for the current user's feed
        // get the nconst id
        const getLinkedId = `SELECT * FROM users WHERE id = ${req.session.user_id}`;
        const users =await db.send_sql(getLinkedId);
        const user = users[0];
        const feedQuery = `
          SELECT outer_post.post_id AS post_id, users.username AS username, outer_post.parent_post AS parent_post, 
          outer_post.title AS title, outer_post.content AS content
          FROM posts AS outer_post
          INNER JOIN users ON outer_post.author_id = users.id
          WHERE outer_post.author_id IN (
              SELECT followed
              FROM friends
              WHERE follower = '${user.linked_id}'
          )
          OR outer_post.author_id = ${req.session.user_id}
          OR outer_post.post_id IN (
            SELECT post_to_hashtags.post_id
            FROM post_to_hashtags 
            INNER JOIN hashtagInterests ON hashtagInterests.hashtagID = post_to_hashtags.hashtag_id
            WHERE hashtagInterests.userID = outer_post.author_id
          )
          ORDER BY post_id DESC;
        `;
        const posts = await db.send_sql(feedQuery);

        // Return the feed posts
        return res.status(200).json({ results: posts });
    } catch (error) {
        // Handle database query errors
        console.error("Error querying database:", error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
    
  };
  // POST /createPost
var createPost = async function(req, res) {
  // Check if a user is logged in
  
  if (req.session.user_id === null) {
      return res.status(403).json({ error: 'Not logged in.' });
  }

  // Extract post parameters from the request body
  const { title, content, parent_id, hashtags } = req.body;
  console.log('Request body:', req.body);
  console.log('Request files:', req.file);
  console.log(title); 
  console.log(content); 
  console.log(parent_id); 
  console.log(hashtags); 

  // Check if any of the required fields are empty
  // if ((!title && !content) && !hashtags && !Array.isArray(hashtags)) {
  //   return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
  // }

  // Validate title and content to prevent SQL injection
  //const alphanumericRegex = /^[a-zA-Z0-9\s.,_?]+$/;
  
  try {
      //get username

      // Insert the post into the database
      let insertQuery;
      if (parent_id === undefined) {
          // If parent_id is undefined, insert NULL for parent_post
          insertQuery = `
              INSERT INTO posts (title, content, parent_post, author_id, like_count)
              VALUES ('${title}', '${content}', NULL, ${req.session.user_id}, 0)
          `;
      } else {
          // If parent_id is defined, include it in the query
          insertQuery = `
              INSERT INTO posts (title, content, parent_post, author_id)
              VALUES ('${title}', '${content}', ${parent_id}, ${req.session.user_id})
          `;
      }
      await db.send_sql(insertQuery);
      const getLastPost = `SELECT * FROM posts WHERE post_id = LAST_INSERT_ID()`;
      const last_post = await db.send_sql(getLastPost);
      const last_id = last_post[0].post_id;
      //const lastInsertId = last_id[0]['LAST_INSERT_ID()'];
      // insert hashtags into post_to_hashtags for each hashtag
      //const last_id = await db.send_sql(id_query);
      console.log(last_id);
      for (const element of hashtags) {
        // first check if hashtag already exists
        let hashtagQuery = `
            SELECT * FROM hashtags WHERE text = '${element}'
        `;
        let hashtag_result = await db.send_sql(hashtagQuery);
        console.log(element);
        console.log(hashtag_result);
        // if result is empty, add hashtag to hashtag to table
        // now quee the id from hashtags tables
   // If the result is not empty, it means the hashtag already exists
          if (hashtag_result.length > 0) {
            // Fetch the hashtag_id from the result
            const hashtag_id = hashtag_result[0].id;
            // Update the count value in the hashtags table
            let updateQuery = `
                UPDATE hashtags
                SET count = count + 1
                WHERE id = ${hashtag_id}
            `;
            await db.send_sql(updateQuery);
            // Insert the post-to-hashtag relationship into the post_to_hashtags table
            let insertQuery2 = `
                INSERT INTO post_to_hashtags (post_id, hashtag_id)
                VALUES (${last_id}, ${hashtag_id})
            `;
            await db.send_sql(insertQuery2);
        } else {
            // If the result is empty, the hashtag does not exist
            // Insert the hashtag into the hashtags table first
            let insertHashtagQuery = `
                INSERT INTO hashtags (text, count)
                VALUES ('${element}', 1)
            `;
            var insert_hashtag_result = await db.send_sql(insertHashtagQuery);

            // Fetch the inserted hashtag's ID
            const hashtag_id = insert_hashtag_result.insertId;

            // Insert the post-to-hashtag relationship into the post_to_hashtags table
            let insertQuery2 = `
                INSERT INTO post_to_hashtags (post_id, hashtag_id)
                VALUES (${last_id}, ${hashtag_id})
            `;
            await db.send_sql(insertQuery2);
        }
      }
      // Return successful response

      console.log(content);
      if (content){
        //TODO: set profile photo
        //https://github.com/upenn-nets-2120/homework-2-ms1-vavali08/blob/main/src/main/java/org/nets2120/imdbIndexer/S3Setup.java Reference - Note that this is Java
        await s3Access.put_by_key("best-network-nets212-sp24", "/postContent/" + last_id, content, 'image/*');
        const photoURL = await s3Access.get_by_key("/profilePictures/" + last_id);
        console.log(photoURL);
        pfpQuery = `UPDATE users SET profilePhoto = ${photoURL} WHERE id = '${last_id}'`;
        console.log(pfpQuery);
        await db.send_sql(pfpQuery);
      }
      return res.status(201).json({ message: 'Post created.' });
  } catch (error) {
      // Handle database query errors
      console.error("Error querying database:", error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
};
// POST /uploadPost
var uploadPost = async function(req, res) {
  //upload to s3
  //then reset in user db


  //TODO: set profile photo
  //https://github.com/upenn-nets-2120/homework-2-ms1-vavali08/blob/main/src/main/java/org/nets2120/imdbIndexer/S3Setup.java Reference - Note that this is Java
  const getLastPost = `SELECT * FROM posts WHERE post_id = LAST_INSERT_ID()`;
  const last_post = await db.send_sql(getLastPost);
  const last_id = last_post[0].post_id;

  const post = req.file;
  console.log(post);
  const userID = req.session.user_id;

  if (!post) {
    return res.status(400).json({ error: 'No profile photo uploaded.' });
  }
  // if (!userID) {
  //   return res.status(403).json({ error: 'Not logged in.' });
  // }

  try {
    await s3Access.put_by_key("best-network-nets212-sp24", "/posts/" + last_id, post.buffer, post.mimetype);
    // Get the photo URL from S3
    const photoURL = `s3://best-network-nets212-sp24//posts/${last_id}`

    // Update the user's profile photo URL in the database
    const pfpQuery = `UPDATE posts SET content = '${photoURL}' WHERE post_id = ${last_id};`;
    await db.send_sql(pfpQuery);

    return res.status(200).json({ message: 'Profile photo uploaded successfully.' });
  } catch (error) {

    return res.status(500).json({ error: 'Error uploading profile photo.' });
  }

};

// POST /like
var sendLike = async function(req, res) {
  const { post_id } = req.body;
  
  // Check if postID is provided
  if (post_id === undefined) {
      return res.status(400).json({ error: 'postID is required.' });
  }

  // Check if postID is an integer
  if (isNaN(post_id)) {
      return res.status(400).json({ error: 'postID must be an integer.' });
  }

  // Check if the user is logged in
  if (req.session.user_id === undefined) {
      return res.status(400).json({ error: 'Not logged in.' });
  }

  try {
      // Check if the user has already liked the post
      const checkLikeQuery = `
          SELECT *
          FROM likeToPost
          WHERE userID = ${req.session.user_id} AND postID = ${post_id}
      `;
      const likeResult = await db.send_sql(checkLikeQuery);

      // If the user has already liked the post, return an error
      if (likeResult.length > 0) {
          return res.status(400).json({ error: 'You have already liked this post.' });
      }

      // Insert the like into the likeToPost table
      const insertQuery = `
        INSERT INTO likeToPost (userID, postID)
        VALUES (${req.session.user_id}, ${post_id})
      `;
      await db.send_sql(insertQuery);

      // Increment the like_count in the posts table
      const updateLikeQuery = `
          UPDATE posts
          SET like_count = like_count + 1
          WHERE post_id = ${post_id}
      `;
      await db.send_sql(updateLikeQuery);

      return res.status(201).json({ message: 'Like sent successfully.' });
  } catch (error) {
      console.error("Error querying database:", error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
};



  
  var routes = { 
    create_post: createPost,
    add_friend: addFriend,
    remove_friend: removeFriend,
    get_feed: feed,
    upload_post: uploadPost,
    send_like: sendLike
  };
  
  module.exports = routes;
  