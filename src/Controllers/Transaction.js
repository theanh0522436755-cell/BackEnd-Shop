const { showRevenue } = require("../services/transaction");
const Transaction = require("../Model/transactionSchema");
const ExcelJS = require("exceljs");
const getRevenue = async (req, res) => {
  try {
    const data = await showRevenue();

    return res.status(200).json({
      EC: 0,
      message: "Doanh thu",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const exportTransactionsExcel = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "orderId",
        select: "items orderStatus shippingAddress",
        populate: {
          path: "items.productId",
          model: "Product",
          select: "name price discountedPrice",
        },
      })
      .populate({
        path: "userId",
        select: "name email phone ",
      })
      .exec();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transaction Report");

    worksheet.columns = [
      { header: "STT", key: "index", width: 6 },
      { header: "Mã hóa đơn", key: "orderId", width: 25 },
      { header: "Tên khách hàng", key: "name", width: 20 },
      { header: "Mã đơn hàng", key: "orderCode", width: 15 },
      { header: "Tổng tiền đơn hàng", key: "totalAmount", width: 20 },
      { header: "Hình thức thanh toán", key: "paymentMethod", width: 25 },
      { header: "Trạng thái thanh toán", key: "paymentStatus", width: 20 },
      { header: "Thời gian đặt hàng", key: "createdAt", width: 25 },
    ];

    transactions.forEach((transaction, index) => {
      worksheet.addRow({
        index: index + 1,
        orderId: transaction.orderId._id.toString() || "",
        name: transaction.userId?.name || "",
        orderCode: transaction.orderCode,
        totalAmount: transaction.totalAmount,
        paymentMethod: transaction.paymentMethod,
        paymentStatus: transaction.paymentStatus,
        createdAt: transaction.createdAt
          ? transaction.createdAt.toLocaleString("vi-VN")
          : "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=transactions_report.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Excel Error:", error);
    res.status(500).json({ error: "Xuất Excel thất bại" });
  }
};

module.exports = {
  getRevenue,
  exportTransactionsExcel,
};
