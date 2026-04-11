const express = require("express");

const verifyToken = require("../Middlewares/auth");
const checkPermission = require("../Middlewares/checkPermission");
const isAdmin = require("../Middlewares/isAdmin");
const RouterAPI = express.Router();
const {
  AddProductsAPI,
  ListProductsAPI,
  ListOneProductAPI,
  UpdateProductsAPI,
  PutFeedbackProductAPI,
  PutFeedbackProductsAPI,
  CategoryGenderAPI,
  CategoryGenderFitterAPI,
  toggleLikeRatingAPI,
  toggleLikeReply,
  ListSlugProductAPI,
  AddProductsFromExcelAPI,
  updateViewProductController,
  DeleteRatingProductController,
  deleteOneProduct,
  getTopSellingProductsByCategory,
  DeleteImageProduct,
  exportProductsToExcel,
} = require("./../Controllers/Products");
const {
  CreateCategoryAPI,
  ListCategoryAPI,
  ListCategoryOneAPI,
  UpdateOneCatogryAPI,
  DeleteOneCategoryAPI,
} = require("../Controllers/Category");

const {
  RegisterUserAPI,
  LoginUserAPI,
  ListUserAPI,
  ListOneUserAPI,
  UpDateProfileUserAPI,
  Forgotpassword,
  ChanglePasswordAPI,
  DeleteUser,
  sendOTP,
  verifyOTPAndRegister,
  changeUserPassword,
  getRandomAdminAPI,
  ResetPassword,
  checkRestToken,
  RegisterUserAPI_Alternative,
  isAccountUserLockerAPI,
  sendPasswordRecoveryEmail,
} = require("./../Controllers/Auth");
const {
  addToCart,
  getCartProduct,
  RemoveCartProductfirst,
  UpdateCartQuantity,
  addMultipleToCart,
} = require("./../Controllers/Cart");
const {
  CreateOrder,
  listOderUserId,
  UpDateOrder,
  getTotalProductsSoldByType,
  ListOderProducts,
  getTotalProductsSold,
  getOrderOneProduct,
  UpDateDelivered,
  UpDateCompleted,
  UpDateOrderStatus,
  filterOrdersByStatus,
  UpDateConfirmed,
  createRepurchaseOrder,
  getListDallyOrder,
} = require("../Controllers/Oder");

const { searchProductsByNameAPI } = require("../Controllers/SearchProductsAPI");
const { BotChatAPI } = require("../Controllers/BotChatApi");

const {
  getNotificationsAPI,
  updateReadNocatifionsAPI,
  AllReadNotificationsAPI,
  DeleteAllNotificationsAPI,
} = require("../Controllers/Notifications");

/// mess

const {
  sendMessageCutomerAPI,
  getMessages,
  sendMessageToAdminAPI,
  getMessagesList,
  UpdateStatusIsRead,
  getMessagesSenderList,
} = require("./../Controllers/MessageChat");

const {
  addVoucherAPI,
  listVoucherAPI,
  getListOneVoucherAPI,
  updateVoucher,
  getListVoucherByUserId,
} = require("../Controllers/Voucher");
const { RefreshToken } = require("../services/Auth");
const {
  addToWishlist,
  getWishlist,
  RemoveToWishList,
} = require("../Controllers/WishList");
const {
  createBlogController,
  updateBlogController,
  getAllBlogController,
  getDetailSlugController,
  newUpdateBlogAPI,
  deleteBlogController,
} = require("../Controllers/Blog");
const {
  handleGeminiRequest,
  generateBlogByGemini,
  generateTryOn,
} = require("../Controllers/Gemini");
const {
  CreateSupplierAPI,
  FindAllSupplierAPI,
  FindOneIdSupplierAPI,
  UpdateSupplierAPI,
  deleteSupplierAPI,
} = require("../Controllers/Supplier");
const {
  CreateBannerController,
  UpdateBannerController,
  DeleteBannerController,
  ListsBannerController,
  FindOneBannerController,
  CheckIsActiveBannerController,
} = require("../Controllers/Banner");
const {
  getRevenue,
  exportTransactionsExcel,
} = require("../Controllers/Transaction");
const {
  createChangeModelAPI,
  getChangeModelAPI,
  updateChangeModelAPI,
  DeletehangeModelAPI,
} = require("../Controllers/Change");
const {
  createSizeGuideModel,
  getSizeGuideModel,
  addOneSize,
  updateOneSize,
  deleteOneSize,
} = require("../Controllers/SizeGuide");
const {
  deleteOnePantsSize,
  getPantsSizeGuide,
  addOnePantsSize,
  updateOnePantsSize,
} = require("../Controllers/pantsSizeController");
const {
  createColorModel,
  updatedColorModel,
  listColorModel,
  deleteColorModel,
} = require("../Controllers/Color");

