const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true, // Người nhận thông báo
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true, // Tham chiếu đến đơn hàng
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    message: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false, // Trạng thái đã đọc
    },
    isAdmin: { type: Boolean, default: false },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isCheck: {
      type: Boolean,
      default: false,
    },
    feedBack: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notifications", NotificationSchema);
