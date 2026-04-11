const express = require("express");
const http = require("http");
const app = express();
const connectDB = require("./Config/db");
const RouterAPI = require("./Routes/Routes");
require("dotenv").config();
const cors = require("cors");
const fileUpload = require("express-fileupload");
const port = process.env.PORT;
const qs = require("qs");
const crypto = require("crypto");
const { Server } = require("socket.io");
const server = http.createServer(app);

const passport = require("passport");
const configurePassport = require("./Config/passport");
const authRoutes = require("./Routes/auth");
const session = require("express-session");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./Config/swagger");
const startCron = require("./Cron/cron"); // file chứa cron
const Order = require("./Model/Order");

// Cấu hình CORS cho Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "exp://192.168.110.8:8081",
      "exp://192.168.1.219:8081",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "exp://192.168.110.8:8081",
      "exp://192.168.1.219:8081",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"], // thêm x-requested-with vào đây
    credentials: true,
  })
);

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

app.use(fileUpload());

// Route cơ bản
app.get("/", (req, res) => {
  res.send("Hello World 1234 !");
});

const config = {
  app_id: "2554",
  key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
  key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
};
app.post("/zalopay-callback", async (req, res) => {
  try {
    const callback_data = req.body;

    // Verify callback data
    const data =
      callback_data.app_id +
      "|" +
      callback_data.app_trans_id +
      "|" +
      callback_data.app_user +
      "|" +
      callback_data.amount +
      "|" +
      callback_data.app_time +
      "|" +
      callback_data.embed_data +
      "|" +
      callback_data.item;

    const mac = crypto
      .createHmac("sha256", config.key2)
      .update(data)
      .digest("hex");

    // Kiểm tra tính toàn vẹn của callback data
    if (mac !== callback_data.mac) {
      console.error("Invalid MAC");
      return res.status(400).json({
        return_code: -1,
        return_message: "MAC không hợp lệ",
      });
    }

    // Parse embed_data và item
    const embed_data = JSON.parse(callback_data.embed_data);
    const item = JSON.parse(callback_data.item);

    // Xử lý theo trạng thái giao dịch
    switch (parseInt(callback_data.status)) {
      case 1: // Thanh toán thành công
        // Cập nhật trạng thái đơn hàng trong database
        await Order.findOneAndUpdate(
          { app_trans_id: callback_data.app_trans_id },
          {
            status: "PAID",
            zp_trans_id: callback_data.zp_trans_id,
            payment_time: new Date(parseInt(callback_data.app_time)),
          }
        );

        // Gửi email xác nhận thanh toán cho khách hàng
        await sendPaymentConfirmationEmail({
          email: embed_data.email,
          orderId: callback_data.app_trans_id,
          amount: callback_data.amount,
        });

        break;

      case 2: // Giao dịch thất bại
        await Order.findOneAndUpdate(
          { app_trans_id: callback_data.app_trans_id },
          {
            status: "FAILED",
            error_message: callback_data.error_message,
          }
        );
        break;

      case 3: // Giao dịch hoàn tiền
        await Order.findOneAndUpdate(
          { app_trans_id: callback_data.app_trans_id },
          {
            status: "REFUNDED",
            refund_time: new Date(parseInt(callback_data.app_time)),
          }
        );
        break;

      default:
        console.warn("Unexpected transaction status:", callback_data.status);
    }

    // Trả về response cho ZaloPay
    return res.status(200).json({
      return_code: 1,
      return_message: "success",
    });
  } catch (error) {
    console.error("Callback processing error:", error);
    return res.status(500).json({
      return_code: 0,
      return_message: "Callback processing failed",
    });
  }
});

// Thêm Router API
app.use("/api/v1/", RouterAPI);
app.use("/auth", authRoutes);
app.set("io", io);

