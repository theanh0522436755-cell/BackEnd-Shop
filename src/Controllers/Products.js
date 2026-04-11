const { uploadFileToCloudinary } = require("./../services/Cloudinary");
const {
  AddProducts,
  ListProducts,
  ListOneProducts,
  PutFeedbackProduct,
  PutFeedbackProducts,
  ProductFilter,
  CategoryGenderFitter,
  toggleLikeRating,
  ListOneSlugProducts,
  updateProductView,
  DeleteRatingProduct,
} = require("./../services/Product");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const Products = require("./../Model/Product");

const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const ExcelJS = require("exceljs");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const AddProductsAPI = async (req, res) => {
  try {
    const {
      name,
      gender,
      description,
      category,
      brand,
      care,
      price,
      discount,
      costPrice,
      view,
      supplierId,
    } = req.body;

    // Parse variants
    const variantsInput = JSON.parse(req.body.variantsInput || "[]");

    // Xử lý ảnh
    const files = Array.isArray(req.files?.images)
      ? req.files.images
      : req.files?.images
      ? [req.files.images]
      : [];

    if (files.length !== variantsInput.length) {
      return res.status(400).json({
        success: false,
        message: "Số ảnh và số biến thể (màu sắc) không khớp.",
      });
    }

    const resultImages = await uploadFileToCloudinary(files);

    // Gán ảnh vào từng biến thể theo thứ tự
    let variants = [];
    let totalStock = 0;

    for (let i = 0; i < variantsInput.length; i++) {
      const inputVariant = variantsInput[i];
      const image = resultImages[i];

      const sizes = inputVariant.sizes.map((sz) => {
        totalStock += sz.quantity;
        return {
          size: sz.size,
          quantity: sz.quantity,
          sold: 0,
        };
      });

      variants.push({
        color: inputVariant.color,
        sizes,
        images: [{ url: image.secure_url }],
      });
    }

    const productData = {
      name,
      gender,
      description,
      category,
      brand,
      care,
      price,
      discount,
      costPrice,
      view,
      stock: totalStock,
      variants,
      supplierId,
    };

    const saved = await AddProducts(productData);

    return res.status(200).json({
      EC: 0,
      data: saved,
      message: "Thêm sản phẩm thành công",
    });
  } catch (err) {
    console.error("Lỗi khi thêm sản phẩm:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi thêm sản phẩm",
    });
  }
};

const ListProductsAPI = async (req, res) => {
  try {
    const data = await ListProducts();
    return res.status(201).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.error("Error list product:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error adding product" });
  }
};

const ListOneProductAPI = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await ListOneProducts(id);

    return res.status(201).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.error("Error list product:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error adding product" });
  }
};

const ListSlugProductAPI = async (req, res) => {
  try {
    const { slug } = req.params;

    const data = await ListOneSlugProducts(slug);

    return res.status(201).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.error("Error list product:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error adding product" });
  }
};

// const UpdateProductsAPI = async (req, res) => {

//   try {
//     const {
//       name,
//       gender,
//       description,
//       category,
//       brand,
//       care,
//       price,
//       stock,
//       sold,
//       size,
//       color,
//       costPrice,
//     } = req.body;
//     const { id } = req.params;

//     // Lấy thông tin sản phẩm cũ từ database
//     const existingProduct = await Products.findById(id);
//     if (!existingProduct) {
//       return res.status(404).json({
//         success: false,
//         message: "Không tìm thấy sản phẩm",
//       });
//     }

//     // Xử lý size: giữ lại giá trị cũ nếu không có giá trị mới
//     const sizeArray = size
//       ? Array.isArray(size)
//         ? size
//         : size.split(",").map((item) => item.trim())
//       : existingProduct.size;

//     // Xử lý color: giữ lại giá trị cũ nếu không có giá trị mới
//     const colorArray = color
//       ? Array.isArray(color)
//         ? color
//         : color.split(",").map((item) => item.trim())
//       : existingProduct.color;

//     // Xử lý hình ảnh
//     let images = [...existingProduct.images];
//     if (req.files && req.files.images) {
//       const files = Array.isArray(req.files.images)
//         ? req.files.images
//         : [req.files.images];

