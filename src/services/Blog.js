const BlogModel = require("./../Model/BlogSchema");
const { uploadFileToCloudinary } = require("./../services/Cloudinary");
const slugify = require("slugify");

const getAllBlog = async () => {
  try {
    const data = await BlogModel.find({})
      .sort({ createdAt: -1 })
      .populate("userId")
      .exec(); // Lấy thông tin tác giả (nếu có populate)

    return data;
  } catch (error) {
    console.log(error);
  }
};

const getDetailSlug = async (slug) => {
  const data = await BlogModel.findOne({ slug: slug }).populate("userId");

  return data;
};

const CreateBlog = async ({
  title,
  tip,
  content,
  slug,
  regex,
  userId,
  files,
  readTime,
  featured,
}) => {
  if (!title || !tip || !content || !regex || !userId) {
    throw new Error("Không truyền đủ tham số");
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // ví dụ: 5765
  const slugTilte =
    slugify(slug, { lower: true, strict: true, locale: "vi" }) +
    `-${randomSuffix}`;
  let imageUrls = [];

  // Nếu có ảnh gửi lên
  if (files) {
    const imgFiles = Array.isArray(files) ? files : [files];

    console.log(imgFiles);

    for (const file of imgFiles) {
      const results = await uploadFileToCloudinary(file); // <- Trả về mảng

      if (Array.isArray(results)) {
        results.forEach((item) => {
          if (item?.secure_url) {
            imageUrls.push({ url: item.secure_url });
          }
        });
      }
    }
  }

  const newBlog = new BlogModel({
    title,
    tip,
    content,
    slug: slugTilte,
    regex,
    img: imageUrls,
    userId,
    readTime,
    featured,
  });

  await newBlog.save();
  return newBlog;
};
const updateBlogView = async (slug) => {
  if (!slug) {
    throw new Error("Không tồn tại blog");
  }

  const blog = await BlogModel.findOneAndUpdate(
    { slug },
    { $inc: { view: 1 } }, // Tăng view
    { new: true } // Trả về blog đã được cập nhật
  );

  if (!blog) {
    throw new Error("Không tìm thấy blog");
  }

  return blog;
};

const newUpdateBlog = async (id, blogData) => {
  try {
    const existingBlog = await BlogModel.findById(id);
    if (!existingBlog) throw new Error("Blog không tồn tại");

    let imgUrl = existingBlog.img;

    if (blogData.img) {
      const result = await uploadFileToCloudinary(blogData.img);
      imgUrl = [{ url: result[0].secure_url }]; // hoặc [result[0].secure_url]
    }

    const updatedBlog = await BlogModel.findByIdAndUpdate(
      id,
      {
        ...existingBlog.toObject(),
        ...blogData,
        img: imgUrl,
      },
      { new: true }
    );

    return updatedBlog;
  } catch (error) {
    console.error("Lỗi khi update blog:", error);
    throw error;
  }
};

const deleteBlog = async (id) => {
  try {
    const data = await BlogModel.findByIdAndDelete(id);

    return data;
  } catch (error) {
    console.error("Lỗi khi update blog:", error);
    throw error;
  }
};

module.exports = {
  CreateBlog,
  updateBlogView,
  getAllBlog,
  getDetailSlug,
  newUpdateBlog,
  deleteBlog,
};
