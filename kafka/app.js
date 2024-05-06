///////////////
// NETS 2120 Sample Kafka Client
///////////////

const express = require('express');
const { Kafka } = require('kafkajs');

var config = require('./config.json');

const app = express();
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers
});

const consumer = kafka.consumer({ 
    groupId: config.groupId, 
    bootstrapServers: config.bootstrapServers});

var kafka_messages = [];

app.get('/', (req, res) => {
    res.send(JSON.stringify(kafka_messages));
});

const run = async () => {
    // Consuming
    await consumer.connect();
    console.log(`Following topic ${config.topic}`);
    await consumer.subscribe({ topic: config.topic, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            kafka_messages.push({
                value: message.value.toString(),
            });
            console.log({
                value: message.value.toString(),
            });
        },
    });
};

run().catch(console.error);

app.listen(config.port, () => {
    console.log(`App is listening on port ${config.port} -- you can GET the Kafka messages`);
});