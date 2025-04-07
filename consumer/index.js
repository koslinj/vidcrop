const amqp = require('amqplib');
const Minio = require('minio');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');

// === CONFIG ===
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE = process.env.RABBITMQ_QUEUE;
const BUCKET = process.env.MINIO_BUCKET;

const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// === UTILS ===
function cropVideoStream(inputStream) {
  const outputStream = new PassThrough();

  ffmpeg(inputStream)
    .format('mp4')
    .videoFilters('crop=in_h:in_h') // square crop
    .on('start', (cmd) => console.log('FFmpeg started:', cmd))
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      outputStream.destroy(err);
    })
    .on('end', () => {
      console.log('Video processing finished.');
    })
    .pipe(outputStream, { end: true });

  return outputStream;
}

async function processVideo(videoKey) {
  const croppedKey = `cropped/${videoKey.replace(/^.*[\\/]/, '')}`;

  return new Promise((resolve, reject) => {
    minio.getObject(BUCKET, videoKey, (err, dataStream) => {
      if (err) return reject(err);

      const croppedStream = cropVideoStream(dataStream);

      minio.putObject(BUCKET, croppedKey, croppedStream, (err, etag) => {
        if (err) return reject(err);
        console.log(`Uploaded cropped video: ${croppedKey}`);
        resolve(etag);
      });
    });
  });
}

// === MAIN ===
async function startWorker() {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  console.log(`Waiting for messages in queue: ${QUEUE}`);

  channel.consume(
    QUEUE,
    async (msg) => {
      if (!msg) return;

      const { videoKey } = JSON.parse(msg.content.toString());
      console.log(`Received videoKey: ${videoKey}`);

      try {
        await processVideo(videoKey);
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
