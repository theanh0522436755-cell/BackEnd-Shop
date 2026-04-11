const mongoose = require("mongoose");
const slugify = require("slugify");

function generateRandomString(length = 6) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo slug từ name + random string trước khi lưu
categorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    const baseSlug = slugify(this.name, {
      lower: true,
      strict: true,
    });

    const randomSuffix = generateRandomString(5);
    this.slug = `${baseSlug}-${randomSuffix}`;
  }

  next();
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