const userSocketMap = new Map();
let OnlineCount = 0;
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("joinRoom", (orderId) => {
    socket.join(orderId);
  });
  OnlineCount++;

  io.emit("updateOnlineCount", OnlineCount);

  socket.on("register", ({ userId }) => {
    socket.userId = userId;
    userSocketMap.set(userId, socket.id);
    socket.join(userId);
    console.log(`User registered: ${userId} with socketId: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    OnlineCount--;
    io.emit("updateOnlineCount", OnlineCount);
    if (socket.userId) {
      userSocketMap.delete(socket.userId);
    }
    console.log("User disconnected:", socket.id);
  });
});

// SEPAY
const apiToken =
  "WQJXNNJBI6VZLAJ2XLSZOPO9T5R4EC0PU32FH4WIY97UVRTMRXDHKK6GZQUGHMCB";

// ======= Callback / Webhook SePay =======

app.use("/sepay/callback", express.json());
app.post("/sepay/callback", async (req, res) => {
  const payload = req.body;
  console.log("📩 Webhook payload:", payload);

  const { content, transferAmount } = payload;

  // --- 1. Verify signature (GIỮ NGUYÊN - RẤT TỐT!) ---
  const signature = req.headers["x-sepay-signature"];

  const rawSignature =
    `accountNumber=${payload.accountNumber}&` +
    `accumulated=${payload.accumulated}&` +
    `content=${payload.content}&` +
    `code=${payload.code || ""}&` +
    `description=${payload.description}&` +
    `gateway=${payload.gateway}&` +
    `referenceCode=${payload.referenceCode}&` +
    `subAccount=${payload.subAccount}&` +
    `transactionDate=${payload.transactionDate}&` +
    `transferAmount=${payload.transferAmount}&` +
    `transferType=${payload.transferType}&` +
    `id=${payload.id}`;

  const hash = crypto
    .createHmac("sha256", apiToken)
    .update(rawSignature)
    .digest("hex");

  if (signature && hash !== signature) {
    console.log("❌ Webhook SePay không hợp lệ!");
    return res.status(400).send("Invalid signature");
  }

  console.log("✅ Webhook SePay hợp lệ, xử lý thanh toán...");

  // --- 2. Extract orderId từ content ---
  // ✅ REGEX MỚI: Tìm ORDER mà KHÔNG CẦN dấu gạch dưới
  const orderMatch = content.match(/ORDER([a-f0-9]{24})/i);
  const orderId = orderMatch ? orderMatch[1] : null;

  console.log(orderId);

  if (!orderId) {
    console.log("❌ Không tìm thấy orderId trong content:", content);
    return res.status(200).send("Invalid content format");
  }

  try {
    // --- 3. Tìm và kiểm tra đơn hàng ---
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("❌ Không tìm thấy order:", orderId);
      return res.status(200).send("Order not found");
    }

    // --- 4. THÊM: Kiểm tra số tiền (tùy chọn) ---
    const expectedAmount = order.totalAmount || order.amount;
    if (
      expectedAmount &&
      Math.abs(parseFloat(transferAmount) - parseFloat(expectedAmount)) > 0.01
    ) {
      console.log(
        `⚠️ Số tiền không khớp. Expected: ${expectedAmount}, Received: ${transferAmount}`
      );
      // Có thể log warning nhưng vẫn xử lý, hoặc return tùy business logic
    }

    // --- 5. Cập nhật đơn hàng ---
    if (order.status !== "paid") {
      // THÊM: Cập nhật thêm các trường hữu ích
      order.status = "paid";
      order.orderStatus = "Processing";
      order.paymentStatus = "Completed"; // Nếu bạn có field này
      order.paidAt = new Date(); // Timestamp thanh toán
      order.paymentInfo = {
        gateway: payload.gateway,
        transactionDate: payload.transactionDate,
        accountNumber: payload.accountNumber,
        transferAmount: payload.transferAmount,
        referenceCode: payload.referenceCode,
        transactionId: payload.id, // THÊM: ID giao dịch
        subAccount: payload.subAccount,
        transferType: payload.transferType,
      };

      await order.save();
      console.log("✅ Order đã thanh toán:", order._id);

      io.to(order._id.toString()).emit("orderPaid", {
        orderId: order._id,
        status: "paid",
      });

      // --- 6. THÊM: Xử lý sau thanh toán ---
      await handlePostPaymentActions(order);
    } else {
      console.log("ℹ️ Order đã được thanh toán trước đó:", order._id);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Lỗi khi xử lý webhook:", err);
    res.status(500).send("Error processing"); // Có thể để 500 thay vì 200
  }
});

// Hàm kiểm tra trạng thái thanh toán (optional - để client poll)
async function checkPaymentStatus(orderId) {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    return {
      success: true,
      paymentStatus: order.paymentStatus,
      paidAt: order.paidAt,
      transactionId: order.transactionId,
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return { success: false, message: "Error checking status" };
  }
}
app.get("/api/payment/status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const result = await checkPaymentStatus(orderId);
  res.json(result);
});

// --- THÊM: Hàm xử lý sau thanh toán ---
async function handlePostPaymentActions(order) {
  try {
    console.log(`🚀 Bắt đầu xử lý sau thanh toán cho order: ${order._id}`);

    // 1. Gửi email xác nhận (nếu có)
    if (order.userEmail || (order.userId && order.userId.email)) {
      await sendOrderConfirmationEmail(order);
      console.log("📧 Đã gửi email xác nhận");
    }

    // 2. Cập nhật inventory (nếu có sản phẩm)
    if (order.items && order.items.length > 0) {
      await updateInventoryAfterPurchase(order);
      console.log("📦 Đã cập nhật inventory");
    }

    // 3. Gửi thông báo realtime
    if (global.io && order.userId) {
      global.io.to(`user_${order.userId}`).emit("payment_success", {
        orderId: order._id,
        amount: order.totalAmount || order.amount,
        transactionId: order.paymentInfo.transactionId,
      });
      console.log("🔔 Đã gửi thông báo realtime");
    }

    // 4. Tạo invoice/receipt
    await generateInvoiceForOrder(order);
    console.log("🧾 Đã tạo hóa đơn");

    console.log(`✅ Hoàn tất xử lý sau thanh toán cho order: ${order._id}`);
  } catch (error) {
    console.error("❌ Lỗi trong xử lý sau thanh toán:", error);
    // Không throw error để không ảnh hưởng đến webhook response
  }
}

// --- Các hàm helper (implement theo nhu cầu) ---
async function sendOrderConfirmationEmail(order) {
  // TODO: Implement email service
  console.log("Sending confirmation email for order:", order._id);
}

async function updateInventoryAfterPurchase(order) {
  // TODO: Update product quantities
  console.log("Updating inventory for order:", order._id);
}

async function generateInvoiceForOrder(order) {
  // TODO: Generate PDF invoice or receipt
  console.log("Generating invoice for order:", order._id);
}
// Kết nối DB và khởi động server
(async () => {
  try {
    await connectDB();
    startCron();
    server.listen(port, () => {
      console.log(`Backend zero app listening on port ${port}`);
    });
  } catch (error) {
    console.log(">>check error connection db", error);
  }
})();
