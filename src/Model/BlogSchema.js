const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    tip: {
      type: String,
      required: true, // ✅ sửa chính tả
    },
    content: {
      type: String,
      required: true,
    },
    slug: String,
    regex: {
      type: String,
      trim: true,
    },
    img: [
      {
        url: {
          type: String,
          required: false,
        },
      },
    ],
    view: {
      type: Number,
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    readTime: {
      type: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Blog", blogSchema);
