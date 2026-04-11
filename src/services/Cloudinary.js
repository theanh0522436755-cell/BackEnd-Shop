const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const streamifier = require("streamifier");

const uploadFileToCloudinary = async (files) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });

    const streamUpload = (file) => {
      return new Promise((resolve, reject) => {
        if (!file || !file.data || !Buffer.isBuffer(file.data)) {
          return reject(
            new Error("Tệp không hợp lệ: Cần một đối tượng có 'data' là Buffer")
          );
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: `uploads/shoes-${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        streamifier.createReadStream(file.data).pipe(uploadStream);
      });
    };

    const uploadResults = Array.isArray(files)
      ? await Promise.all(files.map((file) => streamUpload(file)))
      : [await streamUpload(files)]; // Đảm bảo luôn trả về mảng

    console.log("Kết quả tải lên Cloudinary:", uploadResults);
    return uploadResults;
  } catch (error) {
    console.error("Lỗi khi tải lên Cloudinary:", error);
    throw error;
  }
};

module.exports = { uploadFileToCloudinary };
