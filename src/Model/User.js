const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Thay vì "bcryptjs"

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    avatar: { type: String },
    address: {
      city: { type: String }, // Thành phố
      district: { type: String }, // Quận/Huyện
      ward: { type: String }, // Phường/Xã
    },
    phone: { type: String },
    gender: { type: String, enum: ["Nam", "Nữ"], default: "Nam" },
    dateOfBirth: { type: Date },
    height: { type: Number },
    weight: { type: Number },
    totalPrice: { type: Number },
    isAdmin: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["admin", "customer", "staff"],
      default: "customer",
    },
    permissions: {
      type: String,
      enum: ["order_approval", "customer_support", "customer"],
      required: function () {
        // Chỉ required nếu là staff
        return this.role === "staff";
      },
    },
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cart" }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    userGroup: {
      type: String,
      enum: ["newUser", "regular", "vip", "loyalCustomer", "elite"],
      default: "newUser",
    },
    isAccountLocked: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    facebookId: { type: String, unique: true, sparse: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updatedAt" } }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  if (this.totalPrice >= 10000000) {
    this.userGroup = "elite";
  } else if (this.totalPrice >= 5000000) {
    this.userGroup = "loyalCustomer";
  } else if (this.totalPrice >= 1000000) {
    this.userGroup = "vip";
  } else if (this.totalPrice >= 100000) {
    this.userGroup = "regular";
  } else {
    this.userGroup = "newUser";
  }

  next();
});

// so sánh
UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

const Users = mongoose.model("Users", UserSchema);

module.exports = Users;
