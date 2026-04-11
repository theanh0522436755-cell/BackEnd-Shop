const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
    },
    images: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
        content: {
          type: String,
          required: true,
        },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
        createdAt: {
          type: Date,
          default: Date.now,
        },
        replies: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Users",
            },
            content: {
              type: String,
              required: true,
            },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        check: {
          type: Boolean,
          default: false,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

module.exports = ratingSchema;
