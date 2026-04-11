const Voucher = require("../Model/Voucher");

const addVoucher = async (voucherData) => {
  try {
    if (!voucherData) {
      throw new Error("Chưa điền đầy đủ thông tin");
    }

    // Kiểm tra trùng mã giảm giá
    const existingVoucher = await Voucher.findOne({ code: voucherData.code });
    if (existingVoucher) {
      throw new Error("Mã giảm giá đã tồn tại");
    }

    const data = await Voucher.create(voucherData);
    return data;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

// xem tất cả voucer
const listVoucher = async () => {
  try {
    let data = await Voucher.find({}).sort({ createdAt: -1 });
    return data;
  } catch (error) {
    console.log("Error fetching vouchers:", error);
    return [];
  }
};

// xem chi tiết 1 voucher

const getListOneVoucher = async (id) => {
  try {
    const data = await Voucher.findById(id);
    return data;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  addVoucher,
  listVoucher,
  getListOneVoucher,
};
