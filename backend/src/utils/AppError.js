// Expected (business-rule) failure carrying an HTTP status.
// Services throw it; controllers turn it into { success: false, message }.
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

module.exports = AppError;
