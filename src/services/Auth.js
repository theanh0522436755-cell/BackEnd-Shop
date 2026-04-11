const Users = require("./../Model/User");
const jwt = require("jsonwebtoken");
require("dotenv").config;

// RegisterUser.js
const RegisterUser = async (name, email, password, isAdmin = false, avatar) => {
  try {
    const existingUser = await Users.findOne({ email });
    console.log(existingUser);
    if (existingUser) {
      return {
        success: false,
        message: "Email đã tồn tại",
      };
    }

    const newUser = new Users({ name, email, password, isAdmin, avatar });
    await newUser.save();

    return {
      success: true,
      user: newUser,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

const LoginUser = async (email, password) => {
  try {
    const user = await Users.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      const err = new Error("Vui lòng nhập đúng mật khẩu hoặc tài khoản");
      err.EC = 1;
      throw err;
    }

    if (user.isAccountLocked) {
      const err = new Error("Tài khoản của bạn đã bị khóa");
      err.EC = -1;
      throw err;
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    return {
      token,
      refreshToken,
      user: user,
    };
  } catch (error) {
    throw error;
  }
};

const RefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await Users.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token: newAccessToken });
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

const getRandomAdmin = async () => {
  try {
    const admins = await Users.find({
      $or: [
        { role: "admin" }, // lấy tất cả admin
        { role: "staff", permissions: "customer_support" }, // chỉ staff thỏa điều kiện
      ],
    }).select("_id name role");

    return admins;
  } catch (error) {
    console.log(error);
  }
};
const isAccountUserLocker = async (userId, isAccountLocked) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Lấy user hiện tại
    const existingUser = await Users.findById(userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Nếu là admin thì không được phép khóa
    if (existingUser.role === "admin") {
      throw new Error(
        "Cannot lock admin account. Admin accounts cannot be locked for security reasons."
      );
    }

    // Nếu không phải admin thì thực hiện khóa/mở khóa
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { isAccountLocked: isAccountLocked },
      { new: true }
    );

    return {
      success: true,
      user: updatedUser,
      message: isAccountLocked
        ? "Account has been locked successfully"
        : "Account has been unlocked successfully",
    };
  } catch (error) {
    console.error("Error in isAccountUserLocker:", error);

    // Trả về error với format nhất quán
    return {
      success: false,
      error: error.message,
      user: null,
    };
  }
};
module.exports = {
  RegisterUser,
  LoginUser,
  RefreshToken,
  getRandomAdmin,
  isAccountUserLocker,
};
