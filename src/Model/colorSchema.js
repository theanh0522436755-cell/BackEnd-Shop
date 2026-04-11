const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    title: String,
    type: String,
  },
  { timestamps: true }
);

const ColorModel = mongoose.model("Color", colorSchema);

module.exports = ColorModel;
