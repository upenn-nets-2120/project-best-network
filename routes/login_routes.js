const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('./login_route_helper.js');
const process = require('process');


// Database connection setup
const db = dbsingleton;
db.get_db_connection();
const PORT = config.serverPort;

vectorStore = await helper.getVectorStore(null);

var getHelloWorld = function(req, res) {
    res.status(200).send({message: "Hello, world!"});
}


// POST /register 
var postRegister = async function(req, res) {
  const { username, password, firstName, lastName, email, birthday, affiliation, profilePhoto, hashtagInterests } = req.body;

};



// POST /login
var postLogin = async function(req, res) {

   
};


// GET /logout
var postLogout = function(req, res) {

  
};



// POST /logout
var postSetHashTags = function(req, res) {

  
};


// POST /logout
var postSetProfilePhoto = function(req, res) {
  
  
};













var routes = { 
    get_helloworld: getHelloWorld,
    post_login: postLogin,
    post_register: postRegister,
    post_logout: postLogout, 
  };


module.exports = routes;

