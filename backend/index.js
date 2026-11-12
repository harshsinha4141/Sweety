const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Sweety API!"
  });
});

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Sweety server running on port ${PORT}`);
});
