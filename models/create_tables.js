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
    const q1 = db.create_tables(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE,
                hashed_password VARCHAR(255),
                firstName VARCHAR(255),
                lastName VARCHAR(255),
                email VARCHAR(255),
                birthday DATE,
                affiliation VARCHAR(255),
                profilePhoto VARCHAR(255),
                actor_nconst VARCHAR(255)
            );
    `);

    const q2 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS hashtags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text VARCHAR(255) UNIQUE,
        count INT DEFAULT 0
    );
  `);

    const q3 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS hashtagInterests (
        hashtagID INT,
        userID INT,
        FOREIGN KEY (hashtagID) REFERENCES hashtags(id),
        FOREIGN KEY (userID) REFERENCES users(userID)
    )
    
    `);
      // TODO: create posts table
    const q4 = db.create_tables('CREATE TABLE IF NOT EXISTS posts( \
        post_id int AUTO_INCREMENT NOT NULL, \
        parent_post int, \
        title VARCHAR(255), \
        content VARCHAR(255), \
        author_id int, \
        FOREIGN KEY (parent_post) REFERENCES posts(post_id), \
        FOREIGN KEY (author_id) REFERENCES users(id), \
        PRIMARY KEY (post_id) \
      );');
    // create friends tables
    const q5 = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
      followed VARCHAR(10), \
      follower VARCHAR(10), \
      FOREIGN KEY (follower) REFERENCES users(id), \
      FOREIGN KEY (followed) REFERENCES users(id) \
    );')
    // create hashtag table
    const q6 = db.create_tables('CREATE TABLE IF NOT EXISTS post_to_hashtags ( \
      post_id VARCHAR(10), \
      hashtag_id VARCHAR(10), \
      FOREIGN KEY (post_id) REFERENCES posts(post_id), \
      FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) \
    );')
  await Promise.all([q1,q2,q3,q4,q5,q6]);
    
   
  dbaccess.close_db()

}

// Database connection setup
const db = dbaccess.get_db_connection();

var result =create_tables(dbaccess);
console.log('Tables created');


const PORT = config.serverPort;


