const Banner = require("../Model/bannerSchema");

const CreateBanner = async (formdata) => {
  const newBanner = new Banner(formdata);

  const data = await newBanner.save();

  return data;
};

const UpdateBanner = async (id, title, imageUrl, link, position, isActive) => {
  try {
    const updateFields = {};

    if (title !== undefined) updateFields.title = title;
    if (imageUrl !== undefined && imageUrl !== "") {
      updateFields.imageUrl = imageUrl;
    }
    if (link !== undefined) updateFields.link = link;
    if (position !== undefined) updateFields.position = position;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const updatedBanner = await Banner.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    return updatedBanner;
  } catch (error) {
    console.error("Lỗi khi cập nhật banner:", error);
    throw error;
  }
};

const DeleteBanner = async (id) => {
  try {
    const result = await Banner.deleteOne({ _id: id });

    if (result.deletedCount > 0) {
      return {
        EC: 0,
        message: "Xóa banner thành công",
      };
    } else {
      return {
        EC: 1,
        message: "Không tìm thấy banner để xóa",
      };
    }
  } catch (error) {
    console.error("Lỗi khi xóa banner:", error);
    return {
      EC: -1,
      message: "Lỗi server khi xóa banner",
    };
  }
};

const ListsBanner = async () => {
  try {
    const data = await Banner.find({}).sort({ createdAt: -1 });
    return data;
  } catch (error) {
    console.error("Lỗi không lấy được danh sách banner:", error);
    throw error;
  }
};

const FindOneBanner = async (id) => {
  try {
    const data = await Banner.findById(id);
    return data;
  } catch (error) {
    console.error("Lỗi không lấy banner theo Id:", error);
    throw error;
  }
};

const CheckIsActiveBanner = async (id, isActive) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!banner) {
      return { success: false, message: "Banner không tồn tại" };
    }

    return { success: true, data: banner };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  CreateBanner,
  UpdateBanner,
  DeleteBanner,
  ListsBanner,
  FindOneBanner,
  CheckIsActiveBanner,
};
