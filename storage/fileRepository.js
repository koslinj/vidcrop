const pool = require("./db");

const fileRepository = {
  // Save file metadata into the database
  async saveFileMetadata(filename, userId) {
    await pool.query(
      `INSERT INTO files (filename, user_id) VALUES ($1, $2)`,
      [filename, userId]
    );
  },

  // Get file by filename and user ID to check if it belongs to the user
  async getFileMetadataByFilenameAndUserId(filename, userId) {
    const result = await pool.query(
      `SELECT * FROM files WHERE filename = $1 AND user_id = $2`,
      [filename, userId]
    );
    return result; // Returns the result, including the row count
  },

  // Get all files that belong to a specific user
  async getFilesByUserId(userId) {
    const result = await pool.query(
      `SELECT * FROM files WHERE user_id = $1 ORDER BY uploaded_at DESC`,
      [userId]
    );
    return result; // Returns the result, including the row count
  },
};

module.exports = fileRepository;