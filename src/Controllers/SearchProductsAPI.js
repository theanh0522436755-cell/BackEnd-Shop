const { searchProductsByName } = require("../services/Product");

const searchProductsByNameAPI = async (req, res) => {
  try {
    const page = parseInt(req.params.page || "1", 10);

    const { keyword } = req.query;

    // Kiểm tra keyword rỗng
    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({
        EC: 1,
        message: "Keyword is required for searching",
      });
    }

    // Gọi hàm tìm kiếm
    const { products, totalPages, currentPage } = await searchProductsByName(
      keyword,
      page
    );

    // Trả về kết quả
    return res.status(200).json({
      EC: 0,
      data: products,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error("Error in searchProductsByNameAPI:", error);
    return res.status(500).json({
      EC: -1,
      message: "Internal server error",
    });
  }
};

module.exports = {
  searchProductsByNameAPI,
};
