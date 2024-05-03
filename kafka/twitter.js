const express = require('express');
const { Kafka } = require('kafkajs');
const config = require('./config.json');

// Kafka setup
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers
});

// consumer code
const consumer = kafka.consumer({
    groupId: config.groupId,
    bootstrapServers: config.bootstrapServers
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
const handleIncomingTweet = (tweet) => {
    // Extract necessary fields from the tweet
    const tweetId = tweet.id;
    const authorId = tweet.author_id;
    const tweetText = tweet.text;
    const hashtags = tweet.hashtags || [];

    // need to add logic to handle the tweet itself 

    // Log the incoming tweet for reference
    console.log(`Received tweet from author ID ${authorId}: ${tweetText}`);
};

// Start the consumer
runConsumer().catch(console.error);


// producer code 
const producer = kafka.producer();

const sendTweet = async (tweet) => {
    try {
        const tweetJson = JSON.stringify(tweet);

        await producer.send({
            topic: 'Twitter-Kafka',
            messages: [
                {
                    value: tweetJson,
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
        likes: 263
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
