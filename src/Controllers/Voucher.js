const Voucher = require("../Model/Voucher");
const {
  addVoucher,
  listVoucher,
  getListOneVoucher,
} = require("../services/Voucher");

const addVoucherAPI = async (req, res) => {
  try {
    let {
      code,
      discountType,
      discountValue,
      minOrderValue,
      startDate,
      endDate,
      usageLimit,
      user,
      appliedUsers,
      userGroup,
      content,
    } = req.body;

    console.log(
      code,
      discountType,
      discountValue,
      minOrderValue,
      startDate,
      endDate,
      usageLimit,
      user,
      appliedUsers,
      userGroup,
      content
    );

    if (!code || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // Tạo object voucher
    const voucherData = {
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      startDate,
      endDate,
      usageLimit: usageLimit || 1,
      usedCount: 0,
      status: true,
      user: user || null,
      appliedUsers: appliedUsers || [],
      userGroup: userGroup || "all",
      content,
    };

    const newVoucher = await addVoucher(voucherData);

    return res.status(201).json({
      message: "Thêm voucher thành công",
      EC: 0,
      voucher: newVoucher,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// danh sách voucher

const listVoucherAPI = async (req, res) => {
  try {
    let data = await listVoucher();
    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.error("Error in listVoucherAPI:", error);
    return res.status(500).json({
      Ec: 1,
      message: "Internal Server Error",
    });
  }
};

const getListOneVoucherAPI = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await getListOneVoucher(id);

    return res.status(201).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

// lấy danh sách voucher theo khách hàng

const getListVoucherByUserId = async (req, res) => {
  try {
    const { UserId } = req.params;

    const data = await Voucher.findOne({ UserId: UserId });

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};
// Cập nhật voucher
const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    console.log(req.body);

    // Các trường không được cập nhật
    const blockedFields = ["code", "usedCount", "appliedUsers", "user"];
    for (let field of blockedFields) {
      if (field in req.body) {
        return res
          .status(400)
          .json({ message: `Không được cập nhật trường '${field}'` });
      }
    }

    // Lọc bỏ các trường có giá trị null
    const updateData = {};
    for (const [key, value] of Object.entries(req.body.formdata)) {
      if (value !== null && value !== undefined) {
        updateData[key] = value;
      }
    }
    console.log(updateData);

    const updatedVoucher = await Voucher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedVoucher) {
      return res.status(404).json({ message: "Voucher không tồn tại" });
    }

    res.status(200).json({
      EC: 0,
      message: "Cập nhật voucher thành công",
      data: updatedVoucher,
    });
  } catch (error) {
    console.error("Lỗi cập nhật voucher:", error);
    res.status(500).json({ EC: 1, message: "Lỗi server", error });
  }
};
module.exports = {
  addVoucherAPI,
  listVoucherAPI,
  getListOneVoucherAPI,
  updateVoucher,
  getListVoucherByUserId,
};
