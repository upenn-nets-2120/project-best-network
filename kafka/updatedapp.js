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

// PRODUCER CODE
const producer = kafka.producer();


// Run the producer
const runProducer = async () => {
    await producer.connect();
    
    try {
        const username = 'testuser';
        const source_site = 'g13';
        const post_uuid_within_site = 'dummyUUID';
        const post_text = 'This is a dummy post text';
        const content_type = 'text/plain';
        const attach = '<img src="dummyImage.jpg" alt="Dummy Image" />';
    
        await sendFederatedPost(username, source_site, post_uuid_within_site, post_text, content_type, attach);
        console.log('Dummy post sent successfully!');
      } catch (error) {
        console.error('Error creating dummy post:', error);
      }
}

const sendFederatedPost = async (username, source_site, post_uuid_within_site, post_text, content_type, attach) => {
    console.log("entered federated post producer section"); 

    const post = {
        username,
        source_site,
        post_uuid_within_site,
        post_text,
        content_type,
        attach
    };

    const jsonMessage = JSON.stringify(post);
    console.log(jsonMessage); 

    // send json to kafka
    await producer.send({
        topic: 'FederatedPosts',
        messages: [{ value: jsonMessage }]
    });
};


runProducer().catch(console.error);

// CONSUMER CODE
// Connect to consumer
const consumer = kafka.consumer({
    groupId: config.groupId,
    bootstrapServers: config.bootstrapServers
});

const handleMessage = async ({ topic, partition, message }) => {
    const value = message.value.toString();
    let parsedMessage;

    // Check if the value is a valid JSON string
    try {
        parsedMessage = JSON.parse(value);
    } catch (error) {
        console.error(`Message is not a JSON: ${error}`);
        return;
    }

    // Check the topic of the message to call the appropriate handler function!
    if (topic === 'FederatedPosts') {
        await handleFederatedPost(parsedMessage.username, parsedMessage.source_site, parsedMessage.post_uuid_within_site, parsedMessage.post_text, parsedMessage.content_type, parsedMessage.attach);
    } else if (topic === 'Twitter-Kafka') {
        await handleIncomingTweet(parsedMessage);
    } else {
        console.error(`Received message from unknown topic: ${topic}`);
    }
};


const runConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'FederatedPosts', fromBeginning: true });
    await consumer.subscribe({ topic: 'Twitter-Kafka', fromBeginning: true });

    await consumer.run({
        eachMessage: handleMessage,
    });
};

// Helper function to extract hashtags from text
const extractHashtags = (text) => {
    if (text !== undefined) {
        const regex = /#\w+/g; 
        const hashtags = text.match(regex);
        return hashtags ? hashtags.map(tag => tag.slice(1)) : [];
    } else {
        return [];
    }
};

// Handler for processing incoming federated posts
const handleFederatedPost = async (username, source_site, post_uuid_within_site, post_text, content_type, attach) => {
    const federatedUsername = `${source_site}-${username}`;

    // Check if the user exists in the system
    let userExists = false;

    try {
        const checkRegistrationResponse = await axios.get(
            `${config.ec2}:8080/checkRegistration`,
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

            // create new user
            const registerResponse = await axios.post(`${config.ec2}:8080/register`, registrationData);
            console.log('User registered successfully:', registerResponse.data);
        } catch (error) {
            console.error('Failed to register user:', error);
            return;
        }
    }

    let hashtags = [];
    if (post_text != undefined) {
        hashtags = extractHashtags(post_text);
    }

    console.log("attach 2", attach); 

    // Define the post data or the /createPost route
    const postData = {
        title: 'Federated Post',
        content: post_text,
        parent_id: null,
        hashtags: hashtags,
        username: federatedUsername,
        attach: attach,
        uuid: post_uuid_within_site,
        content_type: 'text/html'
    };
    let createPostResponse;
    try {
        // create new post
        createPostResponse = await axios.post(`${config.ec2}:8080/${federatedUsername}/createPost`, postData);
        console.log(`Post created successfully for user ${federatedUsername}:`, createPostResponse.data);
    } catch (error) {
        console.error(`Failed to create post for user ${federatedUsername}:`, error);
    }

    const postId = createPostResponse.data.post_id;

    // log for debugging
    console.log(`Received post from ${username} on site ${source_site}: ${post_text}`);
    console.log(`Post details - UUID: ${post_uuid_within_site}, Content Type: ${content_type}`);
    console.log("Attach", attach); 

    if (attach != undefined || attach != null || attach != "") {
        try {
            console.log("should be in the uploadPostfromHTML now")
            // upload image from attach
            const uploadResponse = await axios.post(`${config.ec2}:8080/${username}/uploadPostFromHTML`, { attach, post_id: postId });
            console.log('Image uploaded successfully:', uploadResponse.data);
        } catch (error) {
            console.error('Error uploading image:', error.response ? error.response.data : error.message);
        }
    }    
};


// process tweets
const handleIncomingTweet = async (tweet) => {
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

    // check if user exists
    let userExists = false;

    try {
        const checkRegistrationResponse = await axios.get(
            `${config.ec2}:8080/checkRegistration`,
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

            // create new user
            const registerResponse = await axios.post(`${config.ec2}/register`, registrationData);
            console.log('User registered successfully:', registerResponse.data);
        } catch (error) {
            console.error('Failed to register user:', error);
            return;
        }
    }

    // tweet
    const tweetData = {
        username: federatedUsername,
        parent_id: null,
        hashtags: hashtags,
        title: 'Tweet',
        content: tweetText,
    };

    console.log(`Received tweet from author ID ${tweet.author_id}: ${tweet.text}`);

    try {
        // create post with tweet data
        const url = `${config.ec2}:8080/${federatedUsername}/createPost`;
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
            console.error(`Server responded with status code: ${error.response.status}`);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received from server:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
    }
};

const startConsumers = async () => {
    try {
        await runConsumer();
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
