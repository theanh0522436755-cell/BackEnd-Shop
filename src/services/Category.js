const Category = require("./../Model/Category");
const slugify = require("slugify");
function generateRandomString(length = 6) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

const AddCategory = async (name, description) => {
  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      throw new Error("Category đã tồn tại");
    }

    const newCategory = await Category.create({ name, description });

    return newCategory;
  } catch (error) {
    throw error; // Ném lỗi lên trên để controller xử lý
  }
};

const ListCategory = async () => {
  try {
    const data = await Category.find({}).sort({ _id: 1 });
    return data;
  } catch (error) {
    console.log(`Đã xảy ra lỗi:`, error);
  }
};
const ListOneCategory = async (id) => {
  try {
    const data = await Category.findOne({ _id: id });
    return data;
  } catch (error) {
    console.log(`Đã xảy ra lỗi:`, error);
  }
};

const UpdateOneCatogry = async (id, name, description) => {
  try {
    const category = await Category.findById(id);
    if (!category) {
      throw new Error("Category không tồn tại");
    }

    let updateData = { name, description };

    // Nếu slug chưa có, tạo mới
    if (!category.slug) {
      const baseSlug = slugify(name, {
        lower: true,
        strict: true,
      });
      const randomSuffix = generateRandomString(5);
      updateData.slug = `${baseSlug}-${randomSuffix}`;
    }

    const result = await Category.updateOne({ _id: id }, updateData);
    return result;
  } catch (error) {
    console.log("Đã xảy ra lỗi:", error);
  }
};

const DeleteOneCategory = async (id) => {
  try {
    const data = await Category.deleteOne({ _id: id });
    return data;
  } catch (error) {
    console.log(`Đã xảy ra lỗi:`, error);
  }
};
module.exports = {
  AddCategory,
  ListCategory,
  ListOneCategory,
  UpdateOneCatogry,
  DeleteOneCategory,
};
