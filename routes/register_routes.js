const login_routes = require('./login_routes.js');
const multer = require('multer');
const friend_routes = require('./friend_routes.js');
const account_routes = require('./account_routes.js');
const profile_routes = require('./profile_routes.js');
const feed_routes = require('./feed_routes.js');
const actor_routes = require('./actor_routes.js');
const { ChromaClient } = require("chromadb");


const s3Access = require('../models/s3_access.js'); 

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });
const client = new ChromaClient();


module.exports = {
    register_routes
}

function register_routes(app) {
    //login UPDATE
    app.get('/hello', login_routes.get_helloworld);
    app.get('/checkRegistration', login_routes.get_registration);
    app.post('/login', login_routes.post_login);
    app.get('/:username/logout', login_routes.post_logout);
    app.post('/register', login_routes.post_register);
    app.post('/:username/setProfilePhoto', upload.single('profilePhoto'), login_routes.set_profile_photo); 
    app.post('/:username/deleteProfilePhoto', login_routes.delete_profile_photo); 
    app.get('/:username/isLoggedIn', login_routes.is_logged_in);

    //account changes
    app.put('/:username/change-username', account_routes.change_username);
    app.put('/:username/change-firstname', account_routes.change_firstname);
    app.put('/:username/change-lastname', account_routes.change_lastname);
    app.put('/:username/change-email', account_routes.change_email);
    app.put('/:username/change-birthday', account_routes.change_birthday);
    app.put('/:username/change-affiliation', account_routes.change_affiliation);
    app.put('/:username/change-password', account_routes.change_password);


    //profile stuff
    app.post('/:username/addHashtag', profile_routes.post_add_hashtag);
    app.post('/:username/removeHashtag', profile_routes.post_remove_hashtag);
    app.get('/:username/getRecommendedHashtags', profile_routes.get_recommended_hashtags);
    app.get('/:username/getProfile', profile_routes.get_profile);


    //friend routes
    app.post('/:username/addFriend', friend_routes.add_friend);
    app.post('/:username/removeFriend', friend_routes.remove_friend);
    app.get('/:username/onlineFriends', friend_routes.get_online_friends);
    app.get('/:username/offlineFriends', friend_routes.get_offline_friends);


    //feed routes
    app.post('/:username/createPost', feed_routes.create_post); 
    app.post('/createTweet', feed_routes.create_tweet); 
    app.get('/:username/getComment', feed_routes.get_comments);
    app.post('/:username/uploadPost', upload.single('post'), feed_routes.upload_post); 
    app.get('/:username/feed', feed_routes.get_feed);
    app.post('/:username/sendLike', feed_routes.send_like);

    //actor routes
    app.get('/:username/getActors', actor_routes.get_actors);
    app.post('/:username/setActor', actor_routes.set_actor);
   




  }
  