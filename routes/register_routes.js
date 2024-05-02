const login_routes = require('./login_routes.js');
const multer = require('multer');
const chat_routes = require('./chat_routes.js');
const friend_routes = require('./friend_routes.js');
const s3Access = require('../models/s3_access.js'); 

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

module.exports = {
    register_routes
}

function register_routes(app) {
    //login UPDATE
    app.get('/hello', login_routes.get_helloworld);
    app.post('/login', login_routes.post_login);
    app.get('/:username/logout', login_routes.post_logout);
    app.post('/register', login_routes.post_register);
    app.post('/:username/setProfilePhoto', upload.single('profilePhoto'), login_routes.post_set_profile_photo); 
    app.get('/:username/getMostSimilarActors', login_routes.get_most_similar_actors);
    app.post('/:username/setActor', login_routes.post_actor);
    app.post('/:username/addHashtag', login_routes.post_add_hashtag);
    app.post('/:username/removeHashtag', login_routes.post_remove_hashtag);
    app.get('/:username/getRecommendedHashtags', login_routes.get_recommended_hashtags);
    app.get('/:username/getProfile', login_routes.get_profile);

    //account changes
    app.put('/:username/change-username', login_routes.change_username);
    app.put('/:username/change-firstname', login_routes.change_firstname);
    app.put('/:username/change-lastname', login_routes.change_lastname);
    app.put('/:username/change-email', login_routes.change_email);
    app.put('/:username/change-birthday', login_routes.change_birthday);
    app.put('/:username/change-affiliation', login_routes.change_affiliation);
    app.put('/:username/change-password', login_routes.change_password);

    //friends UPDATE
    app.post('/:username/createPost', friend_routes.create_post); 
    app.post('/:username/uploadPost', upload.single('post'), friend_routes.upload_post); 
    app.get('/:username/feed', friend_routes.get_feed);
    app.post('/:username/addFriend', friend_routes.add_friend);
    app.post('/:username/removeFriend', friend_routes.remove_friend);
    app.post('/:username/sendLike', friend_routes.send_like);
    app.get('/:username/onlineFriends', friend_routes.get_online_friends);
    app.get('/:username/offlineFriends', friend_routes.get_offline_friends);


    //chat
    app.get('/:username/isLoggedIn', chat_routes.is_logged_in);

  }
  