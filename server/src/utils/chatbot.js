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
                const stockStatus = totalStock === 0 ? '❌ HẾT HÀNG' : `✅ Còn hàng (tổng tồn kho: ${totalStock})`;

                return `
ID: ${p._id}
Tên: ${p.name}
Loại: ${p.category?.name || 'Không có'}
Giá: ${p.price.toLocaleString('vi-VN')}đ
Giảm giá: ${p.discount}%
Tình trạng: ${stockStatus}
Màu: ${(p.colors || []).map((c) => c.name).join(', ') || 'Không có'}
Size còn hàng: ${availableVariants.length > 0 ? availableVariants.map((v) => `${v.size}(còn ${v.stock})`).join(', ') : 'Không có size nào còn hàng'}
Mô tả: ${p.description ? p.description.substring(0, 80) + '...' : 'Không có'}
========================`;
            })
            .join('\n');

        // 🧩 Prompt gửi cho AI
        const trainingPrompt = `
Bạn là "SneakerBot" – chatbot bán giày thân thiện, chuyên gia tư vấn sản phẩm giày thể thao.
Dưới đây là danh sách sản phẩm hiện có:

${productData}

Lịch sử trò chuyện gần đây:
${conversationText}

Người dùng vừa nói: "${question}"

Hãy:
1. Hiểu ngữ cảnh trò chuyện trước đó,kiểm tra xem số lượng sản phẩm còn bao nhiêu trước khi tư vấn ,nếu user muốn biết rõ thêm về sản phẩm -> hãy nhớ cái vừa gợi í.
2. Chỉ gợi ý những sản phẩm còn hàng (đừng liệt kê trong kho còn bao nhiêu) ,Gợi ý sản phẩm phù hợp theo nội dung, màu, giá, size, miêu tả.
3. Nếu người dùng hỏi tiếp, hãy ghi nhớ các thông tin trước đó, hãy phản hồi tự nhiên, thân thiện, không lặp lại toàn bộ thông tin.
4. KHÔNG tạo đơn hàng, chỉ tư vấn sản phẩm.
`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'Bạn là SneakerBot – chuyên viên tư vấn giày dép, thân thiện và hiểu biết sản phẩm.',
                },
                { role: 'user', content: trainingPrompt },
            ],
            temperature: 0.7,
            max_tokens: 800,
        });

        const answer = completion.choices[0].message.content.trim();

        // Match sản phẩm được đề cập trong câu trả lời và đính kèm links
        const mentionedProducts = products.filter((p) =>
            answer.toLowerCase().includes(p.name.toLowerCase())
        );

        const suggestedProducts = mentionedProducts.map((p) => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            discount: p.discount,
            image: p.colors?.[0]?.images || null,
        }));

        return { answer, suggestedProducts };
    } catch (error) {
        console.error('❌ Lỗi askShoeAssistant:', error);
        return { answer: 'Xin lỗi, có lỗi xảy ra khi tư vấn sản phẩm. Vui lòng thử lại.', suggestedProducts: [] };
    }
}

module.exports = { askShoeAssistant };
