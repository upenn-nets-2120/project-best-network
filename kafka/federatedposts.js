const config = require('./config.json');
const kafka = require('kafka-node');
const client = new kafka.KafkaClient({ kafkaHost: config.bootstrapServers.join(',') });
const { Producer } = kafka;
const producer = new Producer(client);


const Consumer = kafka.Consumer;
const consumer = new Consumer(
    client,
    [{ topic: config.topic, partition: 0 }],
    { groupId: config.groupId, autoCommit: true }
);


// Function to send a post
function sendPost(postData, imageData) {
    // Create a JSON string from the post data
    const postJson = JSON.stringify(postData);

    // Prepare the binary data for the image (if provided)
    const binaryData = imageData || null;

    // Create a message with both JSON and binary components
    const message = {
        topic: 'FederatedPosts',
        messages: [
            {
                key: 'post_json',
                value: postJson,
            },
            {
                key: 'attach',
                value: binaryData,
            }
        ]
    };

    // Send the message
    producer.send([message], (error, data) => {
        if (error) {
            console.error('Error sending post:', error);
        } else {
            console.log('Post sent successfully:', data);
        }
    });
}
