const {
  createColor,
  updateColor,
  listColor,
  deleteColor,
} = require("../services/Color");

const listColorModel = async (req, res) => {
  try {
    const data = await listColor();
    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const createColorModel = async (req, res) => {
  try {
    const { value, title, type } = req.body;

    let formData = {
      value: value,
      title: title,
      type: type,
    };

    const data = await createColor(formData);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const updatedColorModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, title, type } = req.body;
    let formData = {
      value: value,
      title: title,
      type: type,
    };

    const data = await updateColor(id, formData);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteColorModel = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await deleteColor(id);
    return res.status(200).json({
      EC: 0,
      message: "Xóa thành công màu",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  listColorModel,
  createColorModel,
  updatedColorModel,
  deleteColorModel,
};
