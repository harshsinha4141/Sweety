const express = require("express");
const cors = require("cors");
require("dotenv").config();
const supabase = require("./src/config/supabase");
const authRoutes = require("./src/routes/auth/auth");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

// Middlewares
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Sweety API!"
  });
});

app.get("/test-db",async(req,res)=>{
    try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (error) throw error;

    res.json({
      success: true,
      message: "Supabase connected successfully!",
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);

// Error handler (must be registered after all routes)
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Sweety server running on port ${PORT}`);
});
