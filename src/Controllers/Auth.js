const { uploadFileToCloudinary } = require("./../services/Cloudinary");
const {
  RegisterUser,
  LoginUser,
  getRandomAdmin,
  isAccountUserLocker,
} = require("./../services/Auth");
const Users = require("./../Model/User");
const Product = require("./../Model/Product");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const ResetToken = require("../Model/ResetToken");
require("dotenv").config;

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "dangtrinhduyanh100202@gmail.com",
    pass: "qfmc zizc ppdg ldjg",
  },
});
const RegisterUserAPI = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;
    const startsWithUppercase = /^[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!startsWithUppercase || !hasSpecialChar) {
      return res.status(400).json({
        EC: 1,
        EM: "Mật khẩu phải bắt đầu bằng chữ in hoa và chứa ít nhất một ký tự đặc biệt",
      });
    }

    let avatarUrl =
      "https://mcdn.coolmate.me/image//October2023/mceclip3_72.png";

    const dataUser = await RegisterUser(
      name,
      email,
      password,
      isAdmin,
      avatarUrl
    );

    // Trường hợp email đã tồn tại
    if (!dataUser.success) {
      return res.status(400).json({
        EC: 1,
        EM: dataUser.message,
      });
    }

    return res.status(200).json({
      EC: 0,
      EM: "Đăng ký thành công",
      data: dataUser.user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      EC: -1,
      EM: "Lỗi máy chủ",
    });
  }
};

const RegisterUserAPI_Alternative = async (req, res) => {
  try {
    const { name, email, password, role, permissions, avatar } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        EC: 1,
        EM: "Vui lòng điền đầy đủ thông tin: name, email, password, role",
      });
    }

    // Kiểm tra role hợp lệ
    const validRoles = ["customer", "admin", "staff"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        EC: 1,
        EM: "Role không hợp lệ. Chỉ chấp nhận: customer, admin, staff",
      });
    }

    // Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        EC: 1,
        EM: "Email không hợp lệ",
      });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await Users.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        EC: 1,
        EM: "Email đã được sử dụng",
      });
    }

    // Validation mật khẩu khác nhau cho admin và customer
    if (role === "admin" || role === "staff") {
      // Yêu cầu mật khẩu mạnh hơn cho admin/staff
      const startsWithUppercase = /^[A-Z]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const hasNumber = /\d/.test(password);

      if (password.length < 8) {
        return res.status(400).json({
          EC: 1,
          EM: `Mật khẩu ${role} phải có ít nhất 8 ký tự`,
        });
      }

      if (!startsWithUppercase || !hasSpecialChar || !hasNumber) {
        return res.status(400).json({
          EC: 1,
          EM: `Mật khẩu ${role} phải bắt đầu bằng chữ in hoa, chứa ít nhất một ký tự đặc biệt và một số`,
        });
      }
    } else if (role === "customer") {
      // Yêu cầu mật khẩu đơn giản hơn cho customer
      if (password.length < 6) {
        return res.status(400).json({
          EC: 1,
          EM: "Mật khẩu phải có ít nhất 6 ký tự",
        });
      }
    }

    // Hash mật khẩu trước khi lưu

    // Tạo user mới với model Users
    const newUser = new Users({
      name: name,
      email: email,
      password: password, // Lưu mật khẩu đã hash
      avatar:
        avatar || "https://mcdn.coolmate.me/image//October2023/mceclip3_72.png",
      role: role,
      permissions: permissions, // Default là array rỗng nếu không có permissions
    });

    // Lưu vào database
    const savedUser = await newUser.save();

    return res.status(201).json({
      // 201 cho tạo mới thành công
      EC: 0,
      EM: `Đăng ký ${role} thành công`,
      data: {
        savedUser,
      },
    });
  } catch (error) {
    console.log("Registration error:", error);

    // Xử lý các loại lỗi cụ thể
    if (error.name === "ValidationError") {
      return res.status(400).json({
        EC: 1,
        EM: "Dữ liệu không hợp lệ: " + error.message,
      });
    }

    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res.status(400).json({
        EC: 1,
        EM: "Email đã tồn tại trong hệ thống",
      });
    }

    return res.status(500).json({
      EC: -1,
      EM: "Lỗi máy chủ",
    });
  }
};

const LoginUserAPI = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await LoginUser(email, password);

    return res.status(200).json({
      EC: 0,
      data: {
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
      },
    });
  } catch (error) {
    return res.status(400).json({
      EC: error.EC || 1, // Nếu error có EC riêng thì dùng
      message: error.message,
    });
  }
};

const ListUserAPI = async (req, res) => {
  try {
    const users = await Users.find({});

    return res.status(200).json({
      EC: 0,
      data: users,
    });
  } catch (error) {
    console.log(error);
  }
};

const ListOneUserAPI = async (req, res) => {
  const { id } = req.query;

  const users = await Users.findOne({ _id: id });

  return res.status(201).json({
    EC: 0,
    data: users,
  });
};

// uploadprofile

