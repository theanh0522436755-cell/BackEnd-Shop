// config/db.js
const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {});
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Thoát ứng dụng nếu kết nối thất bại
  }
};

module.exports = connectDB;
