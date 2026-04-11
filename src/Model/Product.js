const mongoose = require("mongoose");
const Ratings = require("../Model/rating");
const slugify = require("slugify");

const productSchema = new mongoose.Schema({
  normalizedName: String,
  name: { type: String, required: true },
  gender: {
    type: String,
    enum: ["male", "female", "unisex"],
    default: "unisex",
    required: true,
  },
  description: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  brand: String,
  care: String,
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountedPrice: Number,
  stock: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 }, // số lượng đang giữ
  sold: { type: Number, default: 0 },
  variants: [
    {
      color: { type: String, required: true },
      sizes: [
        {
          size: { type: String, required: true },
          quantity: { type: Number, default: 0, min: 0 },
          sold: { type: Number, default: 0 },
        },
      ],
      images: [{ url: { type: String, required: true } }],
    },
  ],
  ratings: [Ratings],
  costPrice: { type: Number, required: true },
  slug: { type: String, unique: true },
  view: {
    type: Number,
    default: 0,
  },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Xử lý khi tạo mới
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  this.discountedPrice = this.price * (1 - this.discount / 100);
  this.normalizedName = this.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!this.slug) {
    const genderVN = {
      male: "nam",
      female: "nu",
      unisex: "unisex",
    };
    const genderText = genderVN[this.gender] || "unisex";
    const randomStr = Math.random().toString(36).substring(2, 7);

    this.slug = slugify(`${this.name} ${genderText} ${randomStr}`, {
      lower: true,
      strict: true,
    });
  }

  next();
});

// ✅ Xử lý khi cập nhật: nếu sản phẩm chưa có slug → tạo
productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const current = await this.model.findOne(this.getQuery());

  if (!current) return next();

  // Nếu đã có slug thì không cập nhật nữa
  if (current.slug) return next();

  const name = update.name || current.name;
  const gender = update.gender || current.gender;
  const genderVN = {
    male: "nam",
    female: "nu",
    unisex: "unisex",
  };
  const genderText = genderVN[gender] || "unisex";
  const randomStr = Math.random().toString(36).substring(2, 7);

  update.slug = slugify(`${name} ${genderText} ${randomStr}`, {
    lower: true,
    strict: true,
  });

  update.updatedAt = Date.now();
  this.setUpdate(update);

  next();
});

// Virtual
productSchema.virtual("totalCost").get(function () {
  return this.costPrice * this.stock;
});
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// Index
productSchema.index({ name: "text" });
productSchema.index({ normalizedName: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ searchKeywords: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ category: 1 });
productSchema.index({ color: 1 });
productSchema.index({ size: 1 });

module.exports = mongoose.model("Product", productSchema);
