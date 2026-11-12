const AppError = require("./AppError");

// Shared by controllers: expected errors keep their status/message, anything else is a 500.
function sendError(res, error) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: "Something went wrong" });
}

module.exports = sendError;
