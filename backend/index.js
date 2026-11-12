const express = require("express");
const cors = require("cors");
require("dotenv").config();
const supabase = require("./src/config/supabase");
const authRoutes = require("./src/routes/auth/auth");
const readingsRoutes = require("./src/routes/glucose_readings/glucose_readings");
const reportsRoutes = require("./src/routes/reports/reports");
const doctorRoutes = require("./src/routes/doctor/doctor");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

// Middlewares
// Allowed frontend origins: comma-separated FRONTEND_URL, else local dev + the deployed frontend.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173,https://sweety-frontend.vercel.app")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
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
app.use("/api/readings", readingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/doctor", doctorRoutes);

// Error handler (must be registered after all routes)
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 3000;

// Express 5 passes listen errors (e.g. port already in use) to this callback.
app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`Sweety server running on port ${PORT}`);
});
