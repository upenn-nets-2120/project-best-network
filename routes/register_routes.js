const routes = require('./login_routes.js');

module.exports = {
    register_routes
}

function register_routes(app) {
    //login
    app.get('/hello', routes.get_helloworld);
    app.post('/login', routes.post_login);
    app.get('/:username/logout', routes.post_logout);
    app.post('/register', routes.post_register); 

    app.get('/mostPopularHashtags', routes.most_popular_hashtags); 
    app.get('/:username/getProfile', routes.get_profile); 
    app.post('/:username/setProfilePhoto', routes.set_profile_photo); 
    app.post('/:username/setProfileHashTags', routes.set_profile_hashtags); 



    //friends
    app.get('/:username/feed', routes.get_friends);
    app.post('/:username/addFriend', routes.get_friends);
    app.post('/:username/removeFriend', routes.get_friends);

    //chat
    app.post('/:username/leaveChat', routes.get_friend_recs);
    app.post('/:username/joinChat', routes.create_post); 
    app.post('/:username/writeToChat', routes.get_feed);


  }
  