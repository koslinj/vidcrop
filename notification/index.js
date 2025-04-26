const amqp = require('amqplib');
const { Resend } = require('resend');

// === CONFIG ===
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE = process.env.RABBITMQ_QUEUE;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// === Initialize Resend ===
const resend = new Resend(RESEND_API_KEY);

async function sendEmail(to, subject, text) {
  const result = await resend.emails.send({
    from: 'Video Processor <onboarding@resend.dev>', // or your verified domain sender
    to,
    subject,
    text,
  });

  console.log('Email sent:', result);
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
          `Download it here: http://vidcrop.com:8080/download/${encodeURIComponent(filename)}`
        );
        channel.ack(msg);
        console.log(`Successfully sent mail to: ${email}, file: ${filename}`);
      } catch (err) {
        console.error('Failed to send email:', err.message);
        channel.nack(msg, false, false); // discard or retry later
      }
    },
    { noAck: false }
  );
}

startNotificationWorker().catch(console.error);