const UpDateProfileUserAPI = async (req, res) => {
  try {
    const {
      id,
      name,
      city,
      district,
      ward,
      phone,
      gender,
      dateOfBirth,
      height,
      weight,
      role,
      permissions,
    } = req.body;

    console.log(
      id,
      name,
      city,
      district,
      ward,
      phone,
      gender,
      dateOfBirth,
      height,
      weight,
      role,
      permissions
    );

    const avatar = req.files?.avatar;

    console.log(avatar);

    // Tìm người dùng
    const UpdateUser = await Users.findById(id);

    if (!UpdateUser) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    let rolePermissions = UpdateUser.permissions;
    if (role === "customer") {
      rolePermissions = "customer";
    }
    // Cập nhật dữ liệu
    const updatedData = {
      name: name || UpdateUser.name,
      "address.city": city || UpdateUser.address.city,
      "address.district": district || UpdateUser.address.district,
      "address.ward": ward || UpdateUser.address.ward,
      phone: phone || UpdateUser.phone,
      gender: gender || UpdateUser.gender,
      dateOfBirth: dateOfBirth || UpdateUser.dateOfBirth,
      height: height || UpdateUser.height,
      weight: weight || UpdateUser.weight,
      role: role || UpdateUser.role,
      permissions:
        role === "customer"
          ? rolePermissions
          : permissions || UpdateUser.permissions || "",
    };

    // Nếu có avatar mới
    if (avatar) {
      try {
        const result = await uploadFileToCloudinary(avatar);
        updatedData.avatar = result[0].secure_url;
      } catch (err) {
        return res.status(500).json({ error: "Tải ảnh lên thất bại" });
      }
    }

    // Cập nhật trong DB
    const updatedUser = await Users.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    return res
      .status(200)
      .json({ message: "Cập nhật thành công", user: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// cập nhật mật khẩu
const ChanglePasswordAPI = async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body;

    if (!id || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Thiếu thông tin cần thiết" });
    }

    const user = await Users.findById(id);

    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    // so sánh mật khẩu cũ

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu cũ không chính xác",
      });
    }

    // Cập nhật mật khẩu
    user.password = newPassword;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {}
};

