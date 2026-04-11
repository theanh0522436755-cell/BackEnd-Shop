// src/Model/ChangeSchema.js
const mongoose = require("mongoose");

const ChangeSchema = new mongoose.Schema({
  new: {
    type: [String],
    default: [],
  },
  improved: {
    type: [String],
    default: [],
  },
  fixed: {
    type: [String],
    default: [],
  },
});

const ChangelogSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    changes: {
      type: ChangeSchema,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ChangelogModel = mongoose.model("Changelog", ChangelogSchema);
module.exports = ChangelogModel;
