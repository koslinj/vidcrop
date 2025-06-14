const amqp = require('amqplib');
const Minio = require('minio');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');

// === CONFIG ===
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE = process.env.RABBITMQ_QUEUE;
const NOTIFICATION_QUEUE = process.env.RABBITMQ_NOTIF_QUEUE;
const BUCKET = process.env.MINIO_BUCKET;

const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// === UTILS ===
function cropVideoStream(inputStream, cropX, cropY, cropWidth, cropHeight) {
  const outputStream = new PassThrough();

  ffmpeg(inputStream)
  .inputFormat('mp4')
  .videoFilters(`crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`)
  .format('mp4')
  .outputOptions('-movflags frag_keyframe+empty_moov')
  .on('start', cmd => console.log('FFmpeg started:', cmd))
  .on('stderr', line => console.log('FFmpeg stderr:', line))
  .on('error', err => {
    console.error('FFmpeg error:', err.message);
    outputStream.destroy(err);
  })
  .on('end', () => {
    console.log('Video processing finished.');
  })
  .pipe(outputStream, { end: true });

  return outputStream;
}

async function processVideo(filename, cropX, cropY, cropWidth, cropHeight) {
  const croppedKey = `cropped/${filename}`;

  return new Promise((resolve, reject) => {
    minio.getObject(BUCKET, filename, (err, dataStream) => {
      if (err) return reject(err);

      const croppedStream = cropVideoStream(dataStream, cropX, cropY, cropWidth, cropHeight);

      minio.putObject(BUCKET, croppedKey, croppedStream, (err, etag) => {
        if (err) return reject(err);
        console.log(`Uploaded cropped video: ${croppedKey}`);
        resolve(croppedKey);
      });
    });
  });
}

// === MAIN ===
async function startWorker() {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });

  console.log(`Waiting for messages in queue: ${QUEUE}`);

  channel.consume(
    QUEUE,
    async (msg) => {
      if (!msg) return;

      const { filename, email, cropX, cropY, cropWidth, cropHeight } = JSON.parse(msg.content.toString());
      console.log(`Received file named: ${filename}`);

      try {
        const croppedKey = await processVideo(filename, cropX, cropY, cropWidth, cropHeight);

        const notificationMessage = {
          email: email,
          filename: croppedKey,
        };

        channel.sendToQueue(NOTIFICATION_QUEUE, Buffer.from(JSON.stringify(notificationMessage)));

        channel.ack(msg);
      } catch (err) {
        console.error('Failed to process video:', err.message);
        channel.nack(msg, false, false); // discard message (or change this logic)
      }
    },
    { noAck: false }
  );
}

startWorker().catch(console.error);
