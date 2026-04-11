const mongoose = require("mongoose");
const Order = require("./../Model/Order");
const Users = require("./../Model/User");
const Product = require("../Model/Product");
const Cart = require("../Model/Cart");
const Notifications = require("../Model/Notifications");
const Voucher = require("../Model/Voucher");
const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");
require("dotenv").config();
const nodemailer = require("nodemailer");
const axios = require("axios");
const Transaction = require("../Model/transactionSchema");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "dangtrinhduyanh100202@gmail.com",
    pass: "qfmc zizc ppdg ldjg",
  },
});

const SEPAY_CONFIG = {
  storeSubdomain: "dtda", // Subdomain cửa hàng bạn trên SePay
  apiToken: "QCMMTOY1UL5I9UZ8H212HTFXFOKAYMSACBVRVIAVHBPGNSQIPV9OXFD4CWEP07G", // Lấy từ dashboard SePay
  accountNumber: "2223230519",
  accountName: "MAI THE ANH",
  bankCode: "MBBank",
  webhookSecret: "https://nonsatiric-sterlingly-michelina.ngrok-free.dev/sepay/callback",
};

const config = {
  app_id: "2554",
  key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
  key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
};

const PAYMENT_METHODS = {
  VNPAY: "vnpay",
  MOMO: "momo",
  ZALOPAY: "ZaloPay",
  COD: "cod",
  SEPAY: "sepay",
};

const PAYMENT_STATUS = {
  COMPLETED: "Completed",
  PENDING: "Pending",
};

class OrderService {
  constructor() {
    this.emailTransporter = this.initializeEmailTransporter();
  }

