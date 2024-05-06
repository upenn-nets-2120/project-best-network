const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const process = require('process');
const s3Access = require('../models/s3_access.js'); 
const { findTopKMatches } = require('../face-matching/app.js'); 
const { ChromaClient } = require("chromadb");
const { client, collection } = require('../face-matching/app.js'); 





// Database connection setup
const db = dbsingleton;
db.get_db_connection();
const PORT = config.serverPort;


async function initializeAndFindTopKMatches(s3Url) {
    try {
        const client = new ChromaClient();
        const collection = await client.getOrCreateCollection({
            name: "face-api-2",
            embeddingFunction: null,
            metadata: { "hnsw:space": "l2" },
        });
        //await initializeFaceModels();
        
        /**
         

        // Check if the indexing process has completed
        const indexingPromises = [];
        fs.readdir("images", function (err, files) {
            if (err) {
                console.error("Could not list the directory.", err);
                process.exit(1);
            }
            files.forEach(function (file, index) {
                indexingPromises.push(indexAllFaces(path.join("images", file), file, collection));
            });
        });
        await Promise.all(indexingPromises);
        */

        // Once indexing is complete, proceed with querying
        const topMatches = await findTopKMatches(collection, s3Url, 5);
        
        return topMatches;
    } catch (error) {
        console.error('Error initializing and finding top k matches:', error);
        throw error;
    }
}



var get_actors = async function(req, res) {

    var username = req.session.username;
    if (username == null){
        return res.status(403).json({ error: 'Not logged in.' });
    }

    try {
        var query = `SELECT profilePhoto FROM users WHERE username = '${username}'`;

        var result = await db.send_sql(query);
        if (result.length < 1) {
            return res.status(409).json({ error: 'Account not found' });
        }
        var info = result[0];

        console.log(info);
        if (!info || info.profilePhoto == null) {
            return res.status(404).json({ error: 'No profile photo' });
        }
    } catch (error) {
        console.error('Error getting actors:', error);
        return res.status(500).json({ error: 'Error querying databse' }); 
    }

    try {
        // Call initializeAndFindTopKMatches function
        const topMatches = await initializeAndFindTopKMatches(info.profilePhoto);
        return res.status(200).json(topMatches);
    } catch (error) {
        console.error('Error getting actors:', error);
        return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
}

var set_actor = async function(req, res) {

}

var routes = {
    get_actors: get_actors,
    set_actor: set_actor
}

module.exports = routes;