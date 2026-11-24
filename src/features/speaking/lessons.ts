import { listeningLessons } from '@/features/listening/data/listening-lessons';

export const speakingTopics = ['Tất cả', 'Hội thoại', 'Đời sống', 'Công việc'] as const;
export const speakingLevels = ['N5', 'N4', 'N3', 'N2'] as const;
export type SpeakingLevel = typeof speakingLevels[number];

export const freeSpeakingTopics = [
  { name: 'Gia đình', prompt: 'Giới thiệu những người trong gia đình và một hoạt động cả nhà hay làm.' },
  { name: 'Trường học', prompt: 'Kể về một buổi học hoặc một môn bạn thích.' },
  { name: 'Cuộc sống hằng ngày', prompt: 'Mô tả thói quen buổi sáng hoặc ngày cuối tuần.' },
  { name: 'Du lịch', prompt: 'Kể về một nơi bạn muốn đến và lý do.' },
] as const;

const titles: Record<string, string> = {
  'gioi-thieu': 'はじめまして', 'mua-sam': 'コンビニで', 'chao-hoi': 'あいさつ', 'hoc-tieng-nhat': '日本語を勉強します',
};
const library = [...listeningLessons]
  .sort((left, right) => Number(right.id === 'gioi-thieu') - Number(left.id === 'gioi-thieu'))
  .map((lesson) => ({
    ...lesson,
    ...(lesson.id === 'gioi-thieu' ? {
      lines: [
        ...lesson.lines.slice(0, 2),
        { ...lesson.lines[2], japanese: '日本語を勉強します。', speakText: '日本語を勉強します。', reading: 'にほんごをべんきょうします', meaning: 'Tôi học tiếng Nhật.' },
        { ...lesson.lines[3], japanese: 'どうぞよろしくお願いします。', speakText: 'どうぞよろしくお願いします。', reading: 'どうぞよろしくおねがいします', meaning: 'Rất mong được giúp đỡ.' },
      ],
      words: [
        { term: '初めまして', reading: 'はじめまして', meaning: 'Rất vui được gặp bạn' },
        { term: '私', reading: 'わたし', meaning: 'Tôi' },
        { term: '田中', reading: 'たなか', meaning: 'Tanaka' },
        { term: '日本語', reading: 'にほんご', meaning: 'Tiếng Nhật' },
        { term: '勉強する', reading: 'べんきょうする', meaning: 'Học tập' },
        { term: 'お願いします', reading: 'おねがいします', meaning: 'Xin vui lòng' },
      ],
    } : {}),
    japaneseTitle: titles[lesson.id] ?? lesson.lines[0].japanese,
    category: lesson.topic === 'Đời sống' ? 'Đời sống' as const
      : lesson.topic === 'Công việc' || lesson.topic === 'Trường học' ? 'Công việc' as const : 'Hội thoại' as const,
  }));

const schedule = {
  id: 'doi-lich-n2', level: 'N2' as const, title: 'Thay đổi lịch họp', japaneseTitle: '会議の日程を変更する', category: 'Công việc' as const, cover: 'room' as const,
  lines: [
    { id: 201, japanese: '会議の日程を変更せざるを得ません。', speakText: '会議の日程を変更せざるを得ません。', reading: 'かいぎのにっていをへんこうせざるをえません', meaning: 'Chúng ta buộc phải thay đổi lịch họp.' },
    { id: 202, japanese: '参加者に早めに連絡していただけますか。', speakText: '参加者に早めに連絡していただけますか。', reading: 'さんかしゃにはやめにれんらくしていただけますか', meaning: 'Bạn có thể báo sớm cho những người tham dự được không?' },
    { id: 203, japanese: '都合がつき次第、返信いたします。', speakText: '都合がつき次第、返信いたします。', reading: 'つごうがつきしだい、へんしんいたします', meaning: 'Tôi sẽ trả lời ngay khi sắp xếp được.' },
  ],
  words: [
    { term: '日程', reading: 'にってい', meaning: 'Lịch trình' },
    { term: '変更', reading: 'へんこう', meaning: 'Thay đổi' },
    { term: '都合', reading: 'つごう', meaning: 'Hoàn cảnh, sự thuận tiện' },
  ],
};
export const speakingLessons = [...library, schedule];
export type SpeakingLesson = typeof speakingLessons[number];
export const speakingModes = ['Shadowing', 'Lặp lại', 'Nhập vai', 'Nghe viết'] as const;
export type SpeakingMode = typeof speakingModes[number];
