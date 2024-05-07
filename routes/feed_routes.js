const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const helper = require('../routes/login_route_helper.js');
const s3Access = require('../models/s3_access.js'); 
const { uploadEmbeddingsForPost } = require('../routes/friend_routes_helper.js');
/*
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
*/
const { OpenAIEmbeddings } = require("@langchain/openai");
/*
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { Document } = require("@langchain/core/documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");

const { formatDocumentsAsString } = require("langchain/util/document");
const {
    RunnableSequence,
    RunnablePassthrough,
  } = require("@langchain/core/runnables");
 */ 
const { Chroma } = require("@langchain/community/vectorstores/chroma");

//const PORT = config.serverPort;
const db = dbsingleton;
db.get_db_connection();
const PORT = config.serverPort;

var getVectorStore = async function(req) {
    if (vectorStore == null) {
        const embeddings = new OpenAIEmbeddings({
          apiKey: process.env.OPENAI_API_KEY, // In Node.js defaults to process.env.OPENAI_API_KEY
          batchSize: 512, // Default value if omitted is 512. Max is 2048
          model: "text-embedding-3-small",
        });
        vectorStore = await Chroma.fromExistingCollection(embeddings, {
            collectionName: "posts_new",
            url: "http://localhost:8000", // Optional, will default to this value
            });
    }
    return vectorStore;
  }


  // GET /feed
  var feed = async function(req, res) {
    // Implementation to fetch feed data
    // Check if a user is logged in
    console.log(req.session.user_id);
    if (req.session.user_id === null) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    //  // Retrieve author_id based on username
    //  const authorQuery = `SELECT id FROM users WHERE username = ?`;
    //  const authorResult = await db.send_sql(authorQuery, [username]);

    //  // Check if the user exists
    //  if (authorResult.length === 0) {
    //      return res.status(404).json({ error: 'User not found.' });
    //  }

    //  // Extract the author_id
    //  const author_id = authorResult[0].id;

    try {
        // Query to get posts for the current user's feed
        // get the nconst id
        const getLinkedId = `SELECT * FROM users WHERE id = ${req.session.user_id}`;
        const users =await db.send_sql(getLinkedId);
        const user = users[0];
        const feedQuery = `
          SELECT outer_post.post_id AS post_id, users.username AS username, outer_post.parent_post AS parent_post, 
          outer_post.title AS title, outer_post.content AS content
          FROM posts AS outer_post
          INNER JOIN users ON outer_post.author_id = users.id
          WHERE outer_post.author_id IN (
              SELECT followed
              FROM friends
              WHERE follower = '${user.linked_id}'
          )
          OR outer_post.author_id = ${req.session.user_id}
          OR outer_post.post_id IN (
            SELECT post_to_hashtags.post_id
            FROM post_to_hashtags 
            INNER JOIN hashtagInterests ON hashtagInterests.hashtagID = post_to_hashtags.hashtag_id
            WHERE hashtagInterests.userID = outer_post.author_id
          )
          ORDER BY post_id DESC;
        `;
        const posts = await db.send_sql(feedQuery);

        // Return the feed posts
        return res.status(200).json({ results: posts });
    } catch (error) {
        // Handle database query errors
        console.error("Error querying database:", error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
    
  };

  // POST /createPost
  var createPost = async function(req, res) {
    // Check if a user is logged in
    if (req.session.user_id === null) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    // Extract post parameters from the request body
    const { title, content, parent_id, hashtags, username } = req.body;
    console.log('Request body:', req.body);
    console.log('Request files:', req.file);
    console.log(title);
    console.log(content);
    console.log(parent_id);
    console.log(hashtags);
    console.log(req.session.user_id);

    try {
        // Retrieve author_id based on username
        const authorQuery = `SELECT id FROM users WHERE username = ?`;
        const authorResult = await db.send_sql(authorQuery, [username]);

        // Check if the user exists
        if (authorResult.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Extract the author_id
        const author_id = authorResult[0].id;

        // Continue with the post creation process
        let insertQuery;
        if (parent_id === undefined) {
            // If parent_id is undefined, insert NULL for parent_post
            insertQuery = `
                INSERT INTO posts (title, content, parent_post, author_id, like_count)
                VALUES (?, ?, NULL, ?, 0)
            `;
            await db.send_sql(insertQuery, [title, content, author_id]);
        } else {
            // If parent_id is defined, include it in the query
            insertQuery = `
                INSERT INTO posts (title, content, parent_post, author_id, like_count)
                VALUES (?, ?, ?, ?, 0)
            `;
            await db.send_sql(insertQuery, [title, content, parent_id, author_id]);
        }

        // Retrieve the newly created post
        const lastPostQuery = `SELECT * FROM posts WHERE post_id = LAST_INSERT_ID()`;
        const last_post = await db.send_sql(lastPostQuery);
        const last_id = last_post[0].post_id;
        console.log(last_id);

        // Handle hashtags and create post-to-hashtag relationships
        for (const element of hashtags) {
            let hashtagQuery = `SELECT * FROM hashtags WHERE text = ?`;
            let hashtag_result = await db.send_sql(hashtagQuery, [element]);
            console.log(element);
            console.log(hashtag_result);

            if (hashtag_result.length > 0) {
                // Hashtag already exists, update its count and create relationship
                const hashtag_id = hashtag_result[0].id;
                let updateQuery = `UPDATE hashtags SET count = count + 1 WHERE id = ?`;
                await db.send_sql(updateQuery, [hashtag_id]);

                let insertQuery2 = `INSERT INTO post_to_hashtags (post_id, hashtag_id) VALUES (?, ?)`;
                await db.send_sql(insertQuery2, [last_id, hashtag_id]);
            } else {
                // Hashtag does not exist, insert it and create relationship
                let insertHashtagQuery = `INSERT INTO hashtags (text, count) VALUES (?, 1)`;
                const insert_hashtag_result = await db.send_sql(insertHashtagQuery, [element]);

                // Get the newly inserted hashtag's ID
                const hashtag_id = insert_hashtag_result.insertId;

                // Create post-to-hashtag relationship
                let insertQuery2 = `INSERT INTO post_to_hashtags (post_id, hashtag_id) VALUES (?, ?)`;
                await db.send_sql(insertQuery2, [last_id, hashtag_id]);
            }
        }
        // use hashtags to upload embeddings
        if (hashtags) {
          uploadEmbeddingsForPost(hashtags, author_id, last_id)
          .then((result) => {
            console.log(result);
            if(!result) {
              return res.status(500).json({ error: 'Error uploading embeddings.' });
            }
          })
          .catch((error) => {
            console.error(error);
            return res.status(500).json({ error: 'Error uploading embeddings.' });
          });
        }
      
        // Return successful response
        return res.status(201).json({ message: 'Post created.' });
    } catch (error) {
        // Handle database query errors
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

// POST /uploadPost
var uploadPost = async function(req, res) {
  //upload to s3
  //then reset in user db


  const userID = req.session.user_id;

  //TODO: set profile photo
  //https://github.com/upenn-nets-2120/homework-2-ms1-vavali08/blob/main/src/main/java/org/nets2120/imdbIndexer/S3Setup.java Reference - Note that this is Java
  const getLastPost = `SELECT * FROM posts WHERE author_id = '${userID}' ORDER BY post_id DESC;`;
  const last_post = await db.send_sql(getLastPost);
  const last_id = last_post[0].post_id;

  const post = req.file;
  const filenameWithExtension = req.file.originalname;
  const filenameWithoutExtension = filenameWithExtension.replace(/\.[^/.]+$/, '');

  console.log(post);

  if (!post) {
    return res.status(400).json({ error: 'No post uploaded.' });
  }
  if (!userID) {
     return res.status(403).json({ error: 'Not logged in.' });
  }

  try {
    await s3Access.put_by_key("best-network-nets212-sp24", "/posts/" + last_id, post.buffer, post.mimetype);
    // Get the photo URL from S3
    const photoURL = `https://best-network-nets212-sp24.s3.amazonaws.com//posts/${last_id}`

    // Update the user's profile photo URL in the database
    const pfpQuery = `UPDATE posts SET photo = '${photoURL}' WHERE post_id = '${last_id}';`;
    await db.send_sql(pfpQuery);

    // upload to chromaDB collection


  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error uploading photo.' });
  }

};

// POST /like
var sendLike = async function(req, res) {
  const { post_id } = req.body;
  
  // Check if postID is provided
  if (post_id === undefined) {
      return res.status(400).json({ error: 'postID is required.' });
  }

  // Check if postID is an integer
  if (isNaN(post_id)) {
      return res.status(400).json({ error: 'postID must be an integer.' });
  }

  // Check if the user is logged in
  if (req.session.user_id === undefined) {
      return res.status(400).json({ error: 'Not logged in.' });
  }

  try {
      // Check if the user has already liked the post
      const checkLikeQuery = `
          SELECT *
          FROM likeToPost
          WHERE userID = ${req.session.user_id} AND postID = ${post_id}
      `;
      const likeResult = await db.send_sql(checkLikeQuery);

      // If the user has already liked the post, return an error
      if (likeResult.length > 0) {
          return res.status(400).json({ error: 'You have already liked this post.' });
      }

      // Insert the like into the likeToPost table
      const insertQuery = `
        INSERT INTO likeToPost (userID, postID)
        VALUES (${req.session.user_id}, ${post_id})
      `;
      await db.send_sql(insertQuery);

      // Increment the like_count in the posts table
      const updateLikeQuery = `
          UPDATE posts
          SET like_count = like_count + 1
          WHERE post_id = ${post_id}
      `;
      await db.send_sql(updateLikeQuery);

      return res.status(201).json({ message: 'Like sent successfully.' });
  } catch (error) {
      console.error("Error querying database:", error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
};
// GET /getComments
var getComments = async function(req, res) {
  try {
      // Extract the post_id from the query parameters
      const { post_id } = req.query;

      // Convert post_id to an integer to prevent SQL injection
      const postId = parseInt(post_id, 10);
      if (isNaN(postId)) {
          return res.status(400).json({ error: 'Invalid post_id.' });
      }

      // Query the database for comments and their associated usernames
      const commentQuery = `
          SELECT p.*, u.username
          FROM posts p
          JOIN users u ON p.author_id = u.id
          WHERE p.parent_post = ?
      `;
      const comments = await db.send_sql(commentQuery, [postId]);

      return res.status(200).json({ results: comments });
  } catch (error) {
      console.error("Error querying database for comments:", error);
      return res.status(500).json({ error: 'Error querying database.' });
  }
};



var createTweet = async function(req, res) {
    // Check if a user is logged in
    /*
    if (req.session.user_id === null) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
  */
  
    // Extract post parameters from the request body
    const { id, text, created_at, conversation_id, hashtags, author_id,
      quoted_tweet_id, replied_to_tweet_id, quotes, urls, replies,
       mentions, retweets, retweet_id, likes } = req.body;
  
  
    try {
        // Retrieve author_id based on username
      // Insert the tweet data into your database table
      const insertQuery = `
      INSERT INTO tweets (quoted_tweet_id, hashtags, created_at, replied_to_tweet_id, quotes, urls, replies, conversation_id, mentions, id, text, author_id, retweets, retweet_id, likes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  // Check if mentions is empty and replace it with NULL
  const mentionsValue = mentions.length > 0 ? mentions : null;
  
  // Pass the updated values to the database query
  await db.send_sql(insertQuery, [quoted_tweet_id, hashtags, new Date(created_at), replied_to_tweet_id, quotes, urls, replies, conversation_id, mentionsValue, id, text, author_id, retweets, retweet_id, likes]);
        // Return successful response
        return res.status(201).json({ message: 'tweet added.' });
    } catch (error) {
        // Handle database query errors
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database for tweet.' });
    }
  };
  
  var getPost = async function(req, res) {
    const vs = await getVectorStore();
    const retriever = vs.asRetriever();
    console.log(req.body)
    const { context, question } = req.body;
    if (!context || !question) {
        console.log(question)
        console.log(context)
    }
    //console.log(process.env.OPENAI_API_KEY)
    const prompt =
    PromptTemplate.fromTemplate(`Given: ${context}, answer: ${question}`);
    const llm = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-3.5-turbo" 
    });
  
    const ragChain = RunnableSequence.from([
        {
            context: retriever.pipe(formatDocumentsAsString),
            question: new RunnablePassthrough(),
          },
      prompt,
      llm,
      new StringOutputParser(),
    ]);
  
    result = await ragChain.invoke(req.body.question);
    console.log(result);
    res.status(200).json({message:result});
  }

  
  var routes = { 
    create_post: createPost,
    create_tweet: createTweet,
    get_feed: feed,
    upload_post: uploadPost,
    send_like: sendLike,
    get_comments: getComments
  };
  
  module.exports = routes;