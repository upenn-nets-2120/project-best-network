const express = require('express');
const { Kafka, CompressionTypes } = require('kafkajs');
const SnappyCodec = require('kafkajs-snappy'); // Import Snappy codec
const config = require('./config.json');
const axios = require('axios');

// Kafka setup with Snappy codec
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers,
    compressionCodecs: {
        [CompressionTypes.Snappy]: SnappyCodec,
    },
});

// Consumer setup
const consumer = kafka.consumer({
    groupId: config.groupId,
    brokers: config.bootstrapServers,
});

// Connect and subscribe to the "Twitter-Kafka" topic
const runConsumer = async () => {
    await consumer.connect();
    console.log('Subscribing to topic: Twitter-Kafka');
    await consumer.subscribe({ topic: 'Twitter-Kafka', fromBeginning: true });

    // Hooking your custom callback handler to the consumer
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const tweet = JSON.parse(message.value.toString());

                // Call existing handler to process the tweet
                handleIncomingTweet(tweet);
            } catch (error) {
                console.error('Failed to process message:', error);
            }
        },
    });
};

// Define your handler for processing incoming tweets
const handleIncomingTweet = async (tweet) => {
    // Extract necessary fields from the tweet
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

    const tweetData = {
        id: tweetId,
        text: tweetText,
        created_at: created_at,
        conversation_id: conversation_id,
        author_id: authorId,
        quoted_tweet_id: quoted_tweet_id,
        replied_to_tweet_id: replied_to_tweet_id,
        quotes: quotes,
        urls: urls,
        replies: replies,
        hashtags: hashtags,
        mentions: mentions,
        retweets: retweets,
        retweet_id: retweet_id,
        likes: likes,
    };

    console.log(`Received tweet from author ID ${tweet.author_id}: ${tweet.text}`);

    try {
        // create Tweet
        const response = await axios.post('http://localhost:8080/createTweet', tweetData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });

        if (response.status === 201) {
            console.log('Tweet created successfully in the application.');
        } else {
            console.error('Failed to create tweet in the application.');
        }
    } catch (error) {
        console.error('Error creating tweet:', error);
    }
};

// Start the consumer
runConsumer().catch(console.error);

// Producer setup
const producer = kafka.producer();

const sendTweet = async (tweet) => {
    try {
        const tweetJson = JSON.stringify(tweet);

        await producer.send({
            topic: 'Twitter-Kafka',
            messages: [
                {
                    value: tweetJson,
                    compression: CompressionTypes.Snappy, // Use Snappy compression
                },
            ],
        });

        console.log(`Tweet sent successfully to the "Twitter-Kafka" topic: ${tweetJson}`);
    } catch (error) {
        console.error('Error sending tweet:', error);
    }
};

// Run the producer
const runProducer = async () => {
    await producer.connect();

    // Example tweet structure
    const tweet = {
        quoted_tweet_id: null,
        hashtags: ['jokermovie'],
        created_at: 1712712180000,
        replied_to_tweet_id: null,
        quotes: 6,
        urls: 'https://twitter.com/IMDb/status/1777869861886009497/video/1',
        replies: 25,
        conversation_id: 1777869861886009497,
        mentions: ['jokermovie'],
        id: 1777869861886009497,
        text: 'Together at last. @jokermovie: Folie à Deux – only in theaters October 4. #jokermovie https://t.co/wP17WQIFHn',
        author_id: 17602896,
        retweets: 62,
        retweet_id: null,
        likes: 263,
    };

    // Send the example tweet from Ed
    await sendTweet(tweet);
};

runProducer().catch(console.error);

// Express server for other functionality
const app = express();
app.listen(config.port, () => {
    console.log(`Server is listening on port ${config.port}`);
});
