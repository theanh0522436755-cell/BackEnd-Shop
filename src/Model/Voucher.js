const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true, // tên mã giám giá
      unique: true,
      uppercase: true,
    },
    content: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"], //Loại giảm giá (percentage hoặc fixed).
      required: true,
    },
    discountValue: {
      type: Number, //- Giá trị giảm giá
      required: true,
    },
    minOrderValue: {
      type: Number, //Giá trị đơn hàng tối thiểu để áp dụng voucher.
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 1, // Giới hạn 100 lần sử dụng
    },
    usedCount: {
      type: Number,
      default: 0, // Số lần đã sử dụng
    },
    status: {
      type: Boolean,
      default: true, // Mặc định voucher có hiệu lực
    },
    // Voucher dành riêng cho một user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Danh sách user đã sử dụng voucher
    appliedUsers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedCount: { type: Number, default: 0 },
      },
    ],
    // Nhóm người dùng có thể sử dụng voucher
    userGroup: {
      type: String,
      enum: ["all", "newUser", "regular", "vip", "loyalCustomer", "elite"],
      default: "all",
    },
  },
  { timestamps: true }
);

voucherSchema.pre(/^find/, async function (next) {
  // Cập nhật tất cả voucher hết hạn thành status: false
  await this.model.updateMany(
    { endDate: { $lt: new Date() }, status: true },
    { $set: { status: false } }
  );
  next();
});

const Voucher = mongoose.model("Voucher", voucherSchema);
module.exports = Voucher;