const Forgotpassword = async (req, res) => {
  try {
    let { email } = req.body;

    // Tìm người dùng theo email
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Email không tồn tại" });
    }

    // tạo token ngẫu nhiên

    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    // Lưu token vào DB
    const resetToken = new ResetToken({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
    });
    await resetToken.save();

    const resetLink = `https://mta-shop.vercel.app/reset-password?token=${token}`;

    // Thiết lập transporter để gửi email
    let transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Thiết lập thông tin email
    const mailOptions = {
      from: `"Shop Duy Anh" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset mật khẩu",
      html: `<p>Nhấn vào link để đặt lại mật khẩu (10 phút):</p><a href="${resetLink}">${resetLink}</a>`,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    return res.json({ message: "Đã gửi email reset password" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};

const ResetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ EC: 1, message: "Thiếu token hoặc mật khẩu mới" });
  }

  try {
    // Kiểm tra token trong DB
    const resetToken = await ResetToken.findOne({ token });
    if (!resetToken) {
      return res
        .status(400)
        .json({ EC: 1, message: "Token không hợp lệ hoặc đã sử dụng" });
    }

    // Xác thực token bằng JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user
    const user = await Users.findById(payload._id);
    if (!user) {
      return res
        .status(404)
        .json({ EC: 1, message: "Người dùng không tồn tại" });
    }

    // Hash mật khẩu mới

    user.password = newPassword;
    await user.save();

    // Xoá token để không dùng lại
    await ResetToken.deleteOne({ _id: resetToken._id });

    return res.json({ EC: 0, message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("Lỗi reset mật khẩu:", err);
    return res
      .status(400)
      .json({ EC: 1, message: "Token hết hạn hoặc không hợp lệ" });
  }
};

const checkRestToken = async (req, res) => {
  const { token } = req.params;

  try {
    // Tìm trong DB
    const resetToken = await ResetToken.findOne({ token });
    if (!resetToken) {
      return res
        .status(400)
        .json({ valid: false, message: "Token không tồn tại hoặc đã dùng" });
    }

    // Verify JWT có hết hạn chưa
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.json({ valid: true, message: "Token hợp lệ" });
    } catch (err) {
      return res
        .status(400)
        .json({ valid: false, message: "Token đã hết hạn" });
    }
  } catch (err) {
    return res.status(500).json({ valid: false, message: "Lỗi server" });
  }
};

// gửi mã otp

// đăng ký

const otpStore = {}; // { email: { otp, expires } }

const sendOTP = async (req, res) => {
  const { email } = req.body;

  // Kiểm tra email đã tồn tại chưa
  const isEmail = await Users.findOne({ email: email });
  if (isEmail) {
    return res.status(400).json({
      EC: 1,
      EM: "Email đã tồn tại",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chữ số

  // Lưu OTP kèm thời gian hết hạn
  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000, // 5 phút
  };

  try {
    await transporter.sendMail({
      from: `"Duy Anh Shop" <your-email@gmail.com>`, // ghi đúng định dạng from
      to: email,
      subject: "Mã OTP xác thực tài khoản",
      text: `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 5 phút.`,
    });

    return res.status(200).json({
      EC: 0,
      EM: "Đã gửi OTP thành công",
    });
  } catch (error) {
    console.error("Lỗi gửi OTP:", error);
    return res.status(500).json({
      EC: -1,
      EM: "Lỗi khi gửi OTP",
    });
  }
};

const verifyOTPAndRegister = async (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res
      .status(400)
      .json({ EC: 1, EM: "OTP không hợp lệ hoặc đã hết hạn" });
  }

  delete otpStore[email]; // xoá OTP sau khi xác thực
  return await RegisterUserAPI(req, res); // gọi hàm tạo tài khoản
};

const DeleteUser = async (req, res) => {
  try {
    let { id } = req.params;

    const user = await Users.deleteOne({ _id: id });

    await Product.updateMany({}, { $pull: { ratings: { userId: id } } });

    const io = req.app.get("io");
    io.emit("userDeleted", { userId: id }); // phát đến toàn bộ client
    return res.status(201).json({
      EC: 0,
      message: "Bạn đã xóa thành công tài khoản",
      data: user,
    });
  } catch (error) {}
};

const changeUserPassword = async (req, res) => {
  try {
    const { email, password, passwordAdmin, adminEmail } = req.body;

    // 1. Tìm admin theo email
    const admin = await Users.findOne({ email: adminEmail, role: "admin" });
    if (!admin) {
      return res
        .status(404)
        .json({ message: "Đây không phải là tài khoản admin" });
    }

    // 2. Kiểm tra mật khẩu admin
    const isAdminPasswordValid = await admin.comparePassword(passwordAdmin);
    if (!isAdminPasswordValid) {
      return res.status(403).json({ message: "Nhập sai mật khẩu của admin" });
    }

    // 3. Tìm user cần đổi mật khẩu
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tồn tại user này" });
    }

    // 4. Cập nhật mật khẩu mới
    user.password = password;
    await user.save();

    return res.status(200).json({ message: "Cập nhật mật khẩu thành công" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getRandomAdminAPI = async (req, res) => {
  try {
    const data = await getRandomAdmin();

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const isAccountUserLockerAPI = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAccountLocked } = req.body;
    const user = await Users.findById(userId); // giả sử bạn có hàm này
    if (!user) {
      return res.status(404).json({ message: "Không tồn tại user" });
    }

    // Kiểm tra nếu user là admin
    if (user.role === "admin") {
      return res.status(403).json({
        EC: 1,
        message: "Không thể khóa tài khoản admin",
      });
    }

    const data = await isAccountUserLocker(userId, isAccountLocked);

    return res.status(201).json({
      EC: 0,
      message: isAccountLocked
        ? "Khóa tài khoản thành công"
        : "Mở khóa tài khoản thành công",
      data: data,
    });
  } catch (error) {
    return res.status(404).json({ message: "Không tồn tại user" });
  }
};

// lấy mật khẩu qua maill

const sendPasswordRecoveryEmail = async (req, res) => {
  try {
    const { email, passwordAdmin, adminEmail } = req.body;

    // 1. Tìm admin theo email
    const admin = await Users.findOne({ email: adminEmail, role: "admin" });
    if (!admin) {
      return res
        .status(404)
        .json({ message: "Đây không phải là tài khoản admin" });
    }

    // 2. Kiểm tra mật khẩu admin
    const isAdminPasswordValid = await admin.comparePassword(passwordAdmin);
    if (!isAdminPasswordValid) {
      return res.status(403).json({ message: "Nhập sai mật khẩu của admin" });
    }

    // 3. Tìm user cần đổi mật khẩu
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tồn tại user này" });
    }

    // Hàm random mật khẩu
    const generatePassword = () =>
      (
        ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789", "!@#$%^&*"]
          .map((set) => set[Math.floor(Math.random() * set.length)])
          .join("") +
        Array.from(
          { length: 5 },
          () =>
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"[
              Math.floor(Math.random() * 70)
            ]
        ).join("")
      )
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");

    // 4. Tạo mật khẩu mới và cập nhật
    const newPassword = generatePassword();
    user.password = newPassword;
    await user.save();

    // 5. Gửi email
    await transporter.sendMail({
      from: `Duy Anh Shop <no-reply@duyanhshop.com>`,
      to: email,
      subject: "Khôi phục mật khẩu tài khoản",
      text: `Mật khẩu mới của bạn là: ${newPassword} Vui lòng đăng nhập và đổi lại mật khẩu trong trang cá nhân.`,
    });

    return res.status(200).json({ message: "Cập nhật mật khẩu thành công" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  RegisterUserAPI,
  LoginUserAPI,
  ListUserAPI,
  ListOneUserAPI,
  UpDateProfileUserAPI,
  ChanglePasswordAPI,
  Forgotpassword,
  ResetPassword,
  DeleteUser,
  sendOTP,
  verifyOTPAndRegister,
  changeUserPassword,
  getRandomAdminAPI,
  checkRestToken,
  RegisterUserAPI_Alternative,
  isAccountUserLockerAPI,
  sendPasswordRecoveryEmail,
};
