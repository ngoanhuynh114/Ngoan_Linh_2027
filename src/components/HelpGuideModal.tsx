import React from 'react';
import { 
  X, 
  Heart, 
  Baby, 
  Calendar, 
  Camera, 
  Lock, 
  Database, 
  Sparkles, 
  Smartphone,
  CheckCircle2,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminAuth: () => void;
  onOpenSettings: () => void;
  onOpenAddMemory: () => void;
  onOpenGasModal: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminAuth,
  onOpenSettings,
  onOpenAddMemory,
  onOpenGasModal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-100 via-pink-50 to-amber-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-800">
                Cẩm Nang Hướng Dẫn Sử Dụng
              </h3>
              <p className="text-xs text-rose-600 font-medium">
                Mẹo sử dụng app để lưu giữ trọn vẹn hành trình khôn lớn của bé
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-stone-700 leading-relaxed">
          
          {/* Section 1: Hai chế độ sử dụng */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
              <span>🌟</span>
              <span>1. Hai Chế Độ Hoạt Động (Người Xem vs Bố Mẹ)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="font-bold text-stone-800 block text-xs">👀 Chế độ Người Xem (Mặc định)</span>
                <p className="text-stone-500 text-xs">
                  Dành cho ông bà, người thân, bạn bè vào xem nhật ký, thả tim ❤️ các khoảnh khắc đáng yêu mà không sợ bị sửa nhầm hay xóa mất bài viết.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                <span className="font-bold text-rose-800 block text-xs">🔒 Chế độ Quản Trị (Bố/Mẹ)</span>
                <p className="text-stone-600 text-xs">
                  Bấm vào nút <strong>"Quản trị"</strong> ở góc trên bên phải &gt; Nhập mật khẩu <strong>123</strong> để mở khóa quyền thêm, chỉnh sửa và xóa bài viết.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Thiết lập thông tin bé */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
              <span>👶</span>
              <span>2. Cài Đặt Thông Tin Bé & Bộ Đếm Tuổi Tự Động</span>
            </h4>
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <p>
                Bấm vào biểu tượng bánh răng <strong>⚙️ (Cài đặt)</strong> trên thanh tiêu đề:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-stone-600 text-xs">
                <li><strong>Nếu bé đã chào đời:</strong> Điền Ngày sinh, Tên gọi ở nhà (Nickname: Bé Xù, Bắp Cải...). Hệ thống sẽ <strong>tự động tính chính xác tuổi bé</strong>: <em>"1 tuổi 2 tháng 15 ngày (412 ngày tuổi)"</em>.</li>
                <li><strong>Nếu đang mang thai:</strong> Chọn trạng thái <em>"Đang mang thai"</em> và điền Ngày dự sinh (Due date). Hệ thống sẽ đếm ngược số ngày và so sánh kích thước bé theo tuần (quả bơ, quả chuối, dưa hấu...).</li>
                <li>Tải ảnh đại diện bé từ điện thoại/máy tính lên để làm nổi bật trang nhật ký.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Đăng bài viết / Thêm kỷ niệm mới */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
              <span>✍️</span>
              <span>3. Cách Thêm Kỷ Niệm Mới (Hình Ảnh & Video)</span>
            </h4>
            <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-200 space-y-2 text-xs">
              <p className="text-stone-700">
                Bấm nút hồng <strong>"+ Thêm kỷ niệm"</strong> ở góc trên hoặc thanh banner:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-stone-600">
                <li><strong>Chọn Giai đoạn:</strong> <em>Thai kỳ</em> (Siêu âm, bé đạp...), <em>Cột mốc bé</em> (Lẫy, bò, mọc răng, sinh nhật...), hoặc <em>Nhật ký hằng ngày</em>.</li>
                <li><strong>Chọn Gợi ý cột mốc nhanh:</strong> Nhấp vào các gợi ý có sẵn để tự động điền tiêu đề và tuần tuổi.</li>
                <li><strong>Tải lên Ảnh hoặc Video:</strong> Nhấp vào ô tải file để chọn ảnh siêu âm, khoảnh khắc đáng yêu từ máy. File sẽ tự động được xem trước (preview) và mã hóa Base64 sẵn sàng gửi lên Google Drive.</li>
                <li><strong>Chọn Cảm xúc:</strong> Hạnh phúc ❤️, Xúc động 🥹, Yêu thương 💕, Đáng yêu 🥰...</li>
                <li>Bấm <strong>"Lưu kỷ niệm"</strong> để hoàn tất.</li>
              </ol>
            </div>
          </div>

          {/* Section 4: Lọc, Tìm Kiếm & Xem Chi Tiết */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
              <span>🔍</span>
              <span>4. Xem Lại Dòng Thời Gian (Storybook)</span>
            </h4>
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2 text-xs text-stone-600">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Thanh lọc giai đoạn:</strong> Chuyển nhanh giữa <em>Tất cả</em>, <em>Thai kỳ</em>, <em>Cột mốc</em>, và <em>Hằng ngày</em>.</li>
                <li><strong>Ô tìm kiếm:</strong> Gõ từ khóa như "siêu âm", "ăn dặm", "lẫy", "sinh nhật" để tìm ngay bài viết liên quan.</li>
                <li><strong>Chế độ xem:</strong> Bấm nút <strong>Timeline</strong> (dòng thời gian nối liền cổ điển) hoặc <strong>Lưới thẻ</strong> (dạng album ảnh hiện đại).</li>
                <li><strong>Phóng to / Xem video:</strong> Nhấp trực tiếp vào ảnh hoặc video trên bất kỳ thẻ nào để mở trình chiếu phóng to toàn màn hình.</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Lưu trữ đám mây Google Sheets & Drive */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
              <span>☁️</span>
              <span>5. Đồng Bộ Lưu Trữ Đám Mây (Google Sheets & Google Drive)</span>
            </h4>
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs text-stone-600">
              <p>
                Mặc định ứng dụng tự lưu trong bộ nhớ máy (Local Storage). Để <strong>không bao giờ bị mất dữ liệu</strong> và mở được trên mọi điện thoại/máy tính khác:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Bấm vào nút <strong>"Google Apps Script"</strong> hoặc <strong>"Code.gs & API"</strong> trên thanh tiêu đề.</li>
                <li>Làm theo 4 bước hướng dẫn: Dán mã `Code.gs` vào Google Sheet của bạn và Deploy dưới dạng Web App.</li>
                <li>Dán link Web App vào là xong! Mọi bài viết từ đó sẽ tự động ghi vào Google Sheets và ảnh lưu trữ trên Google Drive vĩnh viễn.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            Mật khẩu quản trị mặc định: <strong>123</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            Đã hiểu & Bắt đầu dùng
          </button>
        </div>
      </div>
    </div>
  );
};
