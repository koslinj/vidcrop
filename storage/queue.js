const amqp = require("amqplib");

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = process.env.QUEUE_NAME;

let channel;

async function connectRabbitMQ() {
  const connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  console.log("✅ Connected to RabbitMQ and queue asserted");
}

function sendToQueue(message) {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
}

module.exports = {
  connectRabbitMQ,
  sendToQueue,
};