RouterAPI.get(
  "/products/export-excel",
  verifyToken,
  isAdmin,
  exportProductsToExcel
);
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Thêm mới một sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Áo sơ mi nam
 *               price:
 *                 type: number
 *                 example: 250000
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 */

RouterAPI.get("/products", ListProductsAPI);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Thêm mới một sản phẩm
 *     tags: [Products]
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 */

RouterAPI.post("/products", verifyToken, isAdmin, AddProductsAPI);

// thêm sản phẩm mới bằng execl
RouterAPI.post(
  "/products/excel",
  verifyToken,
  isAdmin,
  AddProductsFromExcelAPI
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết của một sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID của sản phẩm
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm
 */
RouterAPI.get("/products/:id", ListOneProductAPI);

RouterAPI.get("/products-slug/:slug", ListSlugProductAPI);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Cập nhật thông tin chi tiết của một sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID của sản phẩm
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thông tin sản phẩm
 */
RouterAPI.put("/products/:id", verifyToken, isAdmin, UpdateProductsAPI);

// xóa sản phẩm

RouterAPI.delete("/delete-product", verifyToken, isAdmin, deleteOneProduct);

// topselling

RouterAPI.get(
  "/top-selling/:category/:gender",
  getTopSellingProductsByCategory
);

// đánh giá
/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: đánh giá 1 sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID của sản phẩm
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: đánh giá sản phẩm
 */
RouterAPI.post("/feedback", PutFeedbackProductAPI);

// đánh giá
/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: đánh giá nhiều sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID của sản phẩm
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: đánh giá sản phẩm
 */
RouterAPI.post("/feedbacks-products", PutFeedbackProductsAPI);

RouterAPI.post("/like", toggleLikeRatingAPI);

RouterAPI.post("/products/replies", toggleLikeReply);

// xóa phản hồi

RouterAPI.delete("/delete-rating", DeleteRatingProductController);

// gender products

RouterAPI.get("/categoryProductsFilter", CategoryGenderAPI);
RouterAPI.get(
  "/categoryfilter/:gender/:category/:page",
  CategoryGenderFitterAPI
);

// update view sản phẩm

RouterAPI.post("/product/update-view/:slug", updateViewProductController);

//

// Category

RouterAPI.post("/category", verifyToken, isAdmin, CreateCategoryAPI);

RouterAPI.get("/category", ListCategoryAPI);

RouterAPI.get("/category/:id", ListCategoryOneAPI);

RouterAPI.put("/category/:id", verifyToken, isAdmin, UpdateOneCatogryAPI);

RouterAPI.delete("/category/:id", verifyToken, isAdmin, DeleteOneCategoryAPI);

// Auth

RouterAPI.post("/register", RegisterUserAPI);
RouterAPI.post(
  "/register-admin",
  verifyToken,
  isAdmin,
  RegisterUserAPI_Alternative
);
RouterAPI.post("/login", LoginUserAPI);
RouterAPI.get("/users", ListUserAPI);
RouterAPI.get("/profile-users", ListOneUserAPI);
// cập nhật profile cho user
RouterAPI.put("/updateProfile", UpDateProfileUserAPI);
// cập nhật profile admin
RouterAPI.put(
  "/updateProfile-admin",
  verifyToken,
  isAdmin,
  UpDateProfileUserAPI
);
RouterAPI.put("/changel-passsword", ChanglePasswordAPI);
RouterAPI.post("/forgetpassword", Forgotpassword);
RouterAPI.post("/reset-password", ResetPassword);
RouterAPI.get("/check-reset-token/:token", checkRestToken);
RouterAPI.post("/refresh-token", RefreshToken);
RouterAPI.put("/config-password", verifyToken, isAdmin, changeUserPassword);
RouterAPI.delete("/delete-user/:id", verifyToken, isAdmin, DeleteUser);

RouterAPI.post(
  "/send-newpassword",
  verifyToken,
  isAdmin,
  sendPasswordRecoveryEmail
);

// khóa tài khoản

RouterAPI.put(
  "/users/:userId/lock",
  verifyToken,
  isAdmin,
  isAccountUserLockerAPI
);

// random id admin

RouterAPI.get("/admins", getRandomAdminAPI);

// Cart
RouterAPI.post("/cart", addToCart);
RouterAPI.post("/cart/add-many", addMultipleToCart);
RouterAPI.get("/cart/:userId", getCartProduct);
RouterAPI.put("/cart/:cartId/:itemId", RemoveCartProductfirst);
RouterAPI.put("/cart-update/:cartId/:itemId", UpdateCartQuantity);

// oders
RouterAPI.post("/order", CreateOrder);
RouterAPI.get("/order/:userId", listOderUserId);
RouterAPI.get("/get-total-products-sold", getTotalProductsSoldByType);
RouterAPI.get("/get-quantity-all", getTotalProductsSold);

RouterAPI.post(
  "/check-orderConfirmed",
  verifyToken,
  checkPermission("order_approval"),
  UpDateConfirmed
);

// đơn hàng được giao đến bạn
RouterAPI.post(
  "/check-orderShipping",
  verifyToken,
  checkPermission("order_approval"),
  UpDateDelivered
);

RouterAPI.put(
  "/order/:id",
  verifyToken,
  checkPermission("order_approval"),
  UpDateOrder
);
RouterAPI.post(
  "/check-orderCompleted",
  verifyToken,
  checkPermission("order_approval"),
  UpDateCompleted
);

RouterAPI.put("/update-order/:id", UpDateOrderStatus); // cập nhật trạng thái đơn hàng order_approval users

RouterAPI.put(
  "/update-order-admin/:id",
  verifyToken,
  checkPermission("order_approval"),
  UpDateOrderStatus
); // cập nhật trạng thái đơn hàng order_approval

// all hóa đơn thanh toán order
RouterAPI.get("/get-order-all", ListOderProducts);
RouterAPI.get("/get-order-one/:id", getOrderOneProduct);

RouterAPI.put("/update-order-repurchase/:id", createRepurchaseOrder);

// lọc oder theo trạng thái

RouterAPI.post("/filter-order/:status", filterOrdersByStatus);

RouterAPI.get("/daily", getListDallyOrder);

// notifications

RouterAPI.get("/notification/:userId", getNotificationsAPI);
RouterAPI.post("/notification/:id", updateReadNocatifionsAPI);
RouterAPI.put("/update-notification", AllReadNotificationsAPI);
RouterAPI.delete("/delete-notifications/:userId", DeleteAllNotificationsAPI);

// search

RouterAPI.get("/search/:page", searchProductsByNameAPI);

/// chat

RouterAPI.post("/customer/send", sendMessageCutomerAPI);
RouterAPI.post(
  "/admin/send",
  verifyToken, // Phải xác thực trước
  checkPermission("customer_support"),
  sendMessageToAdminAPI
);
RouterAPI.get("/message", getMessages);
RouterAPI.get("/message/all-users", getMessagesList);
RouterAPI.post("/update-isread", UpdateStatusIsRead);
RouterAPI.get("/get-list-sender/:sender", getMessagesSenderList);

// Voucher

RouterAPI.post(
  "/add-voucher",
  verifyToken,
  checkPermission("customer_support"),
  addVoucherAPI
);
RouterAPI.get("/voucher", listVoucherAPI);
RouterAPI.get("/voucher/:id", getListOneVoucherAPI);
RouterAPI.get("/voucher-user/:userId", getListVoucherByUserId);

RouterAPI.put("/update-voucher/:id", verifyToken, isAdmin, updateVoucher);

RouterAPI.post("/send-otp", sendOTP);
RouterAPI.post("/verify-otp", verifyOTPAndRegister);

// danh sách yêu thích

RouterAPI.post("/add-wishlist", addToWishlist);
RouterAPI.get("/get-wishlist/:userId", getWishlist);
RouterAPI.post("/remove-wishlist", RemoveToWishList);

// blog

RouterAPI.post("/create-blog", createBlogController);
RouterAPI.put("/post-view/:slug", updateBlogController);
RouterAPI.get("/all-blog", getAllBlogController);
RouterAPI.get("/blog/:slug", getDetailSlugController);
RouterAPI.put("/update-blog/:id", newUpdateBlogAPI);
RouterAPI.delete("/delete-blog/:id", deleteBlogController);

// AI
RouterAPI.post("/ChatAI", BotChatAPI);
RouterAPI.post("/genminiAi", handleGeminiRequest);
RouterAPI.post("/generate-ai-blog", generateBlogByGemini);

// nhà cung cấp

/**
 * @swagger
 * /create-supplier:
 *   post:
 *     summary: Thêm mới nhà cung cấp
 *     tags: [Supplier]
 *     responses:
 *       201:
 *         description: Tạo nhà cung  thành công
 */
RouterAPI.post("/create-supplier", verifyToken, isAdmin, CreateSupplierAPI);

/**
 * @swagger
 * /supplier:
 *   post:
 *     summary: lấy danh sách nhà cung cấp
 *     tags: [Supplier]
 *     responses:
 *       201:
 *         description: Lấy danh sách nhà cung cấp thành công
 */
RouterAPI.get("/supplier", FindAllSupplierAPI);

RouterAPI.get("/supplier-one/:id", FindOneIdSupplierAPI);
RouterAPI.put("/update-supplier", verifyToken, isAdmin, UpdateSupplierAPI);
RouterAPI.delete("/delete-supplier", verifyToken, isAdmin, deleteSupplierAPI);

// Banner

/**
 * @swagger
 * /create-banne:
 *   post:
 *     summary: Thêm mới một banner
 *     tags: [Banner]
 *     responses:
 *       201:
 *         description: Tạo banner thành công
 */
RouterAPI.post("/create-banner", CreateBannerController);

/**
 * @swagger
 * /update-banner/:id:
 *   put:
 *     summary: Cập nhật banner
 *     tags: [Banner]
 *     responses:
 *       201:
 *         description:  Cập nhật banner thành công
 */

RouterAPI.put("/update-banner/:id", UpdateBannerController);

/**
 * @swagger
 * /delete-banner/:id:
 *   delete:
 *     summary: Xóa banner
 *     tags: [Banner]
 *     responses:
 *       201:
 *         description: Xóa banner thành công
 */
RouterAPI.delete("/delete-banner/:id", DeleteBannerController);

/**
 * @swagger
 * /banner:
 *   get:
 *     summary: lấy danh sách banner
 *     tags: [Banner]
 *     responses:
 *       201:
 *         description: Lấy danh sách banner thành công
 */
RouterAPI.get("/banner", ListsBannerController);

/**
 * @swagger
 * /banner-id?id:
 *   get:
 *     summary: Lấy banner theo id
 *     tags: [Banner]
 *     responses:
 *       201:
 *         description:  Lấy banner theo id thành công
 */
RouterAPI.get("/banner-id", FindOneBannerController);

RouterAPI.put("/update-banner-isActive/:id", CheckIsActiveBannerController);

// Api doanh thu
RouterAPI.get("/revenue/total", getRevenue);

// lịch sư thay dổi website

RouterAPI.post("/create/changelog", createChangeModelAPI);
RouterAPI.get("/changelog", getChangeModelAPI);
RouterAPI.put("/update-changelog/:id", updateChangeModelAPI);
RouterAPI.delete("/delete-changelog/:id", DeletehangeModelAPI);

/// bảng size áo

RouterAPI.post("/create/size", verifyToken, isAdmin, createSizeGuideModel);
RouterAPI.get("/size/:id", getSizeGuideModel);
RouterAPI.post("/add-one/size", verifyToken, isAdmin, addOneSize);
RouterAPI.put("/update-size", verifyToken, isAdmin, updateOneSize);
RouterAPI.delete("/delete-size", verifyToken, isAdmin, deleteOneSize);

// bảng size quần

RouterAPI.get("/products/:productId/sizes", getPantsSizeGuide);

// Thêm 1 size mới
RouterAPI.post(
  "/products/:productId/sizes",
  verifyToken,
  isAdmin,
  addOnePantsSize
);

// Cập nhật 1 size theo ID
RouterAPI.put(
  "/products/:productId/sizes/:sizeId",
  verifyToken,
  isAdmin,
  updateOnePantsSize
);

// Xoá 1 size theo ID
RouterAPI.delete(
  "/products/:productId/sizes/:sizeId",
  verifyToken,
  isAdmin,
  deleteOnePantsSize
);

RouterAPI.delete(
  "/products/:productId/variant/image/:imageId",
  verifyToken,
  isAdmin,
  DeleteImageProduct
);
RouterAPI.get("/export-excel", verifyToken, isAdmin, exportTransactionsExcel);

// color
RouterAPI.get("/color", listColorModel);
RouterAPI.post("/color", createColorModel);
RouterAPI.put("/color/:id", updatedColorModel);
RouterAPI.delete("/color/:id", deleteColorModel);
module.exports = RouterAPI;
