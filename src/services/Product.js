const Products = require("./../Model/Product");
const mongoose = require("mongoose");

const AddProducts = async (productData) => {
  try {
    const data = await Products.create(productData);
    const populatedProduct = await Products.findById(data._id).populate(
      "category",
      "name"
    );

    return populatedProduct;
  } catch (error) {
    console.log("Add products error:", error);
    throw error;
  }
};

const ListProducts = async () => {
  try {
    const products = await Products.find({})
      .populate("category", "name")
      .populate({
        path: "ratings.userId", // Lấy thông tin userId trong ratings
        select: "name avatar email address ", // Chỉ lấy trường name từ model Users
      })
      .populate({
        path: "ratings.replies.userId", // Lấy thông tin userId trong ratings
        select: "name avatar", // Chỉ lấy trường name từ model Users
      });

    // Chuyển đổi từng sản phẩm để bao gồm virtual fields
    const data = products.map((product) => product.toJSON());

    return data;
  } catch (error) {
    console.log("list products error:", error);
    throw error;
  }
};

// oneupdate
const ListOneProducts = async (id) => {
  try {
    const data = await Products.findOne({ _id: id })
      .populate("category", "name")
      .populate("supplierId", "name");

    return data;
  } catch (error) {
    console.log("list products error:", error);
    throw error;
  }
};

const ListOneSlugProducts = async (slug) => {
  try {
    const data = await Products.findOne({ slug: slug })
      .populate("category", "name")
      .populate({
        path: "ratings",
        populate: [
          {
            path: "userId",
            select: "name avatar",
          },
          {
            path: "replies",
            populate: {
              path: "userId",
              select: "name avatar",
            },
          },
          {
            path: "replies",
            populate: {
              path: "replies",
              populate: {
                path: "userId",
                select: "name avatar",
              },
            },
          },
        ],
      });
    return data;
  } catch (error) {
    console.log("list products error:", error);
    throw error;
  }
};

const UpdateProducts = async (productData) => {
  try {
    const updateData = await Products.findByIdAndUpdate(
      productData.id,
      {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        brand: productData.brand,
        care: productData.care,
        price: productData.price,
        discount: productData.discount,
        stock: productData.stock,
        sold: productData.sold,
        size: productData.size,
        color: productData.color,
        images: productData.images,
        costPrice: productData.costPrice,
        view: productData.view,
      },
      { new: true } // Trả về document sau khi update
    );

    if (!updateData) {
      throw new Error("Product not found");
    }

    return updateData;
  } catch (error) {
    throw error;
  }
};

// đánh giá
const PutFeedbackProduct = async (id, userId, rating, review, images) => {
  try {
    const feedback = await Products.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          ratings: {
            userId,
            rating,
            review,
            images,
          },
        },
      },
      { new: true }
    );

    return feedback;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const PutFeedbackProducts = async (ids, userId, rating, review, images) => {
  try {
    // Chuyển đổi chuỗi thành mảng nếu `ids` là string
    if (typeof ids === "string") {
      ids = ids.split(",").map((id) => id.trim()); // Cắt bỏ khoảng trắng nếu có
    }

    // Kiểm tra nếu ID nào không hợp lệ
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      throw new Error("Không có ID hợp lệ để cập nhật.");
    }

    const objectIds = validIds.map((id) => new mongoose.Types.ObjectId(id));

    // Kiểm tra sản phẩm có tồn tại không
    const existingProducts = await Products.find({ _id: { $in: objectIds } });

    if (existingProducts.length === 0) {
      throw new Error("Không tìm thấy sản phẩm nào với các ID đã cung cấp.");
    }

    // Chuyển đổi userId nếu hợp lệ
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("UserId không hợp lệ.");
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const feedback = await Products.updateMany(
      { _id: { $in: objectIds } },
      {
        $push: {
          ratings: { userId: userObjectId, rating, review, images },
        },
      }
    );

    return feedback;
  } catch (error) {
    console.log("Lỗi cập nhật feedback:", error);
    throw error;
  }
};

const toggleLikeRating = async (productId, ratingId, userId) => {
  // Find the product by ID
  const product = await Products.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  // Find the rating by ID within the product's ratings
  const rating = product.ratings.id(ratingId);
  if (!rating) {
    throw new Error("Rating not found");
  }

  const isLiked = rating.likes.includes(userId);
  if (isLiked) {
    rating.likes = rating.likes.filter((id) => id.toString() !== userId);
  } else {
    rating.likes.push(userId);
  }

  await product.save();

  return {
    product,
    action: isLiked ? "unliked" : "liked",
  };
};

