const cron = require("node-cron");
const ResetToken = require("./../Model/ResetToken");

// Hàm start cron
const startCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const result = await ResetToken.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      if (result.deletedCount > 0) {
        console.log(`Đã xoá ${result.deletedCount} token hết hạn`);
      }
    } catch (err) {
      console.error("Lỗi xoá token hết hạn:", err);
    }
  });
};

module.exports = startCron;
