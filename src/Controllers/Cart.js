const Cart = require("../Model/Cart");
const Product = require("../Model/Product");

// ================== ADD SINGLE PRODUCT TO CART ==================
// ================== ADD SINGLE PRODUCT TO CART ==================
const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, size, color } = req.body;

    // ===== 1. Validate input =====
    if (!userId || !productId || !quantity) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // ===== 2. Check product existence =====
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // ===== 3. Get product price =====
    const productPrice = product.discountedPrice ?? product.price;
    if (!productPrice || isNaN(productPrice) || productPrice <= 0) {
      return res.status(400).json({ message: "Invalid product price." });
    }

    // ===== 4. Find or create cart =====
    let cart = await Cart.findOne({ userId });
    const totalItemPrice = productPrice * quantity;

    if (!cart) {
      // Create new cart if not exists
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            quantity,
            size,
            color,
            price: productPrice,
            totalItemPrice,
          },
        ],
        totalPrice: totalItemPrice,
      });
    } else {
      // Check if item already exists in cart
      const itemIndex = cart.items.findIndex(
        (item) =>
          item.productId.toString() === productId &&
          item.size === size &&
          item.color === color
      );

      if (itemIndex > -1) {
        // Update existing item
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].price = productPrice;
        cart.items[itemIndex].totalItemPrice = totalItemPrice;
      } else {
        // Add new item
        cart.items.push({
          productId,
          quantity,
          size,
          color,
          price: productPrice,
          totalItemPrice,
        });
      }

      // Update total price
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + (item.totalItemPrice || 0),
        0
      );
      cart.updatedAt = Date.now();
    }

    // ===== 5. Save cart =====
    await cart.save();

    return res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error in addToCart:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ================== ADD MULTIPLE PRODUCTS TO CART ==================
const addMultipleToCart = async (req, res) => {
  const { userId, items } = req.body;

  try {
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing userId or items" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0 });
    }

    await Promise.all(
      items.map(async (item) => {
        const productId =
          item.product?._id ||
          item.productId?._id ||
          item.productId ||
          item._id;

        const product = await Product.findById(productId);
        if (!product) return;

        const finalPrice = product.discountedPrice ?? product.price;
        const quantity = item.quantity ?? 1;
        const size = item.size ?? "S";
        const color = item.color ?? "đen";

        const itemIndex = cart.items.findIndex(
          (i) =>
            String(i.productId) === String(productId) &&
            i.size === size &&
            i.color === color
        );

        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += quantity; // cộng dồn
          cart.items[itemIndex].totalItemPrice =
            finalPrice * cart.items[itemIndex].quantity;
        } else {
          cart.items.push({
            productId,
            quantity,
            size,
            color,
            price: finalPrice,
            totalItemPrice: finalPrice * quantity,
          });
        }
      })
    );

    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + (item.totalItemPrice || 0),
      0
    );
    cart.updatedAt = Date.now();

    await cart.save();
    return res
      .status(200)
      .json({ message: "Added multiple items to cart", cart });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ================== GET CART PRODUCTS ==================
const getCartProduct = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "name variants.images variants.color variants.sizes",
    });

    // Luôn luôn trả về 200, không bao giờ 404 cho empty cart
    const cartData = cart || { userId, items: [], totalAmount: 0 };

    return res.status(200).json({
      EC: 0,
      EM: "Success",
      data: cartData,
    });
  } catch (error) {
    console.error("Cart error:", error);
    return res.status(500).json({
      EC: 1,
      EM: "Server error",
      data: null,
    });
  }
};

// ================== REMOVE ITEM FROM CART ==================
const RemoveCartProductfirst = async (req, res) => {
  try {
    const { itemId, cartId } = req.params;
    const { userId } = req.body;

    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res.status(400).json({ EC: "User's cart not found" });
    }

    if (String(userCart._id) !== cartId) {
      return res
        .status(400)
        .json({ EC: "Provided cartId does not match the user's cart" });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { _id: userCart._id },
      { $pull: { items: { _id: itemId } } },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ EC: "Cart or item not found" });
    }

    updatedCart.totalPrice = updatedCart.items.reduce(
      (total, item) => total + (item.totalItemPrice || 0),
      0
    );
    await updatedCart.save();

    return res
      .status(200)
      .json({ EC: "Xóa thành công sản phẩm", data: updatedCart });
  } catch (error) {
    console.error("Error removing item:", error);
    return res
      .status(400)
      .json({ EC: "Error removing item", error: error.message });
  }
};

// ================== UPDATE ITEM QUANTITY ==================
const UpdateCartQuantity = async (req, res) => {
  try {
    const { itemId, cartId } = req.params;
    const { userId, quantity } = req.body;

    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res.status(400).json({ EC: -1, message: "User's cart not found" });
    }

    if (String(userCart._id) !== cartId) {
      return res.status(400).json({
        EC: -1,
        message: "Provided cartId does not match the user's cart",
      });
    }

    const foundItem = userCart.items.find(
      (item) => String(item._id) === itemId
    );
    if (!foundItem) {
      return res
        .status(404)
        .json({ EC: -1, message: "Item not found in cart" });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { _id: cartId, "items._id": itemId },
      {
        $set: {
          "items.$.quantity": quantity,
          "items.$.totalItemPrice": quantity * foundItem.price,
        },
      },
      { new: true }
    );

    updatedCart.totalPrice = updatedCart.items.reduce(
      (total, item) => total + (item.totalItemPrice || 0),
      0
    );
    await updatedCart.save();

    return res.status(200).json({
      EC: 0,
      message: "Cập nhật số lượng thành công",
      data: updatedCart,
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return res.status(400).json({
      EC: -1,
      message: "Error updating cart quantity",
      error: error.message,
    });
  }
};

module.exports = {
  addToCart,
  addMultipleToCart,
  getCartProduct,
  RemoveCartProductfirst,
  UpdateCartQuantity,
};
