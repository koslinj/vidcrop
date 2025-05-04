async function checkFilePermission(req, res, next) {
  const userId = req.get('x-user-id');
  const filename = req.params.filename;

  if (!userId) {
    return res.sendStatus(400);
  }

  const result = await pool.query(
    "SELECT * FROM files WHERE filename = $1 AND user_id = $2",
    [filename, userId]
  );

  if (result.rowCount === 0) {
    return res.sendStatus(403);
  }

  next();
}
