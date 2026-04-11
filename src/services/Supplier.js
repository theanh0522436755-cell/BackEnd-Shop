const Product = require("../Model/Product");
const Supplier = require("../Model/Supplier");

const CreateSupplier = async (data) => {
  const isCheck = await Supplier.findOne({ name: data.name });
  if (isCheck) {
    throw new Error("Nhà cung cấp đã tồn tại");
  }

  const result = await Supplier.create(data);
  return result;
};

const FindAllSupplier = async () => {
  try {
    const result = await Supplier.find({}).sort({ createdAt: -1 });

    return result;
  } catch (error) {
    console.log(error);
  }
};

const FindOneIdSupplier = async (id) => {
  try {
    const result = await Supplier.findById(id);

    return result;
  } catch (error) {
    console.log(error);
  }
};

const UpdateSupplier = async (data) => {
  try {
    const result = await Supplier.findByIdAndUpdate(
      data.id,
      {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        website: data.website,
        taxCode: data.taxCode,
        notes: data.notes,
      },
      {
        new: true,
      }
    );

    return result;
  } catch (error) {
    console.log(error);
  }
};

const deleteSupplier = async (id) => {
  try {
    const result = await Supplier.deleteOne({ _id: id });

    await Product.updateMany(
      { supplierId: id },
      { $set: { supplierId: null } }
    );

    return result;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  CreateSupplier,
  FindAllSupplier,
  FindOneIdSupplier,
  UpdateSupplier,
  deleteSupplier,
};
