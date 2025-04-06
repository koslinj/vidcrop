require("dotenv").config();
const express = require("express");
const multer = require("multer");
const Minio = require("minio");

const app = express();
const PORT = process.env.STORAGE_SERVICE_PORT;

// MinIO Client Configuration
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false, // Change to true if using HTTPS
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const BUCKET_NAME = process.env.MINIO_BUCKET;

// Ensure bucket exists
(async () => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`✅ Bucket '${BUCKET_NAME}' created successfully.`);
    }
  } catch (error) {
    console.error("🚨 MinIO Bucket Error:", error);
  }
})();

// Multer Setup (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Route (MinIO)
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileName = `${Date.now()}-${req.file.originalname}`;
  const metaData = { "Content-Type": req.file.mimetype };

  try {
    await minioClient.putObject(BUCKET_NAME, fileName, req.file.buffer, metaData);
    
    const fileUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${fileName}`;

    res.json({
      message: "File uploaded successfully",
      filename: fileName,
      url: fileUrl,
    });
  } catch (error) {
    console.error("🚨 MinIO Upload Error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

// Download Route
app.get("/download/:filename", async (req, res) => {
  const { filename } = req.params;

  try {
    const objectStream = await minioClient.getObject(BUCKET_NAME, filename);
    
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    objectStream.pipe(res);
  } catch (error) {
    console.error("🚨 MinIO Download Error:", error);
    res.status(404).json({ error: "File not found" });
  }
});

// Health Check
app.get("/", (req, res) => {
  res.send("Storage Service is running!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Storage service running on http://localhost:${PORT}`);
});
