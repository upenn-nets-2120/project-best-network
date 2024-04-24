const login_routes = require('./login_routes.js');
const chat_routes = require('./chat_routes.js');
const friend_routes = require('./friend_routes.js');
const s3Access = require('../models/s3_access.js'); 


module.exports = {
    register_routes
}

function register_routes(app) {
    //login UPDATE
    app.get('/hello', login_routes.get_helloworld);
    app.post('/login', login_routes.post_login);
    app.get('/:username/logout', login_routes.post_logout);
    app.post('/register', login_routes.post_register); 
    app.get(':username/getActors', login_routes.get_actors);
    app.post(':username/setActor', login_routes.post_actor);



    //friends UPDATE
    app.post('/:username/createPost', friend_routes.create_post); 
    app.get('/:username/feed', friend_routes.get_feed);
    app.post('/:username/addFriend', friend_routes.add_friend);
    app.post('/:username/removeFriend', friend_routes.remove_friend);

    //chat
    //app.ws('/:username/chat', chat_routes.chat);

  }
  