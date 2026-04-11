const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    role: { type: String, enum: ["admin", "customer", "staff"] },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { createdAt: "sentAt", updatedAt: "updatedAt" } }
);

MessageSchema.methods.markAsRead = function () {
  this.isRead = true;
  return this.save();
};

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
