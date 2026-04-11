const {
  CreateBlog,
  updateBlogView,
  getAllBlog,
  getDetailSlug,
  newUpdateBlog,
  deleteBlog,
} = require("../services/Blog");

const createBlogController = async (req, res) => {
  try {
    const blog = await CreateBlog({
      title: req.body.title,
      tip: req.body.tip,
      content: req.body.content,
      slug: req.body.slug,
      regex: req.body.regex,
      userId: req.body.userId,
      files: req.files.img,
      readTime: req.body.readTime,
      featured: req.body.featured,
    });

    res.status(201).json({ message: "Tạo blog thành công", blog });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateBlogController = async (req, res) => {
  try {
    const { slug } = req.params;

    const data = await updateBlogView(slug);

    return res.status(201).json({ EC: 0, view: "Tăng view thành công", data });
  } catch (error) {
    res.status(400).json({ message: err.message });
  }
};

const getAllBlogController = async (req, res) => {
  try {
    const data = await getAllBlog();

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const getDetailSlugController = async (req, res) => {
  try {
    const { slug } = req.params;
    const data = await getDetailSlug(slug);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const newUpdateBlogAPI = async (req, res) => {
  try {
    const { id } = req.params;

    // lấy dữ liệu text từ body
    const dataBlog = {
      title: req.body.title,
      tip: req.body.tip,
      content: req.body.content,
      regex: req.body.regex,
      userId: req.body.userId,
      readTime: req.body.readTime,
      featured: req.body.featured,
    };

    // nếu có file upload thì thêm vào
    if (req.files && req.files.img) {
      dataBlog.img = req.files.img; // khớp với newUpdateBlog
    }

    const data = await newUpdateBlog(id, dataBlog);

    return res.status(200).json({
      EC: 0,
      data,
    });
  } catch (error) {
    console.error("Lỗi API update blog:", error);
    return res.status(500).json({
      EC: -1,
      message: error.message,
    });
  }
};

const deleteBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await deleteBlog(id);

    return res.status(200).json({
      EC: 0,
      data,
      message: "Xóa thành công blog",
    });
  } catch (error) {
    console.error("Lỗi API update blog:", error);
    return res.status(500).json({
      EC: -1,
      message: error.message,
    });
  }
};

module.exports = {
  createBlogController,
  updateBlogController,
  getAllBlogController,
  getDetailSlugController,
  newUpdateBlogAPI,
  deleteBlogController,
};
