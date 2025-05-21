const { getFileMetadataByFilenameAndUserId } = require('./fileRepository');

async function checkFilePermission(req, res, next) {
  const userId = req.get('x-user-id');
  const filename = req.params.filename.replace("cropped/", ""); // We want to look for original uploaded file, not cropped one

  if (!userId) {
    return res.sendStatus(400);
  }

  try {
    console.log(filename)
    console.log(userId)
    const result = await getFileMetadataByFilenameAndUserId(filename, userId);
    console.log(result)
    if (result.rowCount === 0) {
      return res.status(403).json({ error: "No access for this file" }); // Forbidden if the file does not belong to the user
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error checking file permission:", error);
    res.sendStatus(500); // Internal server error in case of any issues
  }
}

module.exports = { checkFilePermission };