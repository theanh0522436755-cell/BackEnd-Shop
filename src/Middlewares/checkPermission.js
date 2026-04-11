const CheckPermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;

    // Admin được toàn quyền (tùy bạn muốn giữ hay không)
    if (user.role === "admin") {
      return next();
    }

    // Nhân viên cần có quyền cụ thể trong danh sách permissions
    if (user.role === "staff" && user.permissions?.includes(permission)) {
      return next();
    }

    return res
      .status(403)
      .json({ message: "Bạn không có quyền truy cập chức năng này" });
  };
};
module.exports = CheckPermission;
