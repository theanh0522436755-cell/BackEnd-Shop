const Wishlist = require("../Model/Wishlist");

const addToWishlist = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      const newWishlist = new Wishlist({
        user: userId,
        products: [{ product: productId }],
      });
      await newWishlist.save();
      return res
        .status(201)
        .json({ EC: 0, message: "Đã thêm sản phẩm vào danh sách yêu  thích" });
    } else {
      const productExists = wishlist.products.some(
        (item) => item.product.toString() === productId
      );
      if (productExists) {
        return res.status(400).json({
          EC: 1,
          message: "Sản phẩm đã tồn tại trong danh sách yêu thích",
        });
      } else {
        wishlist.products.push({ product: productId });
        await wishlist.save();
        return res.status(200).json({
          EC: 0,
          message: "Đã thêm sản phẩm vào danh sách yêu  thích",
        });
      }
    }
  } catch (err) {
    return res.status(500).json({
      message: "Lỗi khi thêm vào danh sách yêu thích",
    });
  }
};

const RemoveToWishList = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh sách yêu thích" });
    }

    const items = wishlist.products.filter(
      (item) => item.product.toString() !== productId
    );
    wishlist.products = items;
    await wishlist.save();
    return res
      .status(200)
      .json({ EC: 0, message: "Đã xóa sản phẩm khỏi danh sách yêu thích" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi khi xóa sản phẩm khỏi danh sách yêu thích" });
  }
};

const getWishlist = async (req, res) => {
  const { userId } = req.params;
  try {
    const wishlist = await Wishlist.findOne({ user: userId }).populate(
      "products.product"
    );

    if (!wishlist) {
      // Trả về rỗng thay vì 404
      return res.status(200).json({
        EC: 0,
        EM: "Success - Empty wishlist",
        data: {
          products: [],
        },
      });
    }

    return res.status(200).json({
      EC: 0,
      EM: "Success",
      data: wishlist,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi lấy danh sách yêu thích" });
  }
};

module.exports = {
  addToWishlist,
  RemoveToWishList,
  getWishlist,
};
