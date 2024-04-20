// POST /:username/leaveChat
var leaveChat = function(req, res) {
    // Implementation to leave a chat
  };
  
  // POST /:username/joinChat
  var joinChat = function(req, res) {
    // Implementation to join a chat
  };
  
  // POST /:username/writeToChat
  var writeToChat = function(req, res) {
    // Implementation to write to a chat
  };
  
  var chatRoutes = { 
    leaveChat: leaveChat,
    joinChat: joinChat,
    writeToChat: writeToChat,
  };
  
  module.exports = chatRoutes;
  