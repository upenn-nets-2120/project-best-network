const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('./login_route_helper.js');
const process = require('process');
const s3Access = require('../models/s3_access.js'); 



// Database connection setup
const db = dbsingleton;
db.get_db_connection();
const PORT = config.serverPort;

// Put
var change_username = async function(req, res) {
    // TODO: check username and password and login
    const { username } = req.body;
  
    if (!req.session.user_id) {
      return res.status(403).json({ error: 'Not logged in.' });
    }
    if (!username) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    try {
        const updateQuery = `UPDATE users SET username = '${username}' WHERE id = '${req.session.user_id}';`;
        await db.send_sql(updateQuery);
        req.session.username = username;
        console.log(req.session);
        console.log("success");
        res.status(200).json({ username: req.session.username });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error querying database.' });
    }
   
  };
  
  // Put
  var change_firstname = async function(req, res) {
    const { firstName } = req.body;
  
    if (!req.session.user_id) {
      return res.status(403).json({ error: 'Not logged in.' });
    }
    if (!firstName) {
      return res.status(400).json({ error: 'First name cannot be empty.' });
    }
    try {
      const updateQuery = `UPDATE users SET firstName = '${firstName}' WHERE id = '${req.session.user_id}';`;
      await db.send_sql(updateQuery);
      res.status(200).json({ firstName: firstName });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
    }
  };
  
  // Put
  var change_lastname = async function(req, res) {
    const { lastName } = req.body;
  
    if (!req.session.user_id) {
      return res.status(403).json({ error: 'Not logged in.' });
    }
    if (!lastName) {
      return res.status(400).json({ error: 'Last name cannot be empty.' });
    }
    try {
      const updateQuery = `UPDATE users SET lastName = '${lastName}' WHERE id = '${req.session.user_id}';`;
      await db.send_sql(updateQuery);
      res.status(200).json({ lastName: lastName });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
    }
  };
  
  // Put
  var change_email = async function(req, res) {
    const { email } = req.body;
  
    if (!req.session.user_id) {
      return res.status(403).json({ error: 'Not logged in.' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email cannot be empty.' });
    }
    try {
      const updateQuery = `UPDATE users SET email = '${email}' WHERE id = '${req.session.user_id}';`;
      await db.send_sql(updateQuery);
      res.status(200).json({ email: email });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
    }
  };
  
  // Put
  var change_birthday = async function(req, res) {
    const { birthday } = req.body;
  
    if (!req.session.user_id) {
      return res.status(403).json({ error: 'Not logged in.' });
    }
    if (!birthday) {
      return res.status(400).json({ error: 'Birthday cannot be empty.' });
    }
    try {
      const updateQuery = `UPDATE users SET birthday = '${birthday}' WHERE id = '${req.session.user_id}';`;
      await db.send_sql(updateQuery);
      res.status(200).json({ birthday: birthday });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
    }
  };
  
  // Put
  var change_affiliation = async function(req, res) {
    const { affiliation } = req.body;
    console.log(affiliation);
    if (!req.session.user_id) {
      return res.status(403).json({ error: 'Not logged in.' });
    }
    if (!affiliation) {
      return res.status(400).json({ error: 'Affiliation cannot be empty.' });
    }
    try {
      const updateQuery = `UPDATE users SET affiliation = '${affiliation}' WHERE id = '${req.session.user_id}';`;
      console.log(updateQuery);
  
      await db.send_sql(updateQuery);
      req.session.affiliation = affiliation;
      res.status(200).json({ affiliation: affiliation });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
    }
  };
  
  
  // Put
  var change_password = async function(req, res) {
    const { password } = req.body;
  
    if (!req.session.user_id) {
      return res.status(403).json({ error: 'Not logged in.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password cannot be empty.' });
    }
    try {
       // Hash the password
       var hashed_password = await new Promise((resolve, reject) => {
        helper.encryptPassword(password, (err, hash) => {
          if (err) {
            console.error(err);
            reject(err);  
          } else {
            resolve(hash);  
          }
        });
      });
      const updateQuery = `UPDATE users SET hashed_password = '${hashed_password}' WHERE id = '${req.session.user_id}';`;
      await db.send_sql(updateQuery);
      res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error querying database.' });
    }
  };

  var routes = {
    change_username: change_username,
    change_firstname: change_firstname,
    change_lastname: change_lastname,
    change_email: change_email,
    change_birthday: change_birthday,
    change_affiliation: change_affiliation,
    change_password: change_password
  }

  module.exports = routes;