const ProductFilter = async ({
  gender,
  category,
  minPrice,
  maxPrice,
  sortName,
  sortPrice,
  sortDate,
  sortSold,
  care,
  size,
  color,
  view,
  brand,
  page = 1,
}) => {
  try {
    const perPage = 20;
    const skip = (page - 1) * perPage;

    // Tạo bộ lọc
    const filter = {};
    if (gender) filter.gender = gender;
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.discountedPrice = {};
      if (minPrice) filter.discountedPrice.$gte = Number(minPrice);
      if (maxPrice) filter.discountedPrice.$lte = Number(maxPrice);
    }
    if (care) {
      filter.care = care;
    }
    if (Array.isArray(size) && size.length > 0) {
      filter["variants.sizes.size"] = { $in: size };
    }

    if (color) {
      filter["variants.color"] = color;
    }
    // Tạo tiêu chí sắp xếp
    const sortCriteria = {};
    if (sortName === "az") {
      sortCriteria.name = 1; // Tên A-Z
    } else if (sortName === "za") {
      sortCriteria.name = -1; // Tên Z-A
    }

    if (sortPrice === "asc") {
      sortCriteria.discountedPrice = 1; // Giá từ thấp đến cao
    } else if (sortPrice === "desc") {
      sortCriteria.discountedPrice = -1; // Giá từ cao đến thấp
    }

    if (sortDate === "newest") {
      sortCriteria.createdAt = -1; // Ngày mới nhất
    } else if (sortDate === "oldest") {
      sortCriteria.createdAt = 1; // Ngày cũ nhất
    }

    if (sortSold === "hot") {
      sortCriteria.sold = -1;
    }

    if (view === "asc") {
      sortCriteria.view = -1;
    }

    // Truy vấn và đếm dữ liệu
    const [products, count] = await Promise.all([
      Products.find(filter).sort(sortCriteria).skip(skip).limit(perPage),
      Products.countDocuments(filter),
    ]);

    // Tính tổng số trang
    const totalPages = Math.ceil(count / perPage);

    return { products, totalPages, currentPage: page };
  } catch (error) {
    console.error("Error fetching products with filters:", error);
    throw new Error("Error fetching products");
  }
};

const CategoryGenderFitter = async (gender, category, page) => {
  try {
    const perPage = 20;
    const skip = (page - 1) * perPage;

    const [products, count] = await Promise.all([
      Products.find({ gender, category }).skip(skip).limit(perPage),
      Products.countDocuments({ gender, category }),
    ]);

    const totalPages = Math.ceil(count / perPage);

    return { products, totalPages, currentPage: page };
  } catch (error) {
    console.error("Error fetching products by gender and category:", error);
    throw new Error("Error fetching products");
  }
};

// tìm kiếm

const searchProductsByName = async (keyword, page) => {
  try {
    const perPage = 10;
    const skip = (page - 1) * perPage;

    // Chuẩn hóa từ khóa tìm kiếm
    const searchTerm = keyword
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Query tổng hợp
    const query = {
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { normalizedName: { $regex: searchTerm, $options: "i" } },
      ],
    };

    // Sử dụng aggregate để sắp xếp kết quả theo độ phù hợp
    const products = await Products.aggregate([
      { $match: query },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              // Ưu tiên match chính xác tên
              {
                $cond: [
                  { $eq: [{ $toLower: "$name" }, keyword.toLowerCase()] },
                  10,
                  0,
                ],
              },
              // Ưu tiên match bắt đầu bằng keyword
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$name",
                      regex: new RegExp(`^${keyword}`, "i"),
                    },
                  },
                  5,
                  0,
                ],
              },
              // Điểm cho match một phần
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$name",
                      regex: new RegExp(keyword, "i"),
                    },
                  },
                  1,
                  0,
                ],
              },
            ],
          },
        },
      },
      { $sort: { relevanceScore: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: perPage },
    ]);

    const count = await Products.countDocuments(query);
    const totalPages = Math.ceil(count / perPage);

    return {
      products,
      totalPages,
      currentPage: page,
      total: count,
    };
  } catch (error) {
    console.error("Error in searchProductsByName:", error);
    throw new Error("Error while searching products");
  }
};

const updateProductView = async (slug) => {
  if (!slug) {
    throw new Error("Không tồn tại blog");
  }

  const blog = await Products.findOneAndUpdate(
    { slug },
    { $inc: { view: 1 } }, // Tăng view
    { new: true } // Trả về blog đã được cập nhật
  );

  if (!blog) {
    throw new Error("Không tìm thấy blog");
  }

  return blog;
};

const DeleteRatingProduct = async (productId, ratingId) => {
  if (!productId || !ratingId) {
    throw new Error("Thiếu productId hoặc ratingId");
  }

  try {
    const result = await Products.updateOne(
      { _id: productId },
      { $pull: { ratings: { _id: ratingId } } }
    );

    if (result.modifiedCount === 0) {
      throw new Error(
        "Không tìm thấy đánh giá để xóa hoặc đánh giá đã bị xóa trước đó."
      );
    }

    return { success: true, message: "Xóa đánh giá thành công", result };
  } catch (err) {
    console.error("Lỗi khi xóa đánh giá:", err);
    throw new Error("Đã xảy ra lỗi khi xóa đánh giá.");
  }
};

module.exports = {
  AddProducts,
  ListProducts,
  ListOneProducts,
  ListOneSlugProducts,
  UpdateProducts,
  PutFeedbackProduct,
  PutFeedbackProducts,
  ProductFilter,
  CategoryGenderFitter,
  toggleLikeRating,
  searchProductsByName,
  updateProductView,
  DeleteRatingProduct,
};