  initializeEmailTransporter() {
    return nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER || "dangtrinhduyanh100202@gmail.com",
        pass: process.env.EMAIL_PASS || "qfmc zizc ppdg ldjg",
      },
    });
  }

  validateOrderRequest(req) {
    const { userId, items, paymentMethod, shippingAddress } = req.body;

    if (!userId || !items || !paymentMethod || !shippingAddress) {
      throw new Error("All required fields must be provided.");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Items must be a non-empty array.");
    }

    if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
      throw new Error("Invalid payment method.");
    }
  }

  async validateUser(userId) {
    const user = await Users.findOne({ _id: userId });
    if (!user) {
      throw new Error("User does not exist.");
    }
    return user;
  }

  async validateAndProcessItems(
    items,
    discountValue = 0,
    discountType = "percentage"
  ) {
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      if (!item.productId || !item.price || isNaN(item.price)) {
        throw new Error("Each item must have a valid productId and price.");
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }

      // ✅ Tính discount theo type
      let discountAmount = 0;
      if (discountType === "percentage") {
        discountAmount = (discountValue / 100) * item.price;
      } else if (discountType === "fixed") {
        discountAmount = discountValue;
      }

      // Đảm bảo không trừ quá giá gốc
      discountAmount = Math.min(discountAmount, item.price);

      const basePrice = item.price - discountAmount;
      const finalPrice = basePrice > 300000 ? basePrice : basePrice + 35000;

      totalAmount += finalPrice;

      processedItems.push({
        ...item,
        product,
        discountAmount,
        finalPrice,
      });
    }

    return { processedItems, totalAmount };
  }

  formatPrice(price) {
    if (price === undefined || price === null) {
      return "0đ";
    }
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  }

  generateEmailContent(processedItems, totalAmount, paymentMethod) {
    let emailContent = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="font-size: 18px; font-weight: bold; padding: 15px; background-color: #f5f5f5; border-radius: 8px; margin-bottom: 20px;">
          THÔNG TIN ĐƠN HÀNG - DÀNH CHO NGƯỜI MUA:
        </div>
        <ul style="list-style: none; padding: 0; margin: 0;">
    `;

    processedItems.forEach((item) => {
      const { product } = item;
      emailContent += `
        <li style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #ffffff;">
          <img src="${product.variants[0]?.images[0]?.url}" 
               alt="${product.name}" 
               style="width: 100px; height: auto; border-radius: 4px; margin-bottom: 10px;" />
          <br>
          <div style="line-height: 1.6;">
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: inline-block; width: 100px;">Tên sản phẩm:</span> 
              <span style="color: #333;">${product.name}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: inline-block; width: 100px;">Số lượng:</span>
              <span style="color: #333;">${item.quantity}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: inline-block; width: 100px;">Size:</span>
              <span style="color: #333;">${item.size}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: inline-block; width: 100px;">Màu sắc:</span>
              <span style="color: #333;">${item.color}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: inline-block; width: 100px;">Giá:</span>
              <span style="color: #333;">${this.formatPrice(
                item.price
              )} VND</span>
            </div>
          </div>
        </li>
      `;
    });

    const isPaid = [
      PAYMENT_METHODS.VNPAY,
      PAYMENT_METHODS.MOMO,
      PAYMENT_METHODS.ZALOPAY,
      PAYMENT_METHODS.SEPAY,
    ].includes(paymentMethod);

    emailContent += `
      </ul>
      <h4 style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px; font-size: 16px;">
        <span style="color: #555; font-weight: bold;">Tổng giá tiền thanh toán:</span> 
        <span style="color: #333; font-weight: bold;">${this.formatPrice(
          totalAmount
        )}</span>
        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; margin-left: 8px; font-size: 14px;
          ${
            isPaid
              ? "background-color: #e8f5e9; color: #2e7d32;"
              : "background-color: #fff3e0; color: #ef6c00;"
          }">
          (${isPaid ? "Đã thanh toán" : "Chưa Thanh Toán"})
        </span>
        VND
      </h4>
    </div>`;

    return emailContent;
  }

  async sendOrderEmail(email, emailContent) {
    const mailOptions = {
      from: process.env.EMAIL_USER || "dangtrinhduyanh100202@gmail.com",
      to: email,
      subject: "BẠN ĐÃ ĐẶT ĐƠN HÀNG THÀNH CÔNG TRÊN DOSIIN",
      html: emailContent,
    };

    try {
      const info = await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  async updateCartItems(CartId, idItems) {
    console.log(CartId, idItems);

    if (!CartId || !idItems?.length) return;

    const cartItem = await Cart.findOne({ _id: CartId });
    if (!cartItem) {
      throw new Error("Sản phẩm không có trong giỏ hàng");
    }

    const idsToDelete = idItems.map((id) => new mongoose.Types.ObjectId(id));
    const result = await Cart.updateOne(
      { _id: CartId },
      { $pull: { items: { _id: { $in: idsToDelete } } } }
    );
  }

  async updateVoucherUsage(idDiscount, userId) {
    if (!idDiscount) return;

    const voucher = await Voucher.findById(idDiscount);
    if (!voucher) return;

    voucher.usageLimit -= 1;
    voucher.usedCount += 1;

    const existingUser = voucher.appliedUsers.find(
      (u) => u.user.toString() === userId.toString()
    );

    if (existingUser) {
      existingUser.usedCount += 1;
    } else {
      voucher.appliedUsers.push({
        user: userId,
        usedCount: 1,
      });
    }

    await voucher.save();
  }

  async createNotifications(order, userId, username) {
    const nameProduct = order.items.map((item) => item.name);
    const productIdItem = order.items.map((item) => item.productId);
    const formattedProducts = productIdItem.map((id) => ({ productId: id }));

    // User notification
    const userNotification = new Notifications({
      userId,
      orderId: order._id,
      products: formattedProducts,
      isAdmin: false,
      message: `Bạn đã đặt hàng thành công với các sản phẩm và đang chờ shop xác nhận: ${nameProduct}`,
      isCheck: false,
    });

    await userNotification.save();

    // Admin notifications
    const admins = await Users.find({ role: "admin" });

    for (const admin of admins) {
      const adminNotification = new Notifications({
        userId: admin._id,
        orderId: order._id,
        products: formattedProducts,
        isAdmin: true,
        message: `Có một đơn hàng mới từ người dùng ${username}`,
        isCheck: true,
      });

      await adminNotification.save();
    }

    return { nameProduct, formattedProducts };
  }

  async processZaloPayPayment(totalAmount, id) {
    const transID = Math.floor(Math.random() * 1000000);
    const appTime = Date.now();

    const embed_data = {
      redirecturl: `http://localhost:5173/vnpay_return/${id}`,
      merchantinfo: "Doisin Store",
      promotioninfo: "",
      redirectdata: "",
      bankgroup: "ATM",
    };

    const items = [
      {
        itemid: "1",
        itemname: "Order Items",
        itemprice: totalAmount,
        itemquantity: 1,
      },
    ];

    const zaloOrder = {
      app_id: parseInt(config.app_id),
      app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
      app_time: appTime,
      app_user: "user123",
      amount: parseInt(totalAmount),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      callback_url:
        " https://870530fd17c2.ngrok-free.app/zalopay-callback".trim(),
      description: `Doisin - Payment for the order #${transID}`,
      bank_code: "",
      title: `Thanh toán đơn hàng #${transID}`,
    };

    const data = [
      config.app_id,
      zaloOrder.app_trans_id,
      zaloOrder.app_user,
      zaloOrder.amount,
      zaloOrder.app_time,
      zaloOrder.embed_data,
      zaloOrder.item,
    ].join("|");

    zaloOrder.mac = crypto
      .createHmac("sha256", config.key1)
      .update(data)
      .digest("hex");

    const result = await axios.post(config.endpoint, zaloOrder);

    if (result.data.return_code !== 1) {
      throw new Error(
        `${result.data.return_message}: ${result.data.sub_return_message}`
      );
    }

    return {
      EC: 0,
      success: true,
      orderUrl: result.data.order_url,
      transID: zaloOrder.app_trans_id,
      zp_trans_token: result.data.zp_trans_token,
    };
  }

  async processVNPayPayment(totalAmount, id) {
    const { vnp_TmnCode, vnp_HashSecret, vnp_ReturnUrl, vnp_Url } = process.env;

    if (!vnp_TmnCode || !vnp_HashSecret || !vnp_ReturnUrl) {
      throw new Error("Missing VNPay configuration.");
    }

    const createDate = moment().format("YYYYMMDDHHmmss");
    const orderId = moment().format("DDHHmmss");
    const amount = totalAmount * 100;

    let vnp_Params = {
      vnp_Amount: amount,
      vnp_Command: "pay",
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: "127.0.0.1",
      vnp_Locale: "vn",
      vnp_OrderInfo: encodeURIComponent(
        `Thanh toan don hang : ${orderId}`
      ).replace(/%20/g, "+"),
      vnp_OrderType: "other",
      vnp_ReturnUrl: `http://localhost:5173/vnpay_return/${id}`,
      vnp_TmnCode: vnp_TmnCode,
      vnp_TxnRef: orderId,
      vnp_Version: "2.1.0",
    };

    vnp_Params = this.sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    const vnpUrl = `${vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;

    console.log("vnpUrl", vnpUrl);

    return {
      EC: 0,
      message: "Order created successfully. Redirecting to VNPay.",
      vnpUrl: vnpUrl,
    };
  }

  async processMoMoPayment(totalAmount, id) {
    const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const orderInfo = "pay with MoMo";
    const partnerCode = "MOMO";
    const redirectUrl = `http://localhost:5173/vnpay_return/${id}`;
    const ipnUrl = `http://localhost:5173/vnpay_return/${id}`;
    const requestType = "payWithMethod";
    const orderId = partnerCode + new Date().getTime();
    const requestId = orderId;
    const extraData = "";
    const partnerName = "MoMo Payment";
    const storeId = "Test Store";
    const orderGroupId = "";
    const autoCapture = true;
    const lang = "vi";

    const rawSignature = `accessKey=${accessKey}&amount=${totalAmount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const payload = {
      partnerCode,
      partnerName,
      storeId,
      requestId,
      redirectUrl,
      amount: totalAmount,
      orderId,
      orderInfo,
      ipnUrl,
      lang,
      autoCapture,
      extraData,
      requestType,
      orderGroupId,
      signature,
    };

    const response = await axios.post(endpoint, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return {
      EC: 0,
      data: response.data,
    };
  }

  // Hàm xử lý thanh toán

  async processSePayPayment(totalAmount, orderId) {
    try {
      const transferContent = `ORDER${orderId}`; // Thay vì ORDER_${orderId}

      // ✅ TẠO QR CODE SỬ DỤNG VIETQR (KHÔNG CẦN API SEPAY)
      const qrUrl =
        `https://img.vietqr.io/image/` +
        `${SEPAY_CONFIG.bankCode}-${SEPAY_CONFIG.accountNumber}-compact2.jpg?` +
        `amount=${totalAmount}&` +
        `addInfo=${encodeURIComponent(transferContent)}&` +
        `accountName=${encodeURIComponent(SEPAY_CONFIG.accountName)}`;

      // ALTERNATIVE: SePay QR generator
      const sePayQrUrl =
        `https://qr.sepay.vn/img?` +
        `acc=${encodeURIComponent(SEPAY_CONFIG.accountNumber)}&` +
        `bank=${encodeURIComponent(SEPAY_CONFIG.bankCode)}&` +
        `amount=${encodeURIComponent(totalAmount)}&` +
        `des=${encodeURIComponent(transferContent)}`;
      console.log(sePayQrUrl);

      return {
        EC: 0,
        success: true,
        qrCodeUrl: qrUrl, // Dùng VietQR (ổn định hơn)
        sePayQrUrl: sePayQrUrl, // Backup SePay QR
        paymentCode: transferContent,
        amount: totalAmount,
        content: transferContent,
        orderId: orderId,
        accountInfo: {
          accountNumber: SEPAY_CONFIG.accountNumber,
          accountName: SEPAY_CONFIG.accountName,
          bankCode: SEPAY_CONFIG.bankCode,
          bankName: SEPAY_CONFIG.bankName,
        },
        instructions: {
          step1: "Mở ứng dụng ngân hàng trên điện thoại",
          step2: "Quét mã QR Code bên dưới",
          step3: "Kiểm tra thông tin và xác nhận chuyển tiền",
          step4: `Nội dung CK: ${transferContent}`,
          step5: "Đợi vài giây để hệ thống xác nhận thanh toán",
        },
      };
    } catch (error) {
      console.error("❌ Error creating payment QR:", error);
      return {
        success: false,
        message: "Không thể tạo mã QR thanh toán",
        error: error.message,
      };
    }
  }

  async deductStock(items) {
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      product.stock = Math.max(product.stock - item.quantity, 0);
      product.sold = (product.sold || 0) + item.quantity;

      for (const variant of product.variants) {
        if (variant.color === item.color) {
          for (const size of variant.sizes) {
            if (size.size === item.size) {
              size.quantity = Math.max(size.quantity - item.quantity, 0);
              size.sold = (size.sold || 0) + item.quantity;
            }
          }
        }
      }

      await product.save();
    }
  }

  sortObject(obj) {
    const sorted = {};
    const str = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }

    str.sort();

    for (let i = 0; i < str.length; i++) {
      const key = str[i];
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }

    return sorted;
  }
}