//       // Xử lý màu mới và ảnh tương ứng
//       try {
//         const existingColors = existingProduct.color || [];
//         const newColors = colorArray.filter(
//           (color) => !existingColors.includes(color)
//         );

//         if (files.length !== newColors.length) {
//           return res.status(400).json({
//             success: false,
//             message:
//               "Số lượng ảnh mới phải khớp với số lượng màu mới được thêm vào",
//           });
//         }

//         // Gắn ảnh mới với màu mới
//         for (let i = 0; i < newColors.length; i++) {
//           const resultImage = await uploadFileToCloudinary(files[i]);
//           images.push({ color: newColors[i], url: resultImage.secure_url });
//         }
//       } catch (uploadError) {
//         console.error("Lỗi khi tải lên hình ảnh:", uploadError.message);
//         return res.status(500).json({
//           success: false,
//           message: "Lỗi khi tải lên hình ảnh",
//         });
//       }
//     }

//     // Tạo object chứa các trường cần update
//     const updateFields = {
//       name: name || existingProduct.name,
//       gender: gender || existingProduct.gender,
//       description: description || existingProduct.description,
//       category: category || existingProduct.category,
//       brand: brand || existingProduct.brand,
//       care: care || existingProduct.care,
//       price: price ? Number(price) : existingProduct.price,
//       stock: stock ? Number(stock) : existingProduct.stock,
//       sold: sold ? Number(sold) : existingProduct.sold,
//       size: sizeArray,
//       color: colorArray,
//       images: images,
//       costPrice: costPrice || existingProduct.costPrice,
//     };

//     // Update sản phẩm
//     const updatedProduct = await Products.findByIdAndUpdate(id, updateFields, {
//       new: true, // Trả về document sau khi update
//     });

//     return res.status(200).json({
//       success: true,
//       data: updatedProduct,
//       message: "Cập nhật sản phẩm thành công",
//     });
//   } catch (error) {
//     console.error("Lỗi cập nhật sản phẩm:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Lỗi khi cập nhật sản phẩm",
//     });
//   }
// };

// sửa feeckack

