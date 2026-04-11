// models/Supplier.js
const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Tên nhà cung cấp
    contactPerson: { type: String }, //// Người liên hệ
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    website: { type: String },
    taxCode: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model("Supplier", supplierSchema);
