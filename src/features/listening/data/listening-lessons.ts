import { listeningQuestions, type ListeningQuestion } from '@/features/practice/data/listening-data';

export type ListeningLevel = ListeningQuestion['level'];
export type ListeningLine = ListeningQuestion & { reading?: string };
type ListeningWord = { term: string; reading: string; meaning: string };
export type ListeningLesson = {
  id: string;
  title: string;
  level: ListeningLevel;
  topic: string;
  description: string;
  lines: readonly ListeningLine[];
  words: readonly ListeningWord[];
  cover: 'fuji' | 'room';
};

export const listeningLevels = ['N5', 'N4', 'N3'] as const;

const existingLines = new Map(listeningQuestions.map((line) => [line.id, line]));

function lineById(id: number): ListeningLine {
  const line = existingLines.get(id);
  if (!line) throw new Error(`Missing listening line ${id}`);
  return line;
}

const n5 = (
  id: number, japanese: string, reading: string, meaning: string, distractors: ListeningQuestion['distractors'],
): ListeningLine => ({ id, level: 'N5', japanese, speakText: japanese, reading, meaning, distractors });

export const listeningLessons: readonly ListeningLesson[] = [
  {
    id: 'chao-hoi', title: 'Chào hỏi', level: 'N5', topic: 'Giao tiếp',
    description: 'Nghe và nhận ra những lời chào thường dùng vào các thời điểm trong ngày.',
    cover: 'fuji',
    lines: [
      lineById(1),
      n5(13, 'こんにちは。', 'こんにちは', 'Xin chào.', ['Chúc ngủ ngon.', 'Tạm biệt.', 'Chào buổi sáng.']),
      n5(14, 'こんばんは。', 'こんばんは', 'Chào buổi tối.', ['Cảm ơn.', 'Xin lỗi.', 'Chào buổi sáng.']),
    ],
    words: [
      { term: 'おはようございます', reading: 'おはようございます', meaning: 'Chào buổi sáng' },
      { term: 'こんにちは', reading: 'こんにちは', meaning: 'Xin chào' },
      { term: 'こんばんは', reading: 'こんばんは', meaning: 'Chào buổi tối' },
    ],
  },
  {
    id: 'hoc-tieng-nhat', title: 'Học tiếng Nhật', level: 'N5', topic: 'Trường học',
    description: 'Luyện nghe lời giới thiệu về việc học, quốc tịch và một số nghề nghiệp đơn giản.',
    cover: 'room',
    lines: [
      lineById(4), lineById(5),
      n5(15, '私は学生です。', 'わたしはがくせいです', 'Tôi là học sinh.', ['Tôi là giáo viên.', 'Tôi là nhân viên công ty.', 'Tôi là người Nhật.']),
      n5(16, '私は先生です。', 'わたしはせんせいです', 'Tôi là giáo viên.', ['Tôi là sinh viên.', 'Tôi là bác sĩ.', 'Tôi là nhân viên công ty.']),
    ],
    words: [
      { term: '日本語', reading: 'にほんご', meaning: 'Tiếng Nhật' },
      { term: '学生', reading: 'がくせい', meaning: 'Học sinh, sinh viên' },
      { term: '先生', reading: 'せんせい', meaning: 'Giáo viên' },
    ],
  },
  {
    id: 'gioi-thieu', title: 'Giới thiệu bản thân', level: 'N5', topic: 'Giao tiếp',
    description: 'Nghe một đoạn tự giới thiệu về tên, quê quán, nghề nghiệp và sở thích.',
    cover: 'room',
    lines: [
      n5(17, '初めまして。', 'はじめまして', 'Rất vui được gặp bạn.', ['Chúc ngủ ngon.', 'Bạn khỏe không?', 'Tạm biệt.']),
      n5(18, '私は田中です。', 'わたしはたなかです', 'Tôi là Tanaka.', ['Tôi là Yamada.', 'Tôi là giáo viên.', 'Tôi đến từ Nhật Bản.']),
      n5(19, '日本の出身です。', 'にほんのしゅっしんです', 'Tôi đến từ Nhật Bản.', ['Tôi đang ở Nhật Bản.', 'Tôi đến từ Việt Nam.', 'Tôi học tiếng Nhật.']),
      n5(20, '会社員です。', 'かいしゃいんです', 'Tôi là nhân viên công ty.', ['Tôi là học sinh.', 'Tôi là giáo viên.', 'Tôi là bác sĩ.']),
      n5(21, '趣味は映画を見ることです。', 'しゅみはえいがをみることです', 'Sở thích của tôi là xem phim.', ['Tôi thích nghe nhạc.', 'Tôi thích đọc sách.', 'Tôi thích đi du lịch.']),
    ],
    words: [
      { term: '出身', reading: 'しゅっしん', meaning: 'Quê quán, xuất thân' },
      { term: '会社員', reading: 'かいしゃいん', meaning: 'Nhân viên công ty' },
      { term: '趣味', reading: 'しゅみ', meaning: 'Sở thích' },
      { term: '映画', reading: 'えいが', meaning: 'Phim' },
    ],
  },
  {
    id: 'mua-sam', title: 'Mua sắm và hỏi đường', level: 'N5', topic: 'Đời sống',
    description: 'Luyện nghe những câu hỏi về giá tiền và vị trí khi ra ngoài.',
    cover: 'fuji',
    lines: [
      lineById(2), lineById(3),
      n5(22, 'カードで払えますか。', 'カードではらえますか', 'Tôi có thể trả bằng thẻ không?', ['Cửa hàng mở đến mấy giờ?', 'Cái này giá bao nhiêu?', 'Tôi có thể thử cái này không?']),
    ],
    words: [
      { term: 'いくら', reading: 'いくら', meaning: 'Bao nhiêu tiền' },
      { term: 'トイレ', reading: 'トイレ', meaning: 'Nhà vệ sinh' },
      { term: '払う', reading: 'はらう', meaning: 'Trả tiền' },
    ],
  },
  {
    id: 'hoi-ga', title: 'Hỏi đường đến ga', level: 'N4', topic: 'Đời sống',
    description: 'Nhận ra cách hỏi đường và cách nhờ người đối diện nói chậm hơn.',
    cover: 'room',
    lines: [lineById(6), lineById(7)],
    words: [
      { term: '駅', reading: 'えき', meaning: 'Nhà ga' },
      { term: 'ゆっくり', reading: 'ゆっくり', meaning: 'Chậm rãi' },
      { term: 'どうやって', reading: 'どうやって', meaning: 'Bằng cách nào' },
    ],
  },
  {
    id: 'doi-thoai-n4', title: 'Câu chuyện thường ngày', level: 'N4', topic: 'Trường học',
    description: 'Nghe các câu kể về bài tập và những điều nghe được về ngày mai.',
    cover: 'fuji',
    lines: [lineById(8), lineById(9)],
    words: [
      { term: '宿題', reading: 'しゅくだい', meaning: 'Bài tập về nhà' },
      { term: '忘れる', reading: 'わすれる', meaning: 'Quên' },
      { term: '天気', reading: 'てんき', meaning: 'Thời tiết' },
    ],
  },
  {
    id: 'doi-thoai-n3', title: 'Cuộc sống ở Tokyo', level: 'N3', topic: 'Giao tiếp',
    description: 'Nghe câu dài về mục đích, dự báo thời tiết và cảm nhận khi xem phim.',
    cover: 'room',
    lines: [lineById(10), lineById(11), lineById(12)],
    words: [
      { term: '天気予報', reading: 'てんきよほう', meaning: 'Dự báo thời tiết' },
      { term: '東京', reading: 'とうきょう', meaning: 'Tokyo' },
      { term: '面白い', reading: 'おもしろい', meaning: 'Thú vị' },
    ],
  },
];

export const allListeningLines = listeningLessons.flatMap((lesson) => lesson.lines);
export const findListeningLesson = (id: string | undefined) => listeningLessons.find((lesson) => lesson.id === id);
export const listeningTitle = (lesson: ListeningLesson) =>
  `Bài ${listeningLessons.filter((entry) => entry.level === lesson.level).indexOf(lesson) + 1}: ${lesson.title}`;
