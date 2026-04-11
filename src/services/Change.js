const ChangeModel = require("../Model/ChangeSchema");

const createChangeModel = async (ChangelogModel) => {
  try {
    const newChangelog = new ChangeModel(ChangelogModel);

    const saved = await newChangelog.save();

    return saved;
  } catch (error) {
    console.log(error);
  }
};

const getChangeModel = async () => {
  try {
    const data = await ChangeModel.find({}).sort({ createdAt: -1 });

    return data;
  } catch (error) {
    console.log(error);
  }
};

const updateChangeModel = async (id, changelogData) => {
  try {
    const existingChange = await ChangeModel.findById(id);
    if (!existingChange) {
      throw new Error("Không tìm thấy changelog");
    }

    // Gán dữ liệu mới vào instance
    Object.assign(existingChange, changelogData);

    // Lưu lại
    const saveData = await existingChange.save();
    return saveData;
  } catch (error) {
    console.error("Lỗi update changelog:", error);
    throw error;
  }
};

const DeletehangeModel = async (id) => {
  try {
    const deletedChange = await ChangeModel.findByIdAndDelete(id);

    if (deletedChange) {
      return { success: true, data: deletedChange };
    } else {
      return { success: false, message: "Document not found" };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  createChangeModel,
  getChangeModel,
  updateChangeModel,
  DeletehangeModel,
};
