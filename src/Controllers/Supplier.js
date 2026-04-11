const {
  CreateSupplier,
  FindAllSupplier,
  FindOneIdSupplier,
  UpdateSupplier,
  deleteSupplier,
} = require("../services/Supplier");

const CreateSupplierAPI = async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      website,
      taxCode,
      notes,
    } = req.body;

    if (
      !name ||
      !contactPerson ||
      !phone ||
      !email ||
      !address ||
      !website ||
      !taxCode ||
      !notes
    ) {
      return res.status(400).json({
        EC: 1,
        EM: "Thiếu trường",
      });
    }

    const formdata = {
      name,
      contactPerson,
      phone,
      email,
      address,
      website,
      taxCode,
      notes,
    };

    const data = await CreateSupplier(formdata);

    return res.status(200).json({
      EC: 0,
      EM: "Tạo nhà cung cấp thành công",
      data,
    });
  } catch (error) {
    console.log("Lỗi:", error.message);
    return res.status(409).json({
      EC: 1,
      EM: error.message || "Có lỗi xảy ra",
    });
  }
};

const FindAllSupplierAPI = async (req, res) => {
  try {
    const data = await FindAllSupplier();

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const FindOneIdSupplierAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await FindOneIdSupplier(id);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const UpdateSupplierAPI = async (req, res) => {
  try {
    const {
      id,
      name,
      contactPerson,
      phone,
      email,
      address,
      website,
      taxCode,
      notes,
    } = req.body;

    const formdata = {
      id: id,
      name: name,
      contactPerson: contactPerson,
      phone: phone,
      email: email,
      address: address,
      website: website,
      taxCode: taxCode,
      notes: notes,
    };

    const data = await UpdateSupplier(formdata);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteSupplierAPI = async (req, res) => {
  try {
    const { id } = req.query;

    const data = await deleteSupplier(id);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  CreateSupplierAPI,
  FindAllSupplierAPI,
  FindOneIdSupplierAPI,
  UpdateSupplierAPI,
  deleteSupplierAPI,
};
