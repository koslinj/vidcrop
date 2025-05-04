const express = require("express");
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { verifyJWT } = require("./util");

const app = express();
const PORT = process.env.PORT;
const STORAGE_SERVICE_URL = process.env.STORAGE_SERVICE_URL;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cookieParser());
app.use(cors({
  origin: 'http://vidcrop.com:8080', // your Vite dev frontend origin
  credentials: true, // allow cookies to be sent
}));

// Proxy config for auth service
app.use('/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '',
  },
}));

app.use(express.json());

// 🚫 Secured Upload Route
app.post("/upload", verifyJWT, upload.single('video'), async (req, res) => {
  try {
    // Ensure a file is provided
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const email = req.body.email;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create form data to send to the storage service
    const form = new FormData();
    form.append('video', req.file.buffer, { filename: req.file.originalname });
    form.append('email', email);

    // Forward the video and email
    const response = await axios.post(
      `${STORAGE_SERVICE_URL}/upload`,
      form,
      { headers: { 'x-user-id': req.user.id }, });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("🚨 Upload Proxy Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Upload failed" });
  }
});

// Secured Download Route
app.get("/download/:filename", verifyJWT, async (req, res) => {
  try {
    const response = await axios.get(`${STORAGE_SERVICE_URL}/download/${encodeURIComponent(req.params.filename)}`, {
      responseType: "stream",
    });

    res.setHeader("Content-Disposition", response.headers["content-disposition"]);
    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);
  } catch (error) {
    console.error("🚨 Download Proxy Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Download failed" });
  }
});

// Check if File Exists (Proxy) Route
app.head("/download/:filename", verifyJWT, async (req, res) => {
  try {
    const response = await axios.head(`${STORAGE_SERVICE_URL}/download/${encodeURIComponent(req.params.filename)}`);

    res.sendStatus(response.status); // Should be 200
  } catch (error) {
    console.error("🚨 Gateway Head Check Error:", error.response?.data || error.message);

    const status = error.response?.status || 500;
    res.sendStatus(status); // Forward 404, 500, etc.
  }
});


// Health Check
app.get("/", (req, res) => {
  res.send("Hello, Gateway is running!");
});

// Test cookie from frontend
app.get("/test", verifyJWT, (req, res) => {
  res.send("Cookie auth is working!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Gateway running on http://localhost:${PORT}`);
});
