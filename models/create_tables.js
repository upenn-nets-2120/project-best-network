const dbaccess = require('./db_access');
const config = require('../config.json'); // Load configuration
const fs = require('fs');
const csv = require('csv-parser');

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
                id INT AUTO_INCREMENT PRIMARY KEY,
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
      message TEXT,
      userID INT,
      timestamp DATETIME,
      FOREIGN KEY (roomID) REFERENCES chatRooms(roomID),
      FOREIGN KEY (userID) REFERENCES users(id)
    );`)
      // TODO: create posts table
      const q7 = db.create_tables('CREATE TABLE IF NOT EXISTS posts( \
        post_id INT AUTO_INCREMENT NOT NULL, \
        parent_post INT, \
        title VARCHAR(255), \
        content VARCHAR(255), \
        author_id INT, \
        like_count INT, \
        photo VARCHAR(255), \
        uuid VARCHAR(255), \
        FOREIGN KEY (parent_post) REFERENCES posts(post_id), \
        FOREIGN KEY (author_id) REFERENCES users(id), \
        PRIMARY KEY (post_id) \
      );');
    // create friends tables
    const q8 = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
      followed INT, \
      follower INT, \
      FOREIGN KEY (follower) REFERENCES users(id), \
      FOREIGN KEY (followed) REFERENCES users(id) \
    );')

    // create hashtag table
    const q9 = db.create_tables('CREATE TABLE IF NOT EXISTS post_to_hashtags ( \
      post_id INT, \
      hashtag_id INT, \
      FOREIGN KEY (post_id) REFERENCES posts(post_id), \
      FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) \
    );')
    const q10 = db. create_tables(`
      CREATE TABLE IF NOT EXISTS likeToPost ( \
        userID INT, \
        postID INT, \
        FOREIGN KEY (userID) REFERENCES users(id), \
        FOREIGN KEY (postID) REFERENCES posts(post_id) \
      );
      `)
    const q11 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS tweets ( \
      id BIGINT PRIMARY KEY, \
      created_at DATETIME, \
      text TEXT, \
      author_id BIGINT, \
      quoted_tweet_id BIGINT, \
      replied_to_tweet_id BIGINT, \
      quotes INT, \
      urls TEXT, \
      replies INT, \
      conversation_id BIGINT, \
      retweets INT, \
      retweet_id BIGINT, \
      likes INT, \
      hashtags TEXT, \
      mentions TEXT  \
    );
    `)

  const q10 = db. create_tables(`
    CREATE TABLE IF NOT EXISTS likeToPost ( \
      userID INT, \
      postID INT, \
      FOREIGN KEY (userID) REFERENCES users(id), \
      FOREIGN KEY (postID) REFERENCES posts(post_id) \
    );
    `)
  const q11 = db.create_tables(`
  CREATE TABLE IF NOT EXISTS tweets ( \
    id BIGINT PRIMARY KEY, \
    created_at DATETIME, \
    text TEXT, \
    author_id BIGINT, \
    quoted_tweet_id BIGINT, \
    replied_to_tweet_id BIGINT, \
    quotes INT, \
    urls TEXT, \
    replies INT, \
    conversation_id BIGINT, \
    retweets INT, \
    retweet_id BIGINT, \
    likes INT, \
    hashtags TEXT, \
    mentions TEXT  \
);
`)

    const q12 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS actors (
      primaryName VARCHAR(255),
      birthYear VARCHAR(10),
      deathYear VARCHAR(10),
      nconst VARCHAR(10),
      nconst_short VARCHAR(10)
     );
    `)
  //   const q7 = db.send_sql(`
  //   DROP TABLE IF EXISTS chatRoomMessages, chatRoomUsers, chatRooms;
  // `);


  await Promise.all([q1,q2,q3, q4, q5, q6, q7, q8, q9, q10, q11, q12]);
    
   
  //dbaccess.close_db()

}


async function populateActorsTable() {
  try {
      // Get a database connection
      const connection = await dbaccess.get_db_connection();

      // Read the CSV file and insert data into the "actors" table
      fs.createReadStream('./face-matching/names.csv')
          .pipe(csv())
          .on('data', async (row) => {
              try {
                  // Check if the actor already exists in the database
                  const existingActor = await dbaccess.send_sql('SELECT * FROM actors WHERE nconst = ?', [row.nconst]);

                  if (existingActor.length === 0) {
                      // If the actor does not exist, insert the new record
                      const query = 'INSERT INTO actors (primaryName, birthYear, deathYear, nconst, nconst_short) VALUES (?, ?, ?, ?, ?)';
                      const params = [row.primaryName, row.birthYear, row.deathYear, row.nconst, row.nconst_short];

                      // Execute the SQL query asynchronously
                      await dbaccess.send_sql(query, params);
                  } else {
                      console.log(`Actor with nconst ${row.nconst} already exists. Skipping insertion.`);
                  }
              } catch (error) {
                  console.error('Error inserting row:', error);
              }
          })
          .on('end', () => {
              console.log('Data inserted into the "actors" table.');
              // Close the database connection
              dbaccess.close_db();
          });
  } catch (error) {
      console.error('Error:', error);
  }
}


// Database connection setup
const db = dbaccess.get_db_connection();

var result =create_tables(dbaccess)
  .then(() => {
    // Once tables are created, populate the "actors" table
    populateActorsTable(dbaccess);
    dbaccess.close_db;
  })
  .catch((error) => {
    console.error('Error creating tables:', error);
  });
console.log('Tables created');


const PORT = config.serverPort;