const UpdateProductsAPI = async (req, res) => {
  try {
    const {
      name,
      gender,
      description,
      category,
      brand,
      care,
      price,
      discount,
      stock,
      sold,
      size,
      color,
      costPrice,
      view,
      isAddStock: rawIsAddStock = true,
      supplierId,
    } = req.body;
    const { id } = req.params;

    const isAddStock = rawIsAddStock === "true" || rawIsAddStock === true;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID sản phẩm là bắt buộc" });
    }

    const existingProduct = await Products.findById(id);
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const parseArray = (input) => {
      if (!input) return [];
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return Array.isArray(input)
        ? input.map((item) => item)
        : String(input)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const sizeArray = [...new Set(parseArray(size))];
    const colorArray = [...new Set(parseArray(color))];

    let variants = JSON.parse(JSON.stringify(existingProduct.variants || []));

    const findOrCreateVariant = (color) => {
      let variant = variants.find((v) => v.color === color);
      if (!variant) {
        variant = { color, sizes: [], images: [] };
        variants.push(variant);
      }
      return variant;
    };

    const updateVariantSizes = (variant, sizesToUpdate, stockValue, isAdd) => {
      const existingSizesMap = new Map(variant.sizes.map((s) => [s.size, s]));

      sizesToUpdate.forEach((sizeItem) => {
        const sizeName =
          typeof sizeItem === "object" ? sizeItem.size : sizeItem;
        const qty =
          typeof sizeItem === "object"
            ? Number(sizeItem.quantity || 0)
            : Number(stockValue || 0);
        const existingSize = existingSizesMap.get(sizeName);

        if (existingSize) {
          existingSize.quantity = isAdd
            ? existingSize.quantity + qty
            : Math.max(existingSize.quantity - qty, 0);
        } else {
          variant.sizes.push({
            size: sizeName,
            quantity: isAdd ? qty : 0,
            sold: 0,
          });
        }
      });
    };

    let hasUpdatedStock = false;

    // Nếu có ảnh → xử lý ảnh và stock
    if (req.files?.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (let i = 0; i < colorArray.length; i++) {
        const currentColor = colorArray[i];
        const variant = findOrCreateVariant(currentColor);
        const resultImage = await uploadFileToCloudinary(files[i]);
        variant.images.push({ url: resultImage[0].secure_url });

        if (sizeArray.length > 0 && !hasUpdatedStock) {
          updateVariantSizes(variant, sizeArray, stock, isAddStock);
        }
      }

      hasUpdatedStock = true;
    }

    // Nếu không có ảnh nhưng có size
    if (!hasUpdatedStock && sizeArray.length > 0) {
      if (colorArray.length > 0) {
        colorArray.forEach((c) => {
          const variant = findOrCreateVariant(c);
          updateVariantSizes(variant, sizeArray, stock, isAddStock);
        });
      } else {
        variants.forEach((variant) => {
          updateVariantSizes(variant, sizeArray, stock, isAddStock);
        });
      }
      hasUpdatedStock = true;
    }

    // Nếu chỉ có stock → áp dụng cho mọi size của mọi color
    if (
      stock !== undefined &&
      sizeArray.length === 0 &&
      colorArray.length === 0 &&
      !hasUpdatedStock
    ) {
      variants.forEach((variant) => {
        variant.sizes.forEach((sizeObj) => {
          sizeObj.quantity = isAddStock
            ? sizeObj.quantity + Number(stock)
            : Number(stock);
          sizeObj.quantity = Math.max(sizeObj.quantity, 0);
        });
      });
      hasUpdatedStock = true;
    }

    // Cập nhật sold
    if (sold !== undefined && variants.length > 0) {
      const totalSizes = variants.reduce((acc, v) => acc + v.sizes.length, 0);
      const soldPerSize = Math.floor(Number(sold) / totalSizes);
      let remaining = Number(sold) - soldPerSize * totalSizes;

      variants.forEach((variant) => {
        variant.sizes.forEach((sizeObj, index) => {
          sizeObj.sold =
            soldPerSize + (remaining > 0 && index === 0 ? remaining : 0);
          if (index === 0) remaining = 0;
        });
      });
    }

    // Tổng kết stock và sold
    const totalStock = variants.reduce(
      (acc, variant) =>
        acc + variant.sizes.reduce((s, sz) => s + sz.quantity, 0),
      0
    );
    const totalSold = variants.reduce(
      (acc, variant) =>
        acc + variant.sizes.reduce((s, sz) => s + (sz.sold || 0), 0),
      0
    );

    const finalPrice =
      price !== undefined ? Number(price) : existingProduct.price;
    const finalDiscount =
      discount !== undefined ? Number(discount) : existingProduct.discount;
    const discountedPrice = finalPrice * (1 - finalDiscount / 100);

    const updateFields = {
      updatedAt: new Date(),
      variants,
      stock: totalStock,
      sold: sold !== undefined ? Number(sold) : totalSold,
      discountedPrice,
    };

    if (name !== undefined) updateFields.name = name;
    if (gender !== undefined) updateFields.gender = gender;
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (brand !== undefined) updateFields.brand = brand;
    if (care !== undefined) updateFields.care = care;
    if (price !== undefined) updateFields.price = finalPrice;
    if (discount !== undefined) updateFields.discount = finalDiscount;
    if (costPrice !== undefined) updateFields.costPrice = Number(costPrice);
    if (view !== undefined) updateFields.view = view;
    if (supplierId != undefined) updateFields.supplierId = supplierId;

    const updatedProduct = await Products.findOneAndUpdate(
      { _id: id },
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Không thể cập nhật sản phẩm" });
    }

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Cập nhật sản phẩm thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật sản phẩm",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const PutFeedbackProductAPI = async (req, res) => {
  try {
    const { id, userId, rating, review } = req.body;

    const imagesUrl = [];

    if (req.files && req.files.images) {
      let result = req.files.images;
      let resultImage = await uploadFileToCloudinary(result);

      imagesUrl.push(resultImage.secure_url);
    }

    const data = await PutFeedbackProduct(
      id,
      userId,
      rating,
      review,
      imagesUrl
    );

    return res.status(200).json({
      EC: "cập nhật thành công",
      data: data,
    });
  } catch (error) {}
};

const PutFeedbackProductsAPI = async (req, res) => {
  try {
    const { id, userId, rating, review } = req.body;

    const imagesUrl = [];

    if (req.files && req.files.images) {
      const resultImages = await uploadFileToCloudinary(req.files.images);

      resultImages.forEach((result) => {
        if (result && result.secure_url) {
          imagesUrl.push(result.secure_url);
        }
      });
    }

    const data = await PutFeedbackProducts(
      id,
      userId,
      rating,
      review,
      imagesUrl
    );

    return res.status(200).json({
      EC: "cập nhật thành công",
      data: data,
    });
  } catch (error) {
    console.error("Lỗi trong PutFeedbackProductsAPI:", error);
    return res.status(500).json({
      EC: "lỗi server",
      error: error.message,
    });
  }
};
const CategoryGenderAPI = async (req, res) => {
  const page = parseInt(req.query.page || "1", 10); // Đảm bảo page là số nguyên
  const {
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
  } = req.query;

  try {
    const { products, totalPages, currentPage } = await ProductFilter({
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
      page,
      view,
      brand,
    });

    return res.status(200).json({
      EC: 0,
      data: products,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error("Error in CategoryGenderAPI:", error);
    return res.status(500).json({
      EC: 1,
      message: "Internal Server Error",
    });
  }
};

const toggleLikeRatingAPI = async (req, res) => {
  try {
    const { productId, ratingId, userId } = req.body;

    // Call the toggleLikeRating function
    const { product, action } = await toggleLikeRating(
      productId,
      ratingId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: `Rating successfully ${action}`,
      product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const CategoryGenderFitterAPI = async (req, res) => {
  const page = parseInt(req.params.page || "1", 10); // Ensure page is an integer
  const { gender, category } = req.params;
  try {
    const { products, totalPages, currentPage } = await CategoryGenderFitter(
      gender,
      category,
      page
    );
    return res.status(200).json({
      EC: 0,
      data: products,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error("Error in CategoryGenderAPI:", error);
    return res.status(500).json({
      EC: 1,
      message: "Internal Server Error",
    });
  }
};

// phản hồi đánh giá của admin

const toggleLikeReply = async (req, res) => {
  const { productId, ratingId, userId, content } = req.body;
  try {
    const product = await Products.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const rating = product.ratings.id(ratingId);
    if (!rating) return res.status(404).json({ message: "Rating not found" });

    const check = true;
    rating.replies.push({ userId, content, check });

    await product.save();

    return res.status(200).json({
      EC: 0,
      message: "Phản hồi thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

const AddProductsFromExcelAPI = async (req, res) => {
  try {
    const file = req.files.execl;

    if (!file) {
      return res.status(400).json({ message: "Chưa upload file Excel." });
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ message: "File không đúng định dạng Excel." });
    }

    // Tạo thư mục nếu chưa có
    const uploadDir = path.join(__dirname, "../Uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Lưu file tạm thời
    const filePath = path.join(uploadDir, file.name);
    await file.mv(filePath);

    // Đọc file Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!sheetData || sheetData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "File Excel không có dữ liệu." });
    }

    let productsToAdd = [];
    const imageUploadPromises = [];
    const imageUrlMap = new Map(); // Cache uploaded images

    // Helper function to upload image to Cloudinary
    const uploadImageToCloudinary = async (imageURL, productName, color) => {
      try {
        if (!imageURL || imageURL.trim() === "") return null;

        // Check if image already uploaded
        if (imageUrlMap.has(imageURL)) {
          return imageUrlMap.get(imageURL);
        }

        const sanitizePublicId = (str) =>
          str
            .toString()
            .normalize("NFD") // loại bỏ dấu tiếng Việt
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9-_]/g, "_"); // chỉ giữ chữ, số, - và _

        const result = await cloudinary.uploader.upload(imageURL, {
          folder: "products",
          public_id: sanitizePublicId(`${productName}_${color}_${Date.now()}`),
          transformation: [
            { width: 800, height: 800, crop: "fill" },
            { quality: "auto" },
          ],
        });

        const cloudinaryUrl = result.secure_url;
        imageUrlMap.set(imageURL, cloudinaryUrl);
        return cloudinaryUrl;
      } catch (error) {
        console.error(`Lỗi upload ảnh ${imageURL}:`, error);
        return null;
      }
    };

    // Process Excel data
    for (let row of sheetData) {
      // Validate required fields
      if (!row.name || !row.category || !row.brand || !row.price) {
        console.warn(`Bỏ qua dòng thiếu thông tin: ${JSON.stringify(row)}`);
        continue;
      }

      // Validate data types
      const quantity = parseInt(row.quantity) || 0;
      const price = parseFloat(row.price) || 0;
      const discount = parseFloat(row.discount) || 0;
      const costPrice = parseFloat(row.costPrice) || 0;

      if (quantity < 0 || price <= 0) {
        console.warn(
          `Bỏ qua dòng có dữ liệu không hợp lệ: ${JSON.stringify(row)}`
        );
        continue;
      }

      const existingProduct = productsToAdd.find((p) => p.name === row.name);

      if (!existingProduct) {
        // Create new product
        const newProduct = {
          name: row.name.trim(),
          gender: row.gender || "",
          description: row.description || "",
          category: row.category,
          brand: row.brand,
          care: row.care || "",
          price: price,
          discount: discount,
          costPrice: costPrice,
          stock: quantity,
          variants: [
            {
              color: row.color || "default",
              sizes: [
                {
                  size: row.size || "default",
                  quantity: quantity,
                  sold: 0,
                },
              ],
              images: [], // Will be populated after image upload
              imageURL: row.imageURL, // Temporary field for processing
            },
          ],
        };

        productsToAdd.push(newProduct);

        // Add image upload promise
        if (row.imageURL) {
          imageUploadPromises.push(
            uploadImageToCloudinary(
              row.imageURL,
              row.name,
              row.color || "default"
            ).then((cloudinaryUrl) => ({
              productName: row.name,
              color: row.color || "default",
              originalUrl: row.imageURL,
              cloudinaryUrl: cloudinaryUrl,
            }))
          );
        }
      } else {
        // Update existing product
        let variant = existingProduct.variants.find(
          (v) => v.color === (row.color || "default")
        );

        if (!variant) {
          // Add new variant
          const newVariant = {
            color: row.color || "default",
            sizes: [
              {
                size: row.size || "default",
                quantity: quantity,
                sold: 0,
              },
            ],
            images: [], // Will be populated after image upload
            imageURL: row.imageURL, // Temporary field for processing
          };

          existingProduct.variants.push(newVariant);

          // Add image upload promise
          if (row.imageURL) {
            imageUploadPromises.push(
              uploadImageToCloudinary(
                row.imageURL,
                row.name,
                row.color || "default"
              ).then((cloudinaryUrl) => ({
                productName: row.name,
                color: row.color || "default",
                originalUrl: row.imageURL,
                cloudinaryUrl: cloudinaryUrl,
              }))
            );
          }
        } else {
          // Add size to existing variant
          variant.sizes.push({
            size: row.size || "default",
            quantity: quantity,
            sold: 0,
          });

          // Add image if variant doesn't have one and row has imageURL
          if (!variant.imageURL && row.imageURL) {
            variant.imageURL = row.imageURL;
            imageUploadPromises.push(
              uploadImageToCloudinary(
                row.imageURL,
                row.name,
                row.color || "default"
              ).then((cloudinaryUrl) => ({
                productName: row.name,
                color: row.color || "default",
                originalUrl: row.imageURL,
                cloudinaryUrl: cloudinaryUrl,
              }))
            );
          }
        }

        existingProduct.stock += quantity;
      }
    }

    const uploadResults = await Promise.all(imageUploadPromises);

    // Update products with Cloudinary URLs
    uploadResults.forEach((result) => {
      if (result && result.cloudinaryUrl) {
        const product = productsToAdd.find(
          (p) => p.name === result.productName
        );
        if (product) {
          const variant = product.variants.find(
            (v) => v.color === result.color
          );
          if (variant) {
            variant.images = [{ url: result.cloudinaryUrl }];
            delete variant.imageURL; // Remove temporary field
          }
        }
      }
    });

    // Clean up temporary imageURL fields
    productsToAdd.forEach((product) => {
      product.variants.forEach((variant) => {
        delete variant.imageURL;
        if (variant.images.length === 0) {
          variant.images = []; // Ensure empty array if no image
        }
      });
    });

    // Add timestamps
    const now = new Date();
    productsToAdd.forEach((product) => {
      product.createdAt = now;
      product.updatedAt = now;
    });

    // Thêm sản phẩm vào DB
    const createdProducts = [];
    for (const productData of productsToAdd) {
      const product = new Products(productData);
      await product.save();
      createdProducts.push(product);
    }

    // Xóa file Excel sau khi xử lý
    fs.unlinkSync(filePath);

    return res.status(201).json({
      EC: 0,
      message: "Thêm sản phẩm từ Excel thành công",
      data: {
        totalProducts: createdProducts.length,
        totalVariants: createdProducts.reduce(
          (sum, p) => sum + p.variants.length,
          0
        ),
        totalImagesUploaded: uploadResults.filter((r) => r && r.cloudinaryUrl)
          .length,
        products: createdProducts,
      },
    });
  } catch (err) {
    console.error("Lỗi khi thêm sản phẩm từ Excel:", err);

    // Clean up file if it exists
    try {
      const filePath = path.join(
        __dirname,
        "../Uploads",
        req.files?.execl?.name
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.error("Lỗi khi xóa file:", cleanupErr);
    }

    return res.status(500).json({
      message: "Lỗi server",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const updateViewProductController = async (req, res) => {
  try {
    const { slug } = req.params;

    const data = await updateProductView(slug);

    return res.status(201).json({ view: "Tăng view thành công", EC: 0, data });
  } catch (error) {
    res.status(400).json({ message: err.message });
  }
};

const DeleteRatingProductController = async (req, res) => {
  try {
    const { productId, ratingId } = req.query;

    const data = await DeleteRatingProduct(productId, ratingId);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteOneProduct = async (req, res) => {
  try {
    const { productId } = req.query;

    const data = await Products.deleteOne({ _id: productId });

    if (data.acknowledged === 0) {
      throw new Error(
        "Không tìm thấy đánh giá để xóa hoặc đánh giá đã bị xóa trước đó."
      );
    }

    return res.status(200).json({
      EC: 0,
      data: data,
      message: "Xóa thành công 1 sản phẩm",
    });
  } catch (error) {
    console.log(error);
  }
};

const getTopSellingProductsByCategory = async (req, res) => {
  try {
    const { category, gender } = req.params;

    // đảm bảo category đúng kiểu ObjectId
    const categoryId = new mongoose.Types.ObjectId(category);

    // query top-selling
    const topSelling = await Products.aggregate([
      { $match: { category: categoryId, gender: gender } },
      { $sort: { sold: -1 } },
      { $limit: 4 },
    ]);

    // query random
    const randomProducts = await Products.aggregate([
      { $match: { category: categoryId, gender: gender } },
      { $sample: { size: 4 } }, // lấy ngẫu nhiên 4 sp
    ]);

    return res.status(200).json({
      EC: 0,
      data: randomProducts,
    });
  } catch (error) {
    console.error("Error getTopSellingAndRandomProducts:", error);
    return res.status(500).json({
      EC: 1,
      message: "Internal server error",
    });
  }
};

const DeleteImageProduct = async (req, res) => {
  const { productId, imageId } = req.params;
  try {
    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Lặp qua các variant và xóa ảnh theo ID
    let found = false;
    product.variants = product.variants.map((variant) => {
      const originalLength = variant.images.length;
      variant.images = variant.images.filter(
        (img) => img._id.toString() !== imageId
      );

      if (variant.images.length !== originalLength) {
        found = true;
      }
      return variant;
    });

    if (!found) {
      return res.status(404).json({ message: "Không tìm thấy ảnh cần xóa" });
    }

    await product.save();
    res.status(200).json({ EC: 0, message: "Xóa ảnh thành công", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// // Export tất cả sản phẩm ra Excel

const exportProductsToExcel = async (req, res) => {
  try {
    const products = await Products.find({})
      .populate("category", "name")
      .sort({ createdAt: -1 });

    if (!products || products.length === 0) {
      return res.status(404).json({
        EC: 1,
        message: "Không có sản phẩm nào để xuất",
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sản Phẩm");

    worksheet.columns = [
      { header: "STT", key: "index", width: 8 },
      { header: "Tên Sản Phẩm", key: "name", width: 30 },
      { header: "Mô Tả", key: "description", width: 40 },
      { header: "Danh Mục", key: "category", width: 15 },
      { header: "Loại", key: "care", width: 15 },
      { header: "Giá Vốn (VNĐ)", key: "costPrice", width: 15 },
      { header: "Giá Bán (VNĐ)", key: "price", width: 15 },
      { header: "Tổng Chi Phí (VNĐ)", key: "totalCost", width: 18 },
      { header: "Tồn Kho", key: "stock", width: 12 },
      { header: "Màu Sắc", key: "colors", width: 20 },
      { header: "Kích Thước", key: "sizes", width: 25 },
      { header: "Trạng Thái", key: "status", width: 12 },
      { header: "Ngày Tạo", key: "createdAt", width: 18 },
    ];
    // Style cho header
    worksheet.getRow(1).font = {
      bold: true,
      size: 12,
      color: { argb: "FFFFFFFF" },
    };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0066CC" },
    };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getRow(1).height = 25;

    // Thêm dữ liệu
    products.forEach((product, index) => {
      // Lấy tất cả màu sắc
      const colors = product.variants
        .map((v) => v.color)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ");

      // Lấy tất cả size
      const sizes = product.variants
        .flatMap((v) => v.sizes.map((s) => s.size))
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ");

      const row = worksheet.addRow({
        index: index + 1,
        name: product.name || "",
        description: product.description || "",
        category: product.category?.name || "N/A",
        care: product.care || "N/A",
        costPrice: product.costPrice || 0,
        price: product.price || 0,
        totalCost: product.totalCost || 0,
        stock: product.stock || 0,
        colors: colors || "N/A",
        sizes: sizes || "N/A",
        status: product.stock > 0 ? "Còn hàng" : "Hết hàng",
        createdAt: product.createdAt
          ? new Date(product.createdAt).toLocaleDateString("vi-VN")
          : "N/A",
      });

      // Style cho các hàng
      row.alignment = { vertical: "middle", wrapText: true };

      // Tô màu xen kẽ
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F8FF" },
        };
      }

      // Tô màu cho cột trạng thái
      const statusCell = row.getCell("status");
      if (product.stock > 0) {
        statusCell.font = { color: { argb: "FF008000" }, bold: true };
      } else {
        statusCell.font = { color: { argb: "FFFF0000" }, bold: true };
      }

      // Format số tiền
      ["costPrice", "price", "totalCost"].forEach((key) => {
        const cell = row.getCell(key);
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      });
    });

    // Thêm border cho tất cả cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Thêm thống kê ở cuối
    const lastRow = worksheet.lastRow.number + 2;

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.totalCost || 0), 0);
    const inStock = products.filter((p) => p.stock > 0).length;
    const outOfStock = totalProducts - inStock;

    worksheet.addRow([]);

    const summaryRow1 = worksheet.addRow(["THỐNG KÊ TỔNG"]);
    summaryRow1.font = { bold: true, size: 13 };
    summaryRow1.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFCC00" },
    };

    worksheet.addRow(["Tổng số sản phẩm:", totalProducts]);
    worksheet.addRow(["Còn hàng:", inStock]);
    worksheet.addRow(["Hết hàng:", outOfStock]);
    worksheet.addRow(["Tổng tồn kho:", totalStock]);
    worksheet.addRow(["Tổng giá trị:", totalValue, "", "", "", "", "", "VNĐ"]);

    // Set response headers
    const fileName = `SanPham_${new Date().toISOString().split("T")[0]}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );

    // Ghi file và gửi về client
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting products to Excel:", error);
    res.status(500).json({
      EC: 1,
      message: "Lỗi khi xuất file Excel",
      error: error.message,
    });
  }
};

module.exports = {
  AddProductsAPI,
  ListProductsAPI,
  ListOneProductAPI,
  ListSlugProductAPI,
  UpdateProductsAPI,
  PutFeedbackProductAPI,
  PutFeedbackProductsAPI,
  CategoryGenderAPI,
  CategoryGenderFitterAPI,
  toggleLikeRatingAPI,
  toggleLikeReply,
  AddProductsFromExcelAPI,
  updateViewProductController,
  DeleteRatingProductController,
  deleteOneProduct,
  getTopSellingProductsByCategory,
  DeleteImageProduct,
  exportProductsToExcel,
};
