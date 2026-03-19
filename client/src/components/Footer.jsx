import { Twitter, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-black text-gray-300 py-12">
            <div className="w-[80%] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                {/* Cột 1 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Chính sách bảo hành</h3>
                    <p className="text-sm mb-6">
                       Chính sách bảo hành
Chính sách đổi trả
Chính sách giao nhận hàng
Chính sách bảo mật
Hướng dẫn mua giày đá bóng trả sau 0% lãi suất với Fundiin tại Thanh Hùng Futsal
Các câu hỏi thường gặp với Fundiin
Chương trình Khách Hàng Thân Thiết

                    </p>
                    <div className="flex space-x-3">
                        <a href="#" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                            <Twitter size={18} />
                        </a>
                        <a href="#" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                            <Facebook size={18} />
                        </a>
                        <a href="#" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                            <Instagram size={18} />
                        </a>
                    </div>
                </div>

                {/* Cột 2 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Thông tin liên hệ</h3>
                    <ul className="space-y-3 text-sm">
                        <li>📍 123 Đường Du Lịch, Hà Nội, Việt Nam</li>
                        <li>📞 +84 123 456 789</li>
                        <li>✉️ support@shoeshop.com</li>
                        <li>🕒 Làm việc: 08:00 - 22:00 (T2 - CN)</li>
                    </ul>
                </div>

                {/* Cột 3 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Điểm đến phổ biến</h3>
                    <ul className="space-y-2 text-sm">
                        <li>• Đà Nẵng</li>
                        <li>• Nha Trang</li>
                        <li>• Phú Quốc</li>
                        <li>• Sapa</li>
                        <li>• Hạ Long</li>
                    </ul>
                </div>

                {/* Cột 4 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Đăng ký nhận ưu đãi</h3>
                    <p className="text-sm mb-4">
                        Đừng bỏ lỡ các giảm giá và khuyến mãi hấp dẫn, hãy nhập email của bạn để nhận tin mới nhất.
                    </p>
                </div>
            </div>
        </footer>
    );
}
