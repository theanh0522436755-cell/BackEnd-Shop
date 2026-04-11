const { jsonrepair } = require("jsonrepair");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const Products = require("./../Model/Product");
// Hàm xử lý phản hồi Gemini và làm sạch JSON
function extractCleanJSON(text) {
  // Trích xuất JSON từ block code (nếu có)
  const match =
    text.match(/```json\s*([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
  let jsonText = match ? match[1] : text;

  // Làm sạch các dấu ngoặc cong
  jsonText = jsonText.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // Xoá các ký tự điều khiển không hợp lệ (ngoại trừ \n \t \r)
  jsonText = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Sửa lỗi thiếu dấu phẩy trước key mới bằng regex (không hoàn hảo 100%)
  jsonText = jsonText.replace(
    /"([a-zA-Z0-9_]+)"\s*:\s*"([^"]+)"\s*"([a-zA-Z0-9_]+)"\s*:/g,
    (_, key1, val1, key2) => {
      return `"${key1}": "${val1}", "${key2}":`;
    }
  );

  // Xoá dấu phẩy cuối object/array
  jsonText = jsonText.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

  return jsonText.trim();
}
function cleanMarkdown(content = "") {
  return content.replace(/\*\*(.*?)\*\*/g, "$1"); // Xoá **bold**
}

const handleGeminiRequest = async (req, res) => {
  const { message } = req.body;

  if (typeof message !== "string" || message.trim() === "") {
    return res
      .status(400)
      .json({ error: "Message must be a non-empty string." });
  }

  try {
    // Lấy thông tin sản phẩm từ database
    const products = await Products.find({})
      .select(
        "name description price discount discountedPrice stock view brand sold slug variants"
      )
      .sort({ sold: -1 }) // Sắp xếp theo số lượng đã bán giảm dần
      .limit(100);

    // Làm sạch description để tránh lỗi
    const productContext = products
      .map((p) => {
        const cleanDesc = p.description
          ? p.description
              .replace(/<[^>]*>/g, "")
              .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
              .substring(0, 200)
          : "Không có mô tả";

        return `
Sản phẩm: ${p.name}
ID: ${p._id}
Thương hiệu: ${p.brand || "N/A"}
Giá gốc: ${p.price?.toLocaleString("vi-VN")}đ
Giảm giá: ${p.discount || 0}%
Giá sau giảm: ${p.discountedPrice?.toLocaleString("vi-VN")}đ
Tồn kho: ${p.stock || 0}
Đã bán: ${p.sold || 0}
Lượt xem: ${p.view || 0}
Mô tả: ${cleanDesc}
---`;
      })
      .join("\n");

    // Tạo prompt cho Gemini với yêu cầu trả về product IDs
    const fullPrompt = `
Bạn là trợ lý bán hàng thời trang. Dưới đây là thông tin các sản phẩm hiện có (đã được sắp xếp theo số lượng bán từ cao đến thấp):

${productContext}

Câu hỏi của khách hàng: ${message}

Hãy trả lời câu hỏi dựa trên thông tin sản phẩm ở trên. 

LƯU Ý QUAN TRỌNG:
- Nếu khách hỏi về sản phẩm bán chạy, hot, phổ biến nhất thì hãy đề xuất các sản phẩm có số lượng "Đã bán" cao nhất (danh sách đã được sắp xếp sẵn).
- Nếu bạn đề xuất hoặc nhắc đến sản phẩm cụ thể, hãy kết thúc câu trả lời bằng dòng:
  PRODUCT_IDS: [id1, id2, id3]
  
Ví dụ: "Tôi gợi ý cho bạn áo Levents Love Ring Regular Tee với giá ưu đãi. PRODUCT_IDS: [677743a80a429947e4d862b3]"
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
    });

    const text = response.candidates[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res
        .status(500)
        .json({ error: "No response content from Gemini." });
    }

    // Làm sạch text
    const cleanText = text
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
      .replace(/\n\n+/g, "\n\n")
      .trim();

    // Tìm product IDs trong response
    const productIdsMatch = cleanText.match(/PRODUCT_IDS:\s*\[(.*?)\]/);
    let suggestedProducts = [];

    if (productIdsMatch) {
      const ids = productIdsMatch[1]
        .split(",")
        .map((id) => id.trim().replace(/['"]/g, ""))
        .filter((id) => id);

      // Lấy thông tin chi tiết các sản phẩm được đề xuất
      const foundProducts = await Products.find({ _id: { $in: ids } })
        .select("name slug price discountedPrice variants sold view")
        .lean();

      // Sắp xếp theo thứ tự IDs gốc để giữ thứ tự đề xuất
      const productMap = new Map(
        foundProducts.map((p) => [p._id.toString(), p])
      );

      suggestedProducts = ids
        .map((id) => productMap.get(id))
        .filter(Boolean)
        .map((p) => {
          // Lấy ảnh đầu tiên từ variant đầu tiên
          const firstImage = p.variants?.[0]?.images?.[0] || null;

          return {
            _id: p._id,
            name: p.name,
            price: p.price,
            discountedPrice: p.discountedPrice,
            sold: p.sold,
            view: p.view,
            image: firstImage,
            detailUrl: `https://mta-shop.vercel.app/product/${p.slug}`,
          };
        });
    }

    // Loại bỏ PRODUCT_IDS khỏi text response
    const finalText = cleanText.replace(/PRODUCT_IDS:\s*\[.*?\]/g, "").trim();

    return res.status(200).json({
      response: finalText,
      products: suggestedProducts,
    });
  } catch (err) {
    console.error("Lỗi từ Gemini API:", err);
    return res.status(500).json({ error: "Lỗi xử lý từ AI." });
  }
};

const generateBlogByGemini = async (req, res) => {
  const { topic, keywords, audience } = req.body;

  if (!topic || !keywords || !audience) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin." });
  }

  const prompt = `
Viết một bài blog thời trang với các yêu cầu sau:
- Chủ đề: ${topic}
- Từ khóa: ${keywords}
- Đối tượng: ${audience}

Chỉ xuất JSON thuần với cấu trúc:
{
  "title": "Tiêu đề bài viết",
  "tip": "Một mẹo ngắn mở đầu bài viết",
  "content": "Nội dung chính của blog, độ dài khoảng 300 từ"
}
Không giải thích gì thêm, không bao markdown như \`\`\`json\`\`\`, không in đậm **bold**.
Trả lời bằng tiếng Việt.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = response.candidates[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: "Không có phản hồi từ Gemini." });
    }

    console.log("📄 Raw Gemini:", text);

    // Dùng jsonrepair để tự động sửa lỗi format
    const repairedJSON = jsonrepair(text);
    const parsed = JSON.parse(repairedJSON);

    // Làm sạch markdown nếu Gemini vẫn còn dùng
    parsed.content = cleanMarkdown(parsed.content);

    return res.status(200).json({
      message: "Tạo blog thành công từ Gemini",
      blog: parsed,
    });
  } catch (err) {
    console.error("❌ Lỗi parse JSON từ Gemini:", err.message);
    return res.status(500).json({
      error: "Không thể xử lý JSON trả về từ Gemini.",
      raw: err.message,
    });
  }
};

module.exports = { handleGeminiRequest, generateBlogByGemini };
