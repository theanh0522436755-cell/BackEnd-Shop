const {
  AddCategory,
  ListCategory,
  ListOneCategory,
  UpdateOneCatogry,
  DeleteOneCategory,
} = require("./../services/Category");

const CreateCategoryAPI = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Thêm danh mục cha
    const clothingCategory = await AddCategory(name, description);

    return res.status(201).json({
      EC: 0,
      message: "Tạo thành công category",
      data: clothingCategory,
    });
  } catch (error) {
    console.error("Đã xảy ra lỗi khi tạo danh mục:", error);

    // Xử lý lỗi trùng tên category
    if (error.message === "Category đã tồn tại") {
      return res.status(409).json({
        message: "Category với tên này đã tồn tại",
        error: error.message,
      });
    }

    // Xử lý lỗi validation của Mongoose
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        error: error.message,
      });
    }

    // Lỗi server chung
    res.status(500).json({
      message: "Đã xảy ra lỗi server",
      error: error.message,
    });
  }
};

const ListCategoryAPI = async (req, res) => {
  try {
    const data = await ListCategory();

    return res.status(201).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.error("Đã xảy ra lỗi khi tạo danh mục:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi", error });
  }
};

const ListCategoryOneAPI = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await ListOneCategory(id);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.error("Đã xảy ra lỗi khi tạo danh mục:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi", error });
  }
};

const UpdateOneCatogryAPI = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { id } = req.params;

    const data = await UpdateOneCatogry(id, name, description);

    return res.status(201).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.error("Đã xảy ra lỗi khi tạo danh mục:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi", error });
  }
};

const DeleteOneCategoryAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await DeleteOneCategory(id);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.error("Đã xảy ra lỗi khi tạo danh mục:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi", error });
  }
};

module.exports = {
  CreateCategoryAPI,
  ListCategoryAPI,
  ListCategoryOneAPI,
  UpdateOneCatogryAPI,
  DeleteOneCategoryAPI,
};
