const express = require('express');
const { Kafka, CompressionTypes, CompressionCodecs } = require('kafkajs');
const SnappyCodec = require('kafkajs-snappy');
const config = require('./config.json');
const axios = require('axios');
const { TimeWeightedVectorStoreRetriever } = require('langchain/retrievers/time_weighted');


CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec; 

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

    const post = {
        username: 'hello',
        source_site: config.groupId,
        post_uuid_within_site: 'uuid_1234',
        post_text: 'code',
        content_type: 'text/plain'
    };

    const tweetData = {
        username: `TwitterUser-${authorId}`,
        parent_id: null,
        hashtags: hashtags,
        title: "Tweet",
        content: tweetText
    };

    console.log(`Received tweet from author ID ${tweet.author_id}: ${tweet.text}`);

    try {
        const response = await axios.post(`http://localhost:8080/createPost`, tweetData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });

        if (response.status === 201) {
            console.log('Post created successfully in the application.');
        } else {
            console.error('Failed to create post in the application.');
        }
    } catch (error) {
        console.error('Error creating post:', error);
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
                    compression: CompressionTypes.Snappy, 
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
