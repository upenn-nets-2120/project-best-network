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
                id INT PRIMARY KEY,
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
        FOREIGN KEY (userID) REFERENCES users(id)
    )
    
    `)



  const q4 = db.create_tables(`
  CREATE TABLE IF NOT EXISTS chatRooms (
    roomID INT AUTO_INCREMENT PRIMARY KEY
  );`)

  const q5 = db.create_tables(`
  CREATE TABLE IF NOT EXISTS chatRoomUsers (
    roomID INT,
    userID INT,
    PRIMARY KEY (roomID, userID),
    FOREIGN KEY (roomID) REFERENCES chatRooms(roomID),
    FOREIGN KEY (userID) REFERENCES users(id)
  );`)

 
  const q6 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS chatRoomMessages (
      messageID INT AUTO_INCREMENT PRIMARY KEY,
      roomID INT,
      textMessage TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (roomID) REFERENCES chatRooms(roomID)
    );`)

  //   const q7 = db.send_sql(`
  //   DROP TABLE IF EXISTS chatRoomMessages, chatRoomUsers, chatRooms;
  // `);


  await Promise.all([q1,q2,q3, q4, q5, q6 ]);
    
   
  dbaccess.close_db()

}

// Database connection setup
const db = dbaccess.get_db_connection();

var result =create_tables(dbaccess);
console.log('Tables created');


const PORT = config.serverPort;


