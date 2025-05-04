const pool = require("./db");

const fileRepository = {
  async saveFileMetadata(filename, userId) {
    await pool.query(
      `INSERT INTO files (filename, user_id) VALUES ($1, $2)`,
      [filename, userId]
    );
  },

  // async getFileByName(filename) {
  //   const result = await pool.query(
  //     `SELECT * FROM files WHERE filename = $1`,
  //     [filename]
  //   );
  //   return result.rows[0];
  // },
};

module.exports = fileRepository;
