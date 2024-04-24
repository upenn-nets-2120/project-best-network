


// POST /addFriend
var addFriend = async function(req, res) {
    // Implementation to add a friend
  };
  
  // POST /removeFriend
  var removeFriend = async function(req, res) {
    // Implementation to remove a friend
  };
  
  // GET /feed
  var feed = async function(req, res) {
    // Implementation to fetch feed data
  };

  // GET /friends
  var friends = async function(req, res) {
    // Implementation to fetch feed data
  };
  
  var routes = { 
    feed: feed,
    add_friend: addFriend,
    remove_friend: removeFriend,
  };


  module.exports = routes;
  