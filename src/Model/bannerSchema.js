const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      require: true,
    },
    link: {
      type: String,
      default: "",
    },

    postion: {
      type: String,
      enum: ["home", "sidebar", "top", "bottom"],
      default: "home",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

module.exports = mongoose.model("Banner", bannerSchema);
