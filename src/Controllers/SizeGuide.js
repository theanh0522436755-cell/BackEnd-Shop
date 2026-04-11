const SizeGuideModel = require("../Model/sizeGuide");
const ProductModel = require("../Model/Product");

const createSizeGuideModel = async (req, res) => {
  try {
    const dateSize = req.body;

    const data = await SizeGuideModel.create(dateSize);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    return res.status(400).json({
      EC: 1,
      message: "Lỗi khi thêm size",
    });
  }
};

const addOneSize = async (req, res) => {
  try {
    const { productId, size, note } = req.body;

    console.log(productId, size, note);

    // kiểm tra productId có tồn tại trong bảng sản phẩm không
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        EC: 1,
        message: "Sản phẩm không tồn tại, không thể thêm size",
      });
    }

    // tìm SizeGuide theo productId
    let sizeGuide = await SizeGuideModel.findOne({ productId });

    if (!sizeGuide) {
      // nếu chưa có thì tạo mới
      sizeGuide = new SizeGuideModel({
        productId,
        sizes: [size],
        note,
      });
    } else {
      // kiểm tra trùng size (so sánh theo field `size`)
      const isExist = sizeGuide.sizes.some(
        (s) => s.size.toLowerCase() === size.size.toLowerCase()
      );

      if (isExist) {
        return res.status(400).json({
          EC: 2,
          message: `Size "${size.size}" đã tồn tại, không thể thêm trùng.`,
        });
      }

      // nếu chưa trùng thì push
      sizeGuide.sizes.push(size);
      if (note) sizeGuide.note = note; // update note nếu có
    }

    // lưu lại
    await sizeGuide.save();

    return res.status(200).json({
      EC: 0,
      data: sizeGuide,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      EC: 1,
      message: "Lỗi khi thêm size",
    });
  }
};

const getSizeGuideModel = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await SizeGuideModel.findOne({ productId: id });

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    return res.status(400).json({
      EC: 1,
      message: "Lỗi khi thêm size",
    });
  }
};

const deleteOneSize = async (req, res) => {
  try {
    const { productId, size } = req.body;

    // xoá size trong mảng
    const updated = await SizeGuideModel.findOneAndUpdate(
      { productId },
      { $pull: { sizes: { size } } }, // xoá object có field size = size
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        EC: 1,
        message: "Không tìm thấy size guide hoặc sản phẩm",
      });
    }

    return res.status(200).json({
      EC: 0,
      data: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      EC: 1,
      message: "Lỗi khi xoá size",
    });
  }
};

const updateOneSize = async (req, res) => {
  try {
    const { productId, size, updatedData } = req.body;

    const sizeGuide = await SizeGuideModel.findOne({ productId });
    if (!sizeGuide) {
      return res.status(404).json({
        EC: 1,
        message: "Không tìm thấy size guide",
      });
    }

    const index = sizeGuide.sizes.findIndex(
      (s) => s.size.toLowerCase() === size.toLowerCase()
    );

    if (index === -1) {
      return res.status(404).json({
        EC: 1,
        message: `Size "${size}" không tồn tại`,
      });
    }

    // merge dữ liệu cũ với dữ liệu mới
    sizeGuide.sizes[index] = {
      ...sizeGuide.sizes[index]._doc, // giữ nguyên field cũ
      ...updatedData, // ghi đè field mới
    };

    await sizeGuide.save();

    return res.status(200).json({
      EC: 0,
      data: sizeGuide,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      EC: 1,
      message: "Lỗi khi update size",
    });
  }
};

module.exports = {
  createSizeGuideModel,
  addOneSize,
  getSizeGuideModel,
  updateOneSize,
  deleteOneSize,
};
