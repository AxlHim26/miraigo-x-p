# MiraiGo mobile feature coverage

| Luồng từ FE | Hỗ trợ trong app |
| --- | --- |
| Đăng nhập, đăng ký, xác minh email, đăng xuất, xem tài khoản | Màn Expo dùng Spring Boot |
| Khóa học, chương, phần và bài học | Màn Expo dùng cây khóa học Spring Boot, nhớ bài gần nhất theo tài khoản |
| Video, PDF và audio đề thi | Trình phát native cho tệp hỗ trợ, trình xem PDF của thiết bị, bản xem trước cho YouTube và Drive khi nhà cung cấp cho phép |
| Ngữ pháp N5–N1 | Danh mục offline dùng chung, ví dụ, giải thích và ghi chú |
| Từ vựng theo khóa và ôn theo lịch | Màn Expo dùng Spring Boot để tra cứu, học flashcard và lưu điểm ôn |
| Bộ từ cá nhân, soạn từ và bộ từ cộng đồng | Màn Expo riêng để quản lý bộ và từ, chia sẻ, sao chép bộ cộng đồng và học flashcard. Web và mobile dùng chung API Spring Boot |
| Hán tự | Tra cứu offline theo chữ, đọc và nghĩa; flashcard theo cấp độ và theo chặng. Màn Kanji Map và vẽ tay dùng API Spring Boot. Thứ tự nét lấy từ danh mục Kanji |
| JLPT | Thi theo thời gian, kết quả, lịch sử, luyện theo kỹ năng, kiểm tra xếp lớp và lọc đề thi thử N5–N1 dùng Spring Boot |
| Tạo đề JLPT cộng đồng | Trình soạn đề FE mở trong app |
| Flashcard, nghe và chép chính tả | Màn Expo với bộ nội dung mẫu từ FE; đọc tiếng Nhật bằng giọng hệ thống |
| Phát âm, shadowing và phiên âm tệp | Ghi âm hoặc chọn tệp ở màn Expo; dùng `/predict` và `/predict-stream` của dịch vụ Voice AI. Điểm khớp phản ánh sự giống nhau của bản phiên âm và câu mẫu |
| Trò chuyện AI, hội thoại và luyện đọc | Màn Expo riêng. AI Chat và luyện đọc dùng Spring Boot với dịch vụ Groq hiện có. Hội thoại thu âm theo lượt và dùng Voice AI để phiên âm |
| Thử thách 50 ngày | FE hiện hiển thị trang đang phát triển |

## Cấu hình chạy trên điện thoại

- Đặt `EXPO_PUBLIC_API_BASE_URL` thành địa chỉ Spring Boot mà điện thoại
  truy cập được. Với Wi-Fi nội bộ, dùng địa chỉ IP của máy phát triển.
- Đặt `EXPO_PUBLIC_FE_BASE_URL` thành origin của `miraigo-fe` dùng cho công
  cụ nhúng. Nếu chạy local, khởi động FE trên `0.0.0.0`, đặt
  `NEXT_PUBLIC_APP_URL` theo origin FE, đặt `NEXT_PUBLIC_BACKEND_API_URL`
  theo địa chỉ Spring Boot và thêm origin FE vào `CORS_ALLOWED_ORIGINS` của
  Spring Boot. Dùng HTTPS cho FE và các API khi chạy ngoài môi trường local.
- Đặt `EXPO_PUBLIC_VOICE_API_URL` thành địa chỉ dịch vụ giọng nói. Môi
  trường local cần chạy dịch vụ đó riêng. Tính năng thu âm của trang FE
  nhúng cần một origin HTTPS và quyền micro của thiết bị; màn Expo thu âm
  qua API thiết bị.
- Khởi động lại Metro sau khi đổi biến môi trường và mở lại dự án bằng Expo Go.

Các trang FE mở bằng WebView trong app và dùng phiên web độc lập. Nếu trang
yêu cầu đăng nhập, đăng nhập trực tiếp trong cửa sổ công cụ. WebView được
đóng khi quay lại app và có thể yêu cầu đăng nhập lại lần mở sau. Bộ từ cá nhân và cộng đồng dùng tài khoản MiraiGo hiện tại qua Spring Boot.

## Kiểm thử trên thiết bị

- Mở video và PDF của một bài thật, thử phát audio đề nghe, khóa màn hình và
  quay lại, sau đó kiểm tra phát lại hoặc dừng đúng chỗ.
- Làm một bài theo kỹ năng, một bài xếp lớp và một lượt thi thử; kiểm tra
  số câu, kết quả, lịch sử và khả năng tiếp tục.
- Đăng nhập trong cửa sổ công cụ, thử Kanji Map, AI chat và
  tạo đề. Mở trên cả iOS và Android.
- Kiểm tra lời thoại mẫu, cấp và từ chối quyền micro, phát lại bản ghi, nộp
  âm thanh và chọn một tệp dài để kiểm tra tiến độ phiên âm.

Danh mục Hán tự có thể cập nhật từ checkout FE bằng
`node scripts/export-kanji-catalog.mjs N5` (lặp lại cho N4–N1). Danh mục ngữ
pháp và bộ câu luyện mẫu dùng bản dữ liệu có trong ứng dụng.
