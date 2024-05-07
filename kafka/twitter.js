const express = require('express');
const { Kafka, CompressionTypes, CompressionCodecs } = require('kafkajs');
const SnappyCodec = require('kafkajs-snappy');
const config = require('./config.json');
const axios = require('axios');

// Setting up Snappy compression codec
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

// Kafka setup
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers,
    compressionCodecs: {
        [CompressionTypes.Snappy]: SnappyCodec,
    },
});

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

// CONSUMER CODE
// Connect to consumer
const consumer = kafka.consumer({
    groupId: config.groupId,
    bootstrapServers: config.bootstrapServers
});


const runConsumer = async (consumer) => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'FederatedPosts', fromBeginning: true });
    await consumer.subscribe({ topic: 'Twitter-Kafka', fromBeginning: true });

    await consumer.run({
        eachMessage: handleMessage,
    });
};


// Helper function to extract hashtags from text
const extractHashtags = (text) => {
    const regex = /#\w+/g; 
    const hashtags = text.match(regex);
    return hashtags ? hashtags.map(tag => tag.slice(1)) : [];
};

// Handler for processing incoming federated posts
const handleIncomingPost = async (username, source_site, post_uuid_within_site, post_text, content_type) => {
    // Define the format for the federated username
    const federatedUsername = `${source_site}-${username}`;
    console.log(federatedUsername);

    // Check if the user exists in the system
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
                hashtagInterests: [],
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
        username: federatedUsername,
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

// Handler for processing incoming tweets
const handleIncomingTweet = async (tweet) => {
    // Extract fields from the tweet
    const tweetId = tweet.id;
    const authorId = tweet.author_id;
    const tweetText = tweet.text;
    const hashtags = tweet.hashtags || [];
    const created_at = tweet.created_at;
    const conversation_id = tweet.conversation_id;
    const quoted_tweet_id = tweet.quoted_tweet_id;
    const quotes = tweet.quotes;
    const urls = tweet.urls;
    const replies = tweet.replies;
    const replied_to_tweet_id = tweet.replied_to_tweet_id;
    const mentions = tweet.mentions;
    const retweets = tweet.retweets;
    const retweet_id = tweet.retweet_id;
    const likes = tweet.likes;

    const federatedUsername = `TwitterUser-${authorId}`;
    console.log(federatedUsername);

    // Check if the user exists in the system
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
                hashtagInterests: [],
            };

            // Call the /register route to create a new user
            const registerResponse = await axios.post('http://localhost:8080/register', registrationData);
            console.log('User registered successfully:', registerResponse.data);
        } catch (error) {
            console.error('Failed to register user:', error);
            return;
        }
    }

    // Define the tweet data
    const tweetData = {
        username: federatedUsername,
        parent_id: null,
        hashtags: hashtags,
        title: 'Tweet',
        content: tweetText,
    };

    console.log(`Received tweet from author ID ${tweet.author_id}: ${tweet.text}`);

    try {
        // Call the /createPost route to create a new post with tweet data
        const url = `http://localhost:8080/${federatedUsername}/createPost`;
        const response = await axios.post(url, tweetData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });

        if (response.status === 201) {
            console.log('Post created successfully :)');
        } else {
            console.error(`Failed to create post in the application. Status code: ${response.status}`);
        }
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code outside of the range of 2xx
            console.error(`Server responded with status code: ${error.response.status}`);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from server:', error.request);
        } else {
            // Something happened in setting up the request that triggered an error
            console.error('Error setting up request:', error.message);
        }
    }
};

// Start both consumers
const startConsumers = async () => {
    try {
        await Promise.all([runConsumer()]);
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
};

startConsumers().catch(console.error);

const app = express();
app.listen(config.port, () => {
    console.log(`Server is listening on port ${config.port}`);
});

module.exports = {
    sendFederatedPost,
};
