const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); 
const process = require('process');
const s3Access = require('../models/s3_access.js'); 
const { sendFederatedPost } = require('../kafka/updatedapp.js'); 

const handleFederatedPost = async (req, res) => {
    try {
        const { username, source_site, post_uuid_within_site, post_text, content_type, attach } = req.body;

        console.log("entered the federatedpost section");
        console.log("attach", attach); 

        await sendFederatedPost({
            username,
            source_site,
            post_uuid_within_site,
            post_text,
            content_type,
            attach
        });

        
        res.status(200).json({ message: 'Federated post sent successfully' });
    } catch (error) {
        console.error('Error sending federated post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

var routes = { 
    create_federated_post: handleFederatedPost,
};

module.exports = routes;