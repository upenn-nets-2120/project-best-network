const dbaccess = require('./db_access');
const config = require('../config.json'); // Load configuration

function sendQueryOrCommand(db, query, params = []) {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

async function create_tables(db) {
    //users table
    var q1 = db.create_tables(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      firstName VARCHAR(255),
      lastName VARCHAR(255),
      email VARCHAR(255),
      birthday DATE,
      affiliation VARCHAR(255),
      profilePhoto VARCHAR(255),
      hashtagInterests TEXT[]
    );`);



    return await Promise.all([q1]);
}

// Database connection setup
const db = dbaccess.get_db_connection();

var result =create_tables(dbaccess);
console.log('Tables created');
dbaccess.close_db();

const PORT = config.serverPort;


