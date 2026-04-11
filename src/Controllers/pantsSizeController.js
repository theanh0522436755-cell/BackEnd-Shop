const PantsSizeGuide = require("../Model/pantsSizeGuideSchema");
const Product = require("../Model/Product");

const getPantsSizeGuide = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        EC: 1,
        message: "Sản phẩm không tồn tại",
      });
    }

    const sizeGuide = await PantsSizeGuide.findOne({
      productId: productId,
    }).populate("productId", "name");
    if (!sizeGuide) {
      return res.status(200).json({
        EC: 0,
        message: "Chưa có size guide cho sản phẩm này",
        data: null,
      });
    }

    return res.status(200).json({
      EC: 0,
      message: "Lấy size guide thành công",
      data: sizeGuide,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      EC: -1,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

const addOnePantsSize = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, note } = req.body;

    req.body;
    if (!size || !size.size) {
      return res.status(400).json({
        EC: 1,
        message: "Thông tin size không hợp lệ",
      });
    }

    let sizeGuide = await PantsSizeGuide.findOne({ productId });

    if (!sizeGuide) {
      // Tạo mới size guide
      sizeGuide = new PantsSizeGuide({
        productId,
        sizes: [size],
        note: note || "",
      });
    } else {
      // Kiểm tra size đã tồn tại chưa
      const existingSize = sizeGuide.sizes.find((s) => s.size === size.size);
      if (existingSize) {
        return res.status(400).json({
          EC: 1,
          message: `Size ${size.size} đã tồn tại`,
        });
      }

      // Thêm size mới
      sizeGuide.sizes.push(size);
      if (note) sizeGuide.note = note;
    }

    await sizeGuide.save();
    await sizeGuide.populate("productId", "name");

    return res.status(200).json({
      EC: 0,
      message: "Thêm size thành công",
      data: sizeGuide,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      EC: -1,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// PUT - Cập nhật một size
const updateOnePantsSize = async (req, res) => {
  try {
    const { productId, sizeId } = req.params;
    const { size, note } = req.body;

    if (!size) {
      return res.status(400).json({
        EC: 1,
        message: "Thông tin size không hợp lệ",
      });
    }

    const sizeGuide = await PantsSizeGuide.findOne({ productId });
    if (!sizeGuide) {
      return res.status(404).json({
        EC: 1,
        message: "Không tìm thấy size guide",
      });
    }

    const sizeIndex = sizeGuide.sizes.findIndex(
      (s) => s._id.toString() === sizeId
    );
    if (sizeIndex === -1) {
      return res.status(404).json({
        EC: 1,
        message: "Không tìm thấy size",
      });
    }

    // Kiểm tra trùng tên size (nếu đổi tên)
    if (size.size !== sizeGuide.sizes[sizeIndex].size) {
      const existingSize = sizeGuide.sizes.find(
        (s) => s.size === size.size && s._id.toString() !== sizeId
      );
      if (existingSize) {
        return res.status(400).json({
          EC: 1,
          message: `Size ${size.size} đã tồn tại`,
        });
      }
    }

    // Cập nhật size
    sizeGuide.sizes[sizeIndex] = {
      ...sizeGuide.sizes[sizeIndex].toObject(),
      ...size,
    };
    if (note) sizeGuide.note = note;

    await sizeGuide.save();
    await sizeGuide.populate("productId", "name");

    return res.status(200).json({
      EC: 0,
      message: "Cập nhật size thành công",
      data: sizeGuide,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      EC: -1,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// DELETE - Xóa một size
const deleteOnePantsSize = async (req, res) => {
  try {
    const { productId, sizeId } = req.params;

    const sizeGuide = await PantsSizeGuide.findOne({ productId });
    if (!sizeGuide) {
      return res.status(404).json({
        EC: 1,
        message: "Không tìm thấy size guide",
      });
    }

    const sizeIndex = sizeGuide.sizes.findIndex(
      (s) => s._id.toString() === sizeId
    );
    if (sizeIndex === -1) {
      return res.status(404).json({
        EC: 1,
        message: "Không tìm thấy size",
      });
    }

    // Xóa size
    sizeGuide.sizes.splice(sizeIndex, 1);

    // Nếu không còn size nào, có thể xóa toàn bộ size guide
    if (sizeGuide.sizes.length === 0) {
      await PantsSizeGuide.findByIdAndDelete(sizeGuide._id);
      return res.status(200).json({
        EC: 0,
        message: "Xóa size guide thành công",
        data: null,
      });
    }

    await sizeGuide.save();
    await sizeGuide.populate("productId", "name");

    return res.status(200).json({
      EC: 0,
      message: "Xóa size thành công",
      data: sizeGuide,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      EC: -1,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports = {
  getPantsSizeGuide,
  addOnePantsSize,
  updateOnePantsSize,
  deleteOnePantsSize,
};
