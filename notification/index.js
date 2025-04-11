const amqp = require('amqplib');
const nodemailer = require('nodemailer');

// === CONFIG ===
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE = process.env.RABBITMQ_QUEUE;

// Email config (use env variables in real app!)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, text) {
  const info = await transporter.sendMail({
    from: "Video Processor <vidcrop.com>",
    to,
    subject,
    text,
  });

  console.log('Email sent:', info.messageId);
}

async function startNotificationWorker() {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  console.log(`Waiting for notifications on queue: ${QUEUE}`);

  channel.consume(
    QUEUE,
    async (msg) => {
      if (!msg) return;

      const data = JSON.parse(msg.content.toString());
      const { email, filename } = data;

      console.log(`Received notification task for: ${email}, file: ${filename}`);

      try {
        await sendEmail(
          email,
          'Your video has been processed!',
          `The video "${filename}" has been successfully processed and cropped.\n\n` +
          `Download it here: http://vidcrop.com/download/${encodeURIComponent(filename)}`
        );        
        channel.ack(msg);
        console.log(`Successfully sended mail for: ${email}, file: ${filename}`);
      } catch (err) {
        console.error('Failed to send email:', err.message);
        channel.nack(msg, false, false); // discard or retry later
      }
    },
    { noAck: false }
  );
}

startNotificationWorker().catch(console.error);
