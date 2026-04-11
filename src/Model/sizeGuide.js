const mongoose = require("mongoose");

const sizeGuideSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sizes: [
      {
        size: { type: String, required: true }, // "M", "L", "XL", "2XL"
        heightRange: { type: String }, // "1m59 - 1m65"
        weightRange: { type: String }, // "55kg - 61kg"
        shirtLength: Number, // Dài áo (cm)
        shoulderWidth: Number, // Rộng vai (cm)
        chestWidth: Number, // 1/2 vòng ngực (cm)
        sleeveLength: Number, // Dài tay (cm)
        bicepWidth: Number, // Rộng bắp tay (cm)
      },
    ],
    note: { type: String }, // ghi chú (VD: "ưu tiên theo chiều cao")
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SizeGuide", sizeGuideSchema);
