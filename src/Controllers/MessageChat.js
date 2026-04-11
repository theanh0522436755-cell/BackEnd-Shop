const Message = require("../Model/Message");
const { uploadFileToCloudinary } = require("../services/Cloudinary");
const {
  sendMessageToAdmin,
  sendMessageToCustomer,
} = require("./../services/Message");

// Gửi tin nhắn từ khách hàng  đến admin
const sendMessageCutomerAPI = async (req, res) => {
  try {
    const { sender, content, isAdminChat } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        EC: 1,
        message: "Message content is required",
      });
    }

    const imageUrl = [];

    if (req.files?.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (const file of files) {
        const resultImage = await uploadFileToCloudinary(file);

        resultImage.forEach((images) => {
          imageUrl.push(images.secure_url);
        });
      }
    }

    const newMessage = await sendMessageToAdmin(
      sender,
      content,
      imageUrl,
      isAdminChat
    );

    // Use the io instance attached to req
    const io = req.app.get("io");
    io.emit("newMessage", newMessage);

    return res.status(200).json({
      EC: 0,
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      EC: 1,
      message: "An error occurred while sending the message",
      error: error.message,
    });
  }
};

// / Gửi tin nhắn từ admin đến khách hàng
const sendMessageToAdminAPI = async (req, res) => {
  try {
    const { sender, recipient, content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        EC: 1,
        message: "Message content is required",
      });
    }

    const imageUrl = [];

    if (req.files?.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (const file of files) {
        const resultImage = await uploadFileToCloudinary(file);
        console.log("resultImage", resultImage);

        resultImage.forEach((images) => {
          imageUrl.push(images.secure_url);
        });
      }
    }

    // Ensure recipient (customer) is provided
    if (!recipient) {
      return res.status(400).json({
        EC: 1,
        message: "Recipient (customer) is required",
      });
    }

    // Send message from admin to customer
    const newMessage = await sendMessageToCustomer(
      sender,
      recipient,
      content,
      imageUrl
    );

    // Use the io instance attached to req to emit the event
    const io = req.app.get("io");
    io.emit("newMessage", newMessage);

    return res.status(200).json({
      EC: 0,
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      EC: 1,
      message: "An error occurred while sending the message",
      error: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { userId, adminId } = req.query;

    if (!userId || !adminId) {
      return res.status(400).json({
        EC: 1,
        message: "userId and adminId are required",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: adminId },
        { sender: adminId, recipient: userId },
      ],
    })
      .sort({ sentAt: 1 })
      .populate({
        path: "sender", // Populate người gửi
        select: "avatar name", // Chỉ lấy avatar và name của người gửi
      })
      .populate({
        path: "recipient", // Populate người nhận
        select: "avatar name", // Chỉ lấy avatar và name của người nhận
      });
    return res.status(200).json({
      EC: 0,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      EC: 1,
      message: "Unable to fetch messages",
      error: error.message,
    });
  }
};

const getMessagesList = async (req, res) => {
  try {
    const { userId } = req.query; // userId là người nhận (recipient)

    if (!userId) {
      return res.status(400).json({
        EC: 1,
        message: "userId is required",
      });
    }

    // Truy vấn tin nhắn và nhóm theo sender
    const senders = await Message.find({ recipient: userId })
      .populate({
        path: "sender", // Trường tham chiếu đến người gửi
        select: "avatar name", // Chỉ lấy avatar và name
      })
      .sort({ sentAt: -1 });

    return res.status(200).json({
      EC: 0,
      data: senders, // Trả về danh sách người gửi
    });
  } catch (error) {
    console.error("Error fetching senders:", error);
    return res.status(500).json({
      EC: 1,
      message: "Unable to fetch senders",
      error: error.message,
    });
  }
};

const UpdateStatusIsRead = async (req, res) => {
  try {
    const { sender, recipient } = req.body;
    console.log(recipient, sender);

    // Kiểm tra sender và recipient
    if (!sender || !recipient) {
      return res.status(400).json({ message: "Missing sender or recipient" });
    }

    // Cập nhật tất cả tin nhắn từ sender tới recipient
    const result = await Message.updateMany(
      { sender, recipient, isRead: false }, // Chỉ cập nhật tin nhắn chưa đọc
      { $set: { isRead: true } } // Cập nhật trường isRead thành true
    );

    console.log(result);

    // Kiểm tra nếu không có tin nhắn nào được cập nhật
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "No unread messages found" });
    }

    // Trả về phản hồi thành công
    res.status(200).json({
      message: "Messages updated successfully",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    // Xử lý lỗi
    res.status(500).json({ message: error.message });
  }
};

const getMessagesSenderList = async (req, res) => {
  try {
    const { sender } = req.params;

    // sender là userId của người dùng hiện tại
    if (!sender) {
      return res.status(400).json({
        EC: 1,
        message: "userId is required",
      });
    }

    // Truy vấn tin nhắn mà người dùng hiện tại (sender) gửi hoặc nhận
    const messages = await Message.find({
      $or: [
        { sender: sender }, // Tin nhắn mà user gửi
        { recipient: sender }, // Tin nhắn mà user nhận
      ],
    })
      .populate({
        path: "sender", // Lấy thông tin người gửi
        select: "avatar name",
      })
      .populate({
        path: "recipient", // Lấy thông tin người nhận
        select: "avatar name",
      })
      .sort({ sentAt: -1 }); // Sắp xếp theo thời gian, mới nhất trước

    // Nhóm tin nhắn theo người liên quan và lấy tin nhắn mới nhất
    const conversations = {};
    messages.forEach((message) => {
      // Bỏ qua nếu sender hoặc recipient bị null
      if (!message.sender || !message.recipient) return;

      const otherUserId =
        message.sender._id.toString() === sender
          ? message.recipient._id.toString()
          : message.sender._id.toString();

      if (
        !conversations[otherUserId] ||
        new Date(message.sentAt) > new Date(conversations[otherUserId].sentAt)
      ) {
        conversations[otherUserId] = {
          recipient:
            message.sender._id.toString() === sender
              ? message.recipient
              : message.sender,
          messageSender: message.sender,
          content: message.content,
          sentAt: message.sentAt,
          isRead: message.isRead || false,
        };
      }
    });

    // Chuyển đổi object conversations thành mảng để trả về
    const senderList = Object.values(conversations);

    return res.status(200).json({
      EC: 0,
      data: senderList, // Trả về danh sách các cuộc trò chuyện
    });
  } catch (error) {
    console.error("Error in getMessagesSenderList:", error);
    return res.status(500).json({
      EC: 1,
      message: "Internal server error",
    });
  }
};
module.exports = {
  sendMessageCutomerAPI,
  sendMessageToAdminAPI,
  getMessages,
  getMessagesList,
  UpdateStatusIsRead,
  getMessagesSenderList,
};
