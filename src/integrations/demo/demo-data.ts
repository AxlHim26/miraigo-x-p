import type { CurrentUser } from '@/features/auth/services/auth-service';
import type { Course } from '@/features/courses/services/course-service';
import { studyLevels } from '@/features/reading/data/reading-schema';
import type { VocabularyCourseDetail } from '@/features/vocabulary/services/vocabulary-service';

export const demoOrigin = 'https://demo.miraigo.invalid';
export const demoUser: CurrentUser = { id: 980001, username: 'Quốc Khánh', email: 'khanh@example.test' };
export const demoVideo = demoOrigin + '/media/lesson.mp4';
export const demoPdf = demoOrigin + '/media/lesson.pdf';

export function demoDate(daysAgo = 0, now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

const groups = [
  { title: 'Giới thiệu bản thân', sections: [
    { type: 'VOCABULARY', title: 'Từ vựng', lessons: ['はじめまして · Lần đầu gặp mặt', '自己紹介 · Giới thiệu bản thân'] },
    { type: 'GRAMMAR', title: 'Ngữ pháp', lessons: ['〜は〜です · Mẫu câu giới thiệu'] },
  ] },
  { title: 'Cuộc sống hằng ngày', sections: [
    { type: 'CONVERSATION', title: 'Hội thoại', lessons: ['コンビニで · Ở cửa hàng tiện lợi', 'レストランで · Ở nhà hàng'] },
    { type: 'LISTENING', title: 'Luyện nghe', lessons: ['電車に乗ります · Đi tàu điện'] },
  ] },
];

export const demoCourses: Course[] = studyLevels.map((level, index) => ({
  id: 9100 + index, name: level + ' · Tiếng Nhật thực hành', description: 'Khóa học mẫu của MiraiGo',
  chapters: groups.map((group, chapter) => ({
    id: 9200 + index * 10 + chapter, title: `Chương ${chapter + 1} · ${group.title}`, chapterOrder: chapter + 1,
    description: chapter ? 'Luyện cách nói trong tình huống đi lại và mua sắm.' : 'Chào hỏi, nói tên và giới thiệu việc học tiếng Nhật.',
    sections: group.sections.map((section, part) => ({
      id: 9300 + index * 100 + chapter * 10 + part, type: section.type, title: section.title, sectionOrder: part + 1,
      lessons: section.lessons.map((title, lesson) => ({
        id: 9400 + index * 100 + chapter * 10 + part * 3 + lesson, title, lessonOrder: lesson + 1, videoUrl: demoVideo, pdfUrl: demoPdf,
      })),
    })),
  })),
}));

const words = [
  [
    ['わたし', 'わたし', 'Tôi'], ['学生', 'がくせい', 'Học sinh, sinh viên'], ['先生', 'せんせい', 'Giáo viên'],
    ['友達', 'ともだち', 'Bạn bè'], ['家族', 'かぞく', 'Gia đình'], ['大学', 'だいがく', 'Đại học'],
    ['名前', 'なまえ', 'Tên'], ['日本語', 'にほんご', 'Tiếng Nhật'],
  ],
  [
    ['予定', 'よてい', 'Dự định'], ['用事', 'ようじ', 'Việc cần làm'], ['途中', 'とちゅう', 'Giữa đường'],
    ['経験', 'けいけん', 'Kinh nghiệm'], ['連絡', 'れんらく', 'Liên lạc'], ['準備', 'じゅんび', 'Chuẩn bị'],
  ],
  [
    ['調査', 'ちょうさ', 'Điều tra'], ['比較', 'ひかく', 'So sánh'], ['影響', 'えいきょう', 'Ảnh hưởng'],
    ['印象', 'いんしょう', 'Ấn tượng'], ['効果', 'こうか', 'Hiệu quả'], ['工夫', 'くふう', 'Tìm cách cải tiến'],
  ],
  [
    ['傾向', 'けいこう', 'Xu hướng'], ['課題', 'かだい', 'Vấn đề cần giải quyết'], ['誤解', 'ごかい', 'Hiểu lầm'],
    ['維持', 'いじ', 'Duy trì'], ['普及', 'ふきゅう', 'Phổ cập'], ['割合', 'わりあい', 'Tỷ lệ'],
  ],
  [
    ['妥協', 'だきょう', 'Thỏa hiệp'], ['懸念', 'けねん', 'Quan ngại'], ['緩和', 'かんわ', 'Giảm nhẹ'],
    ['顕著', 'けんちょ', 'Rõ rệt'], ['是正', 'ぜせい', 'Sửa sai'], ['促進', 'そくしん', 'Thúc đẩy'],
  ],
];
const everyday = [
  ['駅', 'えき', 'Nhà ga'], ['電車', 'でんしゃ', 'Tàu điện'], ['学校', 'がっこう', 'Trường học'],
  ['店', 'みせ', 'Cửa hàng'], ['切符', 'きっぷ', 'Vé'], ['食べる', 'たべる', 'Ăn'],
];
export const demoVocabulary: VocabularyCourseDetail[] = studyLevels.flatMap((level, index) => {
  const makeCourse = (topic: string, part: number, entries: string[][]): VocabularyCourseDetail => ({
    id: 9600 + index * 10 + part, title: topic, level, type: 'TOPIC', totalWords: entries.length,
    entries: entries.map(([term, reading, meaning], word) => ({
      id: 9700 + index * 100 + part * 20 + word, term, reading, meaning, level, example: null,
    })),
  });
  return index === 0
    ? [makeCourse('Bản thân và gia đình', 0, words[index]), makeCourse('Cuộc sống hằng ngày', 1, everyday)]
    : [makeCourse('Từ vựng thực hành ' + level, 0, words[index])];
});
