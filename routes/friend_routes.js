
const PORT = config.serverPort;

var getHelloWorld = function(req, res) {
  res.status(200).send({message: "Hello, world!"});
}
// POST /addFriend
var addFriend = async function(req, res) {
    // Implementation to add a friend
  };
  
  // POST /removeFriend
  var removeFriend = async function(req, res) {
    // Implementation to remove a friend
    // Check if a user is logged in
    
    if (!req.session.user_id) {
      return res.status(403).json({ error: 'Not logged in.' });
    }
  };
  
  // GET /feed
  var feed = function(req, res) {
    // Implementation to fetch feed data
    // Check if a user is logged in
    
    if (!req.session.user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    try {
        // Query to get posts for the current user's feed
        // get the nconst id
        const getLinkedId = `SELECT * FROM users WHERE user_id = ${req.session.user_id}`;
        const users =await db.send_sql(getLinkedId);
        const user = users[0];
        const feedQuery = `
            SELECT posts.post_id AS post_id, users.username AS username, posts.parent_post AS parent_post, 
                   posts.title AS title, posts.content AS content
            FROM posts
            INNER JOIN users ON posts.author_id = users.user_id
            WHERE posts.author_id IN (
                SELECT followed
                FROM friends
                WHERE follower = '${user.linked_id}'
            )
            OR posts.author_id = ${req.session.user_id}
            ORDER BY post_id DESC
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
  
  var routes = { 
    addFriend: addFriend,
    removeFriend: removeFriend,
    feed: feed,
    add_friend: addFriend,
    remove_friend: removeFriend,
  };


  module.exports = routes;
  