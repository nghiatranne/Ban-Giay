const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const Product = require('../models/product.model');
const MessageChatbot = require('../models/messageChatbot.model');

/**
 * AI tư vấn sản phẩm giày (có ngữ cảnh hội thoại)
 * @param {string} question - Câu hỏi người dùng
 * @param {string} userId - ID người dùng
 * @returns {Promise<string>} - Câu trả lời từ AI
 */
async function askShoeAssistant(question, userId) {
    try {
        // 🧠 Lấy 5 tin nhắn gần nhất để hiểu ngữ cảnh hội thoại
        const recentMessages = await MessageChatbot.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();

        // Sắp xếp lại đúng thứ tự thời gian
        const conversation = recentMessages.reverse();

        // Chuyển đổi hội thoại thành dạng text
        const conversationText = conversation
            .map((msg) => `${msg.sender === 'user' ? 'Người dùng' : 'Bot'}: ${msg.content}`)
            .join('\n');

        // 🛍️ Lấy danh sách sản phẩm để AI tư vấn
        const products = await Product.find({ status: 'active' }).populate('category');
        if (!products.length) return 'Hiện tại chưa có sản phẩm nào trong cửa hàng.';

        const productData = products
            .map((p) => {
                const availableVariants = (p.variants || []).filter((v) => v.stock > 0);
                const totalStock = (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
                const stockStatus = totalStock === 0 ? '❌ HẾT HÀNG' : `✅ Còn hàng`;

                return `ID: ${p._id} | Tên: ${p.name} | Loại: ${p.category?.categoryName || 'Không có'} | Giá gốc: ${p.price.toLocaleString('vi-VN')}đ | Giảm: ${p.discount}% | Giá sau giảm: ${Math.round(p.price * (1 - p.discount / 100)).toLocaleString('vi-VN')}đ | ${stockStatus} | Size: ${availableVariants.map((v) => v.size).join(', ') || 'Hết'}`;
            })
            .join('\n');

        // 🧩 Prompt gửi cho AI
        const trainingPrompt = `
Bạn là "SneakerBot" – chatbot bán giày thân thiện, chuyên gia tư vấn sản phẩm giày thể thao.
Dưới đây là danh sách sản phẩm hiện có (CHỈ tư vấn sản phẩm trong danh sách này, có thể bịa thêm liên quan tới chính sách bảo hành và giao hàng của dự án và mô tả của giày):

${productData}

Lịch sử trò chuyện gần đây:
${conversationText}

Người dùng vừa nói: "${question}"

Hãy:
1. Hiểu ngữ cảnh trò chuyện trước đó, nếu user muốn biết rõ thêm về sản phẩm -> nhớ cái vừa gợi ý(chỉ ghi nhớ chứ đừng ghi ra).
2. Chỉ gợi ý sản phẩm còn hàng, phù hợp theo nội dung, màu, size(nếu người dùng hỏi size mà size đó không còn thì trả lời không,nếu không có sản phẩm phù hợp thì không cần ghi ra).
3. Khi người dùng lọc theo giá, nếu có"giá sau giảm" thì so sánh(còn không thì so sánh giá gốc).
4. Nếu người dùng hỏi về loại sản phẩm KHÔNG CÓ trong danh sách, thông báo rõ và gợi ý danh mục đang có.
5. Phản hồi tự nhiên, thân thiện, ngắn gọn nhưng đầy đủ nội dung bằng tiếng Việt (đừng lặp lại các nội dung trước đó). KHÔNG dùng tiếng Trung hay ngôn ngữ khác. KHÔNG tạo đơn hàng.
6. QUAN TRỌNG - Cuối câu trả lời PHẢI thêm đúng định dạng này (không được bỏ qua):
PRODUCT_IDS:[id1,id2,id3]
 Nếu không gợi ý sản phẩm nào thì ghi PRODUCT_IDS:[]
`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'Bạn là SneakerBot – chuyên viên tư vấn giày dép. Chỉ trả lời bằng tiếng Việt, tuyệt đối không dùng tiếng Trung, tiếng Anh hay bất kỳ ngôn ngữ nào khác. Luôn kết thúc câu trả lời bằng PRODUCT_IDS:[...] với ID sản phẩm đã gợi ý.',
                },
                { role: 'user', content: trainingPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1200,
        });

        const rawAnswer = completion.choices[0].message.content.trim();

        // Tách PRODUCT_IDS ra khỏi câu trả lời
        const productIdsMatch = rawAnswer.match(/PRODUCT_IDS:\[([^\]]*)\]/);
        const answer = rawAnswer.replace(/PRODUCT_IDS:\[[^\]]*\]/g, '').trim();

        let suggestedProducts = [];

        if (productIdsMatch && productIdsMatch[1]) {
            const ids = productIdsMatch[1].split(',').map((id) => id.trim()).filter(Boolean);
            suggestedProducts = products
                .filter((p) => ids.includes(String(p._id)))
                .map((p) => ({
                    _id: p._id,
                    name: p.name,
                    price: p.price,
                    discount: p.discount,
                    image: p.colors?.[0]?.images || null,
                }));
        }

        // Fallback: match từng từ trong tên sản phẩm nếu AI không trả về PRODUCT_IDS
        if (suggestedProducts.length === 0) {
            suggestedProducts = products
                .filter((p) => {
                    const words = p.name.toLowerCase().replace(/[-_]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
                    return words.some((word) => answer.toLowerCase().includes(word));
                })
                .slice(0, 3)
                .map((p) => ({
                    _id: p._id,
                    name: p.name,
                    price: p.price,
                    discount: p.discount,
                    image: p.colors?.[0]?.images || null,
                }));
        }

        return { answer, suggestedProducts };
    } catch (error) {
        console.error('❌ Lỗi askShoeAssistant:', error);
        return { answer: 'Xin lỗi, có lỗi xảy ra khi tư vấn sản phẩm. Vui lòng thử lại.', suggestedProducts: [] };
    }
}

module.exports = { askShoeAssistant };
