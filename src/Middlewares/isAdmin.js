const isAdmin = (req, res, next) => {
  const user = req.user;

  if (user.role === "admin") {
    return next(); // Admin được phép
  }

  return res
    .status(403)
    .json({ message: "Chỉ admin mới được truy cập chức năng này" });
};

module.exports = isAdmin;
