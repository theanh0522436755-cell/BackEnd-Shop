const ColorModel = require("../Model/colorSchema");

const listColor = async () => {
  try {
    const data = await ColorModel.find({}).sort({ createdAt: -1 });

    return data;
  } catch (error) {
    console.log(error);
  }
};

const createColor = async (formData) => {
  try {
    const result = new ColorModel(formData);

    const data = await result.save();

    return data;
  } catch (error) {
    console.log(error);
  }
};

const updateColor = async (id, formData) => {
  try {
    const isExist = await ColorModel.findById(id);

    if (!isExist) {
      throw new Error("Không tồn tại màu này");
    }

    const updatedColor = await ColorModel.findByIdAndUpdate(
      id,
      { ...formData },
      { new: true }
    );

    return updatedColor;
  } catch (error) {
    console.error("Lỗi khi cập nhật màu:", error.message);
    throw error;
  }
};

const deleteColor = async (id) => {
  console.log(id);

  try {
    const isExist = await ColorModel.findById(id);

    if (!isExist) {
      throw new Error("Không tồn tại màu này");
    }

    const data = await ColorModel.deleteOne({ _id: id });

    return data;
  } catch (error) {
    console.error("Lỗi khi xóa:", error.message);
    throw error;
  }
};

module.exports = {
  listColor,
  createColor,
  updateColor,
  deleteColor,
};
