// src/middlewares/errorHandler.js
// central error-handling middleware
module.exports.errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }
  res.status(status).json({ message });
};
