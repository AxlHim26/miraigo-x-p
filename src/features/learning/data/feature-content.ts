import type { FeatureRoute, FeatureScreenConfig } from '@/features/learning/types/feature-screen';

export const featureRoutes: Record<FeatureRoute, FeatureScreenConfig> = {
  '/courses': {
    eyebrow: 'THƯ VIỆN KHÓA HỌC', description: 'Xây nền tảng tiếng Nhật với các bài học được sắp xếp theo lộ trình.',
    sections: [
      { title: 'Nền tảng N5', description: 'Hiragana, lời chào và những câu giao tiếp đầu tiên.', meta: '8 bài học' },
      { title: 'Tiếng Nhật đời sống N4', description: 'Nói về thói quen, kế hoạch và trải nghiệm.', meta: '12 bài học' },
      { title: 'Giao tiếp N3', description: 'Hiểu tiếng Nhật tự nhiên trong các tình huống thường ngày.', meta: 'Sắp ra mắt' },
    ],
  },
  '/practice': {
    eyebrow: 'LUYỆN THI NĂNG LỰC TIẾNG NHẬT', description: 'Rèn luyện và làm quen với cấu trúc kỳ thi JLPT.',
    sections: [
      { title: 'Đọc hiểu', description: 'Đọc đoạn văn ngắn cùng phần giải thích từ mới.', meta: '10 phút' },
      { title: 'Nghe hiểu', description: 'Cải thiện khả năng nghe với bài luyện tập theo chủ đề.', meta: '15 phút' },
      { title: 'Phát âm', description: 'Luyện phát âm và cải thiện khả năng nói.', meta: '10 phút' },
    ],
  },
  '/vocabulary': {
    eyebrow: 'KHO TỪ VỰNG', description: 'Ôn lại từ quan trọng và khám phá các khóa từ vựng theo cấp độ.',
    sections: [
      { title: 'Từ đến hạn ôn', description: 'Ôn nhanh những từ đã đến thời điểm củng cố.', meta: '32 từ' },
      { title: 'Bộ từ của tôi', description: 'Tập hợp từ tiếng Nhật bạn đã lưu.', meta: '4 bộ từ' },
      { title: 'Bộ từ cộng đồng', description: 'Khám phá bộ từ do người học khác chia sẻ.', meta: 'Khám phá' },
    ],
  },
  '/kanji': {
    eyebrow: 'LỘ TRÌNH HÁN TỰ', description: 'Học ý nghĩa, âm đọc, bộ thủ và thứ tự nét trong ngữ cảnh.',
    sections: [
      { title: 'Ôn tập hôm nay', description: 'Củng cố các chữ Hán trước khi quên.', meta: '20 chữ' },
      { title: 'Lộ trình JLPT', description: 'Học theo cấp độ từ N5 đến N1.', meta: '5 cấp độ' },
      { title: 'Tra cứu Hán tự', description: 'Tìm theo chữ, cách đọc hoặc ý nghĩa.', meta: 'Mở công cụ' },
    ],
  },
  '/grammar': {
    eyebrow: 'THƯ VIỆN NGỮ PHÁP', description: 'Học các cấu trúc thiết thực cùng ví dụ gần gũi.',
    sections: [
      { title: 'Ngữ pháp N5', description: 'Các cấu trúc thiết yếu cho người mới bắt đầu.', meta: 'Sơ cấp' },
      { title: 'Ngữ pháp N4', description: 'Mở rộng câu và diễn đạt các ý thường ngày.', meta: 'Sơ trung cấp' },
      { title: 'Ngữ pháp N3', description: 'Hiểu sắc thái và kết nối ý phức tạp hơn.', meta: 'Trung cấp' },
    ],
  },
};
