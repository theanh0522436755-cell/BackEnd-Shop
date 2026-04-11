const {
  CreateBanner,
  UpdateBanner,
  DeleteBanner,
  ListsBanner,
  FindOneBanner,
  CheckIsActiveBanner,
} = require("../services/Banner");
const { uploadFileToCloudinary } = require("./../services/Cloudinary");

const CreateBannerController = async (req, res) => {
  try {
    const { title, link, position } = req.body;

    // Kiểm tra title
    if (!title) {
      return res.status(400).json({
        EC: 1,
        message: "Không được bỏ trống trường title",
      });
    }

    // Kiểm tra nếu không có ảnh
    if (!req.files || !req.files.imageUrl) {
      return res.status(400).json({
        EC: 1,
        message: "Vui lòng chọn ảnh để tải lên",
      });
    }

    // Upload ảnh lên Cloudinary
    const result = await uploadFileToCloudinary(req.files.imageUrl);
    let imageUrl = "";

    if (result && result.length > 0) {
      imageUrl = result[0].secure_url;
    } else {
      return res.status(400).json({
        EC: 1,
        message: "Không thể tải ảnh lên Cloudinary",
      });
    }

    // Tạo object formdata để lưu
    const formdata = {
      title,
      imageUrl,
      link,
      position,
    };

    // Lưu banner
    const data = await CreateBanner(formdata);

    return res.status(200).json({
      EC: 0,
      message: "Tạo banner thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      EC: -1,
      message: "Lỗi server khi tạo banner",
    });
  }
};

const UpdateBannerController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link, position, isActive } = req.body;
    let imageUrl = "";
    if (req.files && req.files.imageUrl) {
      const result = await uploadFileToCloudinary(req.files.imageUrl);

      if (result && result.length > 0) {
        imageUrl = result[0].secure_url;
      } else {
        return res.status(400).json({
          EC: 1,
          message: "Không thể tải ảnh lên Cloudinary",
        });
      }
    }

    const data = await UpdateBanner(
      id,
      title,
      imageUrl,
      link,
      position,
      isActive
    );

    return res.status(201).json({
      EC: 0,
      message: "Cập nhật banner thành công",
      data: data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      EC: -1,
      message: "Lỗi server khi tạo banner",
    });
  }
};

const DeleteBannerController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        EC: -1,
        message: "Lỗi không xóa được banner",
      });
    }

    const result = await DeleteBanner(id);

    return res.status(result.EC === 0 ? 200 : 400).json(result);
  } catch (error) {
    console.log(error);
  }
};

const ListsBannerController = async (req, res) => {
  try {
    const data = await ListsBanner();
    return res.status(200).json({
      EC: 0,
      message: "Tải danh sách banner thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      EC: -1,
      message: "Lỗi server khi lấy danh sách banner",
    });
  }
};

const FindOneBannerController = async (req, res) => {
  try {
    const { id } = req.query;
    const data = await FindOneBanner(id);
    return res.status(200).json({
      EC: 0,
      message: "Lấy danh sách theo id thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      EC: -1,
      message: "Lỗi server khi danh sách theo id ",
    });
  }
};
const CheckIsActiveBannerController = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const data = await CheckIsActiveBanner(id, isActive);

    return res.status(200).json({
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  CreateBannerController,
  UpdateBannerController,
  DeleteBannerController,
  ListsBannerController,
  FindOneBannerController,
  CheckIsActiveBannerController,
};
