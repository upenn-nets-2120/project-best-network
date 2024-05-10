const express = require('express');
const { Kafka } = require('kafkajs');
const config = require('./config.json');
const axios = require('axios'); 

// Kafka setup
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers,
});

// Consumer setup
const consumer = kafka.consumer({
    groupId: config.groupId,
    bootstrapServers: config.bootstrapServers
});

// CONSUMER CODE
// Connect and subscribe to the topic
const runConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'FederatedPosts', fromBeginning: true });

    // Hooking callback handler to the consumer
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                // Parse the JSON message
                const jsonMessage = JSON.parse(message.value.toString());

                // Extract post details
                const username = jsonMessage.username;
                const source_site = jsonMessage.source_site;
                const post_uuid_within_site = jsonMessage.post_uuid_within_site;
                const post_text = jsonMessage.post_text;
                const content_type = jsonMessage.content_type;
            
                // Call handle to log what to do with the posts
                handleIncomingPost(username, source_site, post_uuid_within_site, post_text, content_type);
            } catch (error) {
                console.error('Failed to process message:', error);
            }
        },
    });
};
// Define handler for processing incoming federated posts
const handleIncomingPost = async (username, source_site, post_uuid_within_site, post_text, content_type) => {
    // Define the format for the federated username
    const federatedUsername = `${source_site}-${username}`;
    console.log(federatedUsername); 

    // Check if the user exists in system 
    let userExists = false;

    try {
        const checkRegistrationResponse = await axios.get(
            `http://localhost:8080/checkRegistration`,
            {
                params: {
                    federatedUsername: federatedUsername, 
                },
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true, 
            }
        );
        userExists = Boolean(checkRegistrationResponse.data.registered);
    } catch (error) {
        console.error('Failed to check user registration:', error);
        return;
    }    

    // If the user does not exist, register a new user
    if (!userExists) {
        try {
            // Define the user registration data - filled with dummy variables 
            const registrationData = {
                username: federatedUsername,
                password: 'default_password',
                firstName: 'Default',
                lastName: 'User',
                email: `${federatedUsername}@example.com`,
                birthday: '2000-01-01', 
                affiliation: 'None',
                hashtagInterests: [] 
            };

            // Call the /register route to create a new user
            const registerResponse = await axios.post('http://localhost:8080/register', registrationData);
            console.log('User registered successfully:', registerResponse.data);
        } catch (error) {
            console.error('Failed to register user:', error);
            return; 
        }
    }

    // Extract hashtags from the post text
    const hashtags = extractHashtags(post_text);

    // Define the post data for the /createPost route
    const postData = {
        title: 'Federated Post', 
        content: post_text,
        parent_id: null, 
        hashtags: hashtags,
        username: federatedUsername
    };

    try {
        // Call the /createPost route to create a new post
        const createPostResponse = await axios.post(`http://localhost:8080/${federatedUsername}/createPost`, postData);
        console.log(`Post created successfully for user ${federatedUsername}:`, createPostResponse.data);
    } catch (error) {
        console.error(`Failed to create post for user ${federatedUsername}:`, error);
    }

    // Log the incoming post details
    console.log(`Received post from ${username} on site ${source_site}: ${post_text}`);
    console.log(`Post details - UUID: ${post_uuid_within_site}, Content Type: ${content_type}`);
};

// Helper to extract hashtags from text
const extractHashtags = (text) => {
    const regex = /#\w+/g; // Matches words starting with '#'
    const hashtags = text.match(regex);
    return hashtags ? hashtags.map(tag => tag.slice(1)) : [];
};

runConsumer().catch(console.error);

// PRODUCER CODE

// Producer setup
const producer = kafka.producer();

// Example of sending a federated post
const sendFederatedPost = async (post) => {
    const jsonMessage = JSON.stringify(post);

    await producer.send({
        topic: 'FederatedPosts',
        messages: [{ value: jsonMessage }]
    });
};

// Run the producer (you can add your own logic to trigger it when needed)
const runProducer = async () => {
    await producer.connect();

    // Example post structure
    const post = {
        username: 'hello',
        source_site: config.groupId,
        post_uuid_within_site: 'uuid_1234',
        post_text: 'code',
        content_type: 'text/plain'
    };

    // Send a federated post
    await sendFederatedPost(post);
};

// Run the producer if needed (e.g., for testing)
runProducer().catch(console.error);

// Express server for other functionality
const app = express();
app.listen(config.port, () => {
    console.log(`Server is listening on port ${config.port}`);
});

// Export the sendFederatedPost function
module.exports = {
    sendFederatedPost
};
