// Final error handler: always reply with { success, message } JSON.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON body (thrown by express.json()).
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message: status >= 500 ? "Internal server error" : err.message,
  });
}

module.exports = errorHandler;
