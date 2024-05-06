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
        const nconsts = topMatches[0].documents[0].map((document) => document.split('.')[0]);
        const actorQuery = `SELECT primaryName, nconst FROM actors WHERE nconst IN (${nconsts.map(() => '?').join(',')})`;
        const actorResults = await db.send_sql(actorQuery, nconsts);
        return res.status(200).json(actorResults);
    } catch (error) {
        console.error('Error getting actors:', error);
        return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
}

var set_actor = async function(req, res) {
    console.log("set_actor");
    console.log("why isnt this working");
    var username = req.session.username;
    const { actor } = req.body;
    if (username == null){
        return res.status(403).json({ error: 'Not logged in.' });
    }

    try {
        const updateQuery = `UPDATE users SET actor_nconst = '${actor}' WHERE id = '${req.session.user_id}';`;
        console.log(updateQuery);

        await db.send_sql(updateQuery);
        return res.status(200).json(actor);
    } catch (error) {
        console.error('Error setting actor:', error);
        return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }



}

var routes = {
    get_actors: get_actors,
    set_actor: set_actor
}

module.exports = routes;