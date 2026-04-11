const Transaction = require("../Model/transactionSchema");

const showRevenue = async () => {
  try {
    const data = await Transaction.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "orderId",
        select: "items orderStatus shippingAddress",
        populate: {
          path: "items.productId",
          model: "Product", // tên model Product
          select: "name price discountedPrice", // field muốn lấy
        },
      })
      .populate({
        path: "userId",
        select: "name email phone ",
      })
      .exec();

    return data;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  showRevenue,
};