const CreateOrder = async (req, res) => {
  const orderService = new OrderService();

  try {
    // Validate request
    orderService.validateOrderRequest(req);

    const {
      userId,
      username,
      phone,
      items,
      shippingAddress,
      paymentMethod,
      email,
      CartId,
      discountValue,
      idDiscount,
      discountType,
      order_code,
      idItems,
    } = req.body;

    // Validate user
    await orderService.validateUser(userId);

    // Process items and calculate total
    const { processedItems, totalAmount } =
      await orderService.validateAndProcessItems(
        items,
        discountValue,
        discountType
      );

    // Generate email content
    const emailContent = orderService.generateEmailContent(
      processedItems,
      totalAmount,
      paymentMethod
    );

    // Create new order
    const newOrder = new Order({
      userId,
      username,
      phone,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      idDiscount,
      order_code,
      paymentStatus: [
        PAYMENT_METHODS.VNPAY,
        PAYMENT_METHODS.MOMO,
        PAYMENT_METHODS.ZALOPAY,
        PAYMENT_METHODS.SEPAY,
      ].includes(paymentMethod)
        ? PAYMENT_STATUS.COMPLETED
        : PAYMENT_STATUS.PENDING,
    });

    await newOrder.save();

    // Send email
    if (email) {
      await orderService.sendOrderEmail(email, emailContent);
    }

    // Update cart

    // Update voucher usage
    await orderService.updateVoucherUsage(idDiscount, userId);

    // Create notifications
    const { nameProduct } = await orderService.createNotifications(
      newOrder,
      userId,
      username
    );

    // Emit socket event
    const io = req.app.get("io");
    io.emit(`order-update-${newOrder.userId}`, {
      orderId: newOrder._id,
      status: "Shipping",
      data: newOrder,
      message: `Bạn đã đặt hàng thành công với các sản phẩm và đang chờ shop xác nhận: ${nameProduct.join(
        ", "
      )}`,
    });

    // Handle payment methods
    switch (paymentMethod) {
      case PAYMENT_METHODS.ZALOPAY:
        try {
          const ZaloPayResult = await orderService.processZaloPayPayment(
            totalAmount,
            newOrder._id
          );

          if (ZaloPayResult.EC === 0) {
            // Thanh toán thành công
            await orderService.deductStock(items);
            newOrder.paymentStatus = PAYMENT_STATUS.COMPLETED;
            await orderService.updateCartItems(CartId, idItems);
            await newOrder.save();
          }

          return res.status(200).json(ZaloPayResult);
        } catch (err) {
          console.error("ZaloPay payment error:", err.message);
          newOrder.paymentStatus = PAYMENT_STATUS.PENDING;
          await newOrder.save();
          return res.status(500).json({
            message: "ZaloPay payment failed",
            error: err.message,
          });
        }

      case PAYMENT_METHODS.VNPAY:
        try {
          const vnpResult = await orderService.processVNPayPayment(
            totalAmount,
            newOrder._id
          );

          if (vnpResult.EC === 0) {
            await orderService.deductStock(items);
            await orderService.updateCartItems(CartId, idItems);
            newOrder.paymentStatus = PAYMENT_STATUS.COMPLETED;
          }

          // VNPay trả về URL thanh toán, chưa trừ stock
          return res.status(200).json(vnpResult);
          // Stock sẽ được trừ trong callback khi vnp_ResponseCode === "00"
        } catch (err) {
          return res.status(500).json({
            message: "VNPay payment failed",
            error: err.message,
          });
        }

      case PAYMENT_METHODS.MOMO:
        try {
          const momoResult = await orderService.processMoMoPayment(
            totalAmount,
            newOrder._id
          );

          // Kiểm tra kết quả thanh toán
          if (momoResult?.data?.resultCode === 0) {
            await orderService.deductStock(items);
            newOrder.paymentStatus = PAYMENT_STATUS.COMPLETED;
            await orderService.updateCartItems(CartId, idItems);
            await newOrder.save();
          }

          return res.status(200).json(momoResult);
        } catch (err) {
          return res.status(500).json({
            message: "MoMo payment failed",
            error: err.message,
          });
        }

      case PAYMENT_METHODS.SEPAY:
        try {
          const momoResult = await orderService.processSePayPayment(
            totalAmount,
            newOrder._id
          );

          // Kiểm tra kết quả thanh toán
          if (momoResult.EC === 0) {
            await orderService.deductStock(items);
            newOrder.paymentStatus = PAYMENT_STATUS.PENDING;
            await orderService.updateCartItems(CartId, idItems);
            await newOrder.save();
          }

          return res.status(200).json(momoResult);
        } catch (err) {
          return res.status(500).json({
            message: "MoMo payment failed",
            error: err.message,
          });
        }

      case PAYMENT_METHODS.COD:
        // COD trừ stock ngay lập tức
        console.log(items);

        await orderService.deductStock(items);
        newOrder.paymentStatus = PAYMENT_STATUS.PENDING;
        await orderService.updateCartItems(CartId, idItems);
        await newOrder.save();
        return res.status(200).json({
          EC: 0,
          order_id: newOrder._id,
          paymentMethod: paymentMethod,
          message:
            "Order created successfully. Payment will be made upon delivery.",
        });

      default:
        throw new Error("Invalid payment method.");
    }
  } catch (error) {
    console.error("Error creating order:", error.message, error.stack);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const listOderUserId = async (req, res) => {
  try {
    let { userId } = req.params;

    let data = await Order.find({ userId: userId })
      .sort({
        createdAt: -1,
      })
      .populate("userId", "email name"); // chỉ lấy email và name

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return res.status(500).json({
      EC: "1",
      message: "Internal server error",
    });
  }
};

const UpDateConfirmed = async (req, res) => {
  try {
    const { id } = req.body;

    // Cập nhật trạng thái đơn hàng
    const order = await Order.findOneAndUpdate(
      { _id: id },
      {
        orderStatus: "Confirmed",
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Lấy danh sách sản phẩm từ đơn hàng
    const productIdItem = order.items.map((item) => item.productId);
    const nameProduct = order.items.map((item) => item.name);
    const formattedProducts = productIdItem.map((id) => ({ productId: id }));

    // Tạo thông báo cho người dùng
    const userNotification = new Notifications({
      userId: order.userId,
      orderId: order._id,
      products: formattedProducts,
      isAdmin: false,
      message: `Đơn hàng của bạn đã được người bán xác nhận đơn hàng: ${nameProduct.join(
        ", "
      )}`,
      isCheck: false,
      feedBack: true,
    });

    await userNotification.save();
    const io = req.app.get("io");
    io.emit(`order-update-${order.userId}`, {
      orderId: order._id,
      status: "Shipping",
      data: order,
      message: `Đơn hàng của bạn đã được người bán xác nhận đơn hàng: ${nameProduct.join(
        ", "
      )}`,
    });

    // Phản hồi API thành công
    return res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Đơn hàng đã được giao cho GHN Express
const UpDateDelivered = async (req, res) => {
  try {
    const { id } = req.body;

    // Cập nhật trạng thái đơn hàng
    const order = await Order.findOneAndUpdate(
      { _id: id },
      {
        orderStatus: "Shipping",
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Lấy danh sách sản phẩm từ đơn hàng
    const productIdItem = order.items.map((item) => item.productId);
    const nameProduct = order.items.map((item) => item.name);
    const formattedProducts = productIdItem.map((id) => ({ productId: id }));

    // Tạo thông báo cho người dùng
    const userNotification = new Notifications({
      userId: order.userId,
      orderId: order._id,
      products: formattedProducts,
      isAdmin: false,
      message: `Đơn hàng của bạn đã được shop giao bên vận chuyển thành công: ${nameProduct.join(
        ", "
      )}`,
      isCheck: false,
      feedBack: true,
    });

    await userNotification.save();
    const io = req.app.get("io");
    io.emit(`order-update-${order.userId}`, {
      orderId: order._id,
      status: "Shipping",
      data: order,
      message: `Đơn hàng của bạn đã được shop giao bên vận chuyển thành công: ${nameProduct.join(
        ", "
      )}`,
    });
    // Phản hồi API thành công
    return res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Đơn hàng đang trên đường giao đến bạn
const UpDateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOneAndUpdate(
      { _id: id },
      {
        orderStatus: "Delivered",
      },
      { new: true } // Chỉ định trả về đối tượng đã cập nhật
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const productIdItem = order.items.map((item) => item.productId);
    const nameProduct = order.items.map((item) => item.name);
    const formattedProducts = productIdItem.map((id) => ({ productId: id }));

    // Notification for user
    const userNotification = new Notifications({
      userId: order.userId,
      orderId: order._id,
      products: formattedProducts,
      isAdmin: false,
      message: `Đơn hàng đang trên đường giao đến bạn  : ${nameProduct}`,
      isCheck: false,
      feedBack: true,
    });
    await userNotification.save();

    const io = req.app.get("io");
    io.emit(`order-update-${order.userId}`, {
      orderId: order._id,
      status: "Shipping",
      data: order,
      message: `Đơn hàng đang trên đường giao đến bạn: ${nameProduct.join(
        ", "
      )}`,
    });
    res
      .status(200)
      .json({ message: "Order status updated and stock updated successfully" });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// giao hàng thành công
const UpDateCompleted = async (req, res) => {
  try {
    const { id } = req.body;
    const { totalPrice } = req.body;

    // Cập nhật trạng thái đơn hàng
    const order = await Order.findOneAndUpdate(
      { _id: id },
      {
        orderStatus: "Completed",
        paymentStatus: "Completed",
      },
      { new: true }
    );

    const user = await Users.findOneAndUpdate(
      { _id: order.userId },
      {
        $inc: { totalPrice: totalPrice }, // Sử dụng $inc để cộng dồn giá trị
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Cập nhật userGroup theo tổng tiền mới
    let updatedUserGroup = "newUser"; // Mặc định
    if (user.totalPrice >= 10000000) {
      updatedUserGroup = "elite";
    } else if (user.totalPrice >= 50000000) {
      updatedUserGroup = "loyalCustomer";
    } else if (user.totalPrice >= 10000000) {
      updatedUserGroup = "vip";
    } else if (user.totalPrice >= 1000000) {
      updatedUserGroup = "regular";
    }

    // Nếu userGroup thay đổi, cập nhật lại trong database
    if (user.userGroup !== updatedUserGroup) {
      user.userGroup = updatedUserGroup;
      await user.save(); // Lưu thay đổi
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Lấy danh sách sản phẩm từ đơn hàng
    const productIdItem = order.items.map((item) => item.productId);
    const nameProduct = order.items.map((item) => item.name);
    const formattedProducts = productIdItem.map((id) => ({ productId: id }));

    // Tạo thông báo cho người dùng
    const userNotification = new Notifications({
      userId: order.userId,
      orderId: order._id,
      products: formattedProducts,
      isAdmin: false,
      message: `Đơn hàng của bạn đã được giao bên vận chuyển giao thành công: ${nameProduct.join(
        ", "
      )}`,
      isCheck: false,
      feedBack: true,
    });

    await userNotification.save();
    const io = req.app.get("io");
    io.emit(`order-update-${order.userId}`, {
      orderId: order._id,
      status: "Shipping",
      data: order,
      message: `Đơn hàng của bạn đã được shop giao bên vận chuyển thành công: ${nameProduct.join(
        ", "
      )}`,
    });

    await Transaction.create({
      orderId: order._id,
      userId: order.userId,
      orderCode: order.order_code,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    });
    // Phản hồi API thành công
    return res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// tổng thu nhập

const getTotalProductsSold = async (req, res) => {
  try {
    const orders = await Order.find();

    const totalProductsSold = orders.reduce((total, order) => {
      return (
        total +
        order.items.reduce((orderTotal, item) => orderTotal + item.quantity, 0)
      );
    }, 0);

    res.status(200).json({
      message: "Total products sold retrieved successfully",
      totalProductsSold,
    });
  } catch (error) {
    console.error("Error retrieving total products sold:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// lấy tổng số lương sản phẩm bán
const getTotalProductsSoldByType = async (req, res) => {
  try {
    const orders = await Order.find();

    const productSales = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
        } else {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
          };
        }
      });
    });

    const salesArray = Object.values(productSales);

    res.status(200).json({
      message: "Total products sold by type retrieved successfully",
      productsSold: salesArray,
    });
  } catch (error) {
    console.error("Error retrieving total products sold by type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const ListOderProducts = async (req, res) => {
  try {
    let data = await Order.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const getOrderOneProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Order.findOne({ _id: id })
      .populate({
        path: "items.productId",
        select: "name variants.images discountedPrice slug",
      })
      .populate({
        path: "userId",
        select: "email ", // ép lấy email nếu có select: false
      });
    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

// cập nhật trạng thái đơn hàng (hủy đơn hàng)
const UpDateOrderStatus = async (req, res) => {
  try {
    let { id } = req.params;

    let orderStatus = req.body.orderStatus;

    if (!id || !orderStatus) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    if (!orderStatus) {
      return res.status(400).json({
        message: "Invalid order status. Only 'Cancelled' is allowed.",
      });
    }

    // socker

    const io = req.app.get("io");
    io.emit(`order-update-${id}`, {
      orderId: id,
      status: orderStatus,
      message: `Đơn hàng của bạn đã bị hủy`,
    });
    const order = await Order.findOneAndUpdate(
      { _id: id },
      { orderStatus: orderStatus },
      { new: true } // Chỉ định trả về đối tượng đã cập nhật
    );

    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (product) {
        // Cập nhật tổng số lượng tồn kho và đã bán
        product.stock = Math.max(product.stock + item.quantity, 0);
        product.sold = (product.sold || 0) + item.quantity;

        // Cập nhật theo biến thể (variant) và size
        for (const variant of product.variants) {
          if (variant.color === item.color) {
            for (const size of variant.sizes) {
              if (size.size === item.size) {
                size.quantity = Math.max(size.quantity + item.quantity, 0);
                size.sold = (size.sold || 0) + item.quantity;
              }
            }
          }
        }

        // Lưu lại sản phẩm đã cập nhật
        await product.save();
      } else {
        return res
          .status(404)
          .json({ message: `Product with ID ${item.productId} not found` });
      }
    }

    return res.status(200).json({
      EC: 0,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {}
};

const createRepurchaseOrder = async (req, res) => {
  try {
    let { id } = req.params;

    let orderStatus = req.body.orderStatus;

    if (!id || !orderStatus) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    if (!orderStatus) {
      return res.status(400).json({
        message: "Invalid order status. Only 'Cancelled' is allowed.",
      });
    }

    // socker

    const io = req.app.get("io");
    io.emit(`order-update-chase-${id}`, {
      orderId: id,
      status: orderStatus,
      message: `Đơn hàng của bạn đã bị hủy`,
    });
    const order = await Order.findOneAndUpdate(
      { _id: id },
      { orderStatus: orderStatus },
      { new: true } // Chỉ định trả về đối tượng đã cập nhật
    );

    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (product) {
        // Cập nhật tổng số lượng tồn kho và đã bán
        product.stock = Math.max(product.stock - item.quantity, 0);
        product.sold = (product.sold || 0) + item.quantity;

        // Cập nhật theo biến thể (variant) và size
        for (const variant of product.variants) {
          if (variant.color === item.color) {
            for (const size of variant.sizes) {
              if (size.size === item.size) {
                size.quantity = Math.max(size.quantity - item.quantity, 0);
                size.sold = (size.sold || 0) + item.quantity;
              }
            }
          }
        }

        // Lưu lại sản phẩm đã cập nhật
        await product.save();
      } else {
        return res
          .status(404)
          .json({ message: `Product with ID ${item.productId} not found` });
      }
    }

    return res.status(200).json({
      EC: 0,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {}
};

// lọc theo trạng thái đơn hàng

const filterOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params; // Lấy trạng thái từ tham số URL
    console.log(status);

    // Kiểm tra xem trạng thái có hợp lệ không
    const validStatuses = [
      "Processing", // Chờ xác nhận
      "Delivered", // duyêt đơn giao hàng (another state)
      "Shipping", // Giao hàng thanh công cho bên vận chyuyeenr
      "Completed", // Đã xong
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    // Tìm kiếm đơn hàng theo trạng thái
    const orders = await Order.find({ orderStatus: status });

    return res.status(200).json({
      EC: 0,
      data: orders,
    });
  } catch (error) {
    console.error("Error filtering orders by status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getListDallyOrder = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate(); // số ngày trong tháng

    // Lấy dữ liệu doanh số từ Mongo
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: "$createdAt" } },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          totalSales: 1,
        },
      },
      {
        $sort: { day: 1 },
      },
    ]);

    // Tạo mảng đầy đủ các ngày trong tháng
    const fullDailySales = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const found = dailySales.find((d) => d.day === day);
      return {
        day,
        totalSales: found ? found.totalSales : 0, // nếu không có thì = 0
      };
    });

    res.status(200).json({
      EC: 0,
      data: fullDailySales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      EC: 1,
      message: "Lỗi server khi lấy doanh số theo ngày",
    });
  }
};

module.exports = {
  CreateOrder,
  listOderUserId,
  getTotalProductsSold,
  getTotalProductsSoldByType,
  ListOderProducts,
  getOrderOneProduct,
  UpDateOrder,
  UpDateConfirmed,
  UpDateDelivered,
  UpDateCompleted,
  UpDateOrderStatus,
  filterOrdersByStatus,
  createRepurchaseOrder,
  getListDallyOrder,
};
