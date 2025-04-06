require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT;
const STORAGE_SERVICE_URL = process.env.STORAGE_SERVICE_URL; // File service URL

app.use(express.json());

// Upload Route (Proxy to Storage Service)
app.post("/upload", async (req, res) => {
  try {
    const response = await axios.post(`${STORAGE_SERVICE_URL}/upload`, req.body, {
      headers: req.headers, // Forward headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("🚨 Upload Proxy Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Upload failed" });
  }
});

// Download Route (Proxy to Storage Service)
app.get("/download/:filename", async (req, res) => {
  try {
    const response = await axios({
      url: `${STORAGE_SERVICE_URL}/download/${req.params.filename}`,
      method: "GET",
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

// Health Check
app.get("/", (req, res) => {
  res.send("Hello, Gateway is running!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Gateway running on http://localhost:${PORT}`);
});
