const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); 
const process = require('process');
const s3Access = require('../models/s3_access.js'); 
const { sendFederatedPost } = require('../kafka/newapp.js'); 

const handleFederatedPost = async (req, res) => {
    try {
        // Extract required data from the request body
        const { username, source_site, post_uuid_within_site, post_text, content_type } = req.body;

        // Call the sendFederatedPost function
        await sendFederatedPost({
            username,
            source_site,
            post_uuid_within_site,
            post_text,
            content_type
        });

        // Send a success response
        res.status(200).json({ message: 'Federated post sent successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error sending federated post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

var routes = { 
    create_federated_post: handleFederatedPost,
};

module.exports = routes;