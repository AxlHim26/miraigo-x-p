import { z } from 'zod';

import { grammarLevels, grammarPoints } from '@/features/grammar/data/catalog';
import type { GrammarPoint } from '@/features/grammar/types/catalog';

export const grammarKinds = ['choice', 'order', 'particle'] as const;
export type GrammarKind = typeof grammarKinds[number];
export const grammarKindInfo = {
  choice: { title: 'Trắc nghiệm', description: 'Chọn đáp án đúng.' },
  order: { title: 'Sắp xếp câu', description: 'Xếp các cụm từ theo thứ tự.' },
  particle: { title: 'Chọn trợ từ', description: 'Điền trợ từ vào chỗ trống.' },
};

const text = z.string().trim().min(1).max(300);
const questionFields = { prompt: text, explanation: z.string().trim().min(1).max(700) };
const choicesSchema = z.array(text).length(4).refine((options) => new Set(options).size === 4);
const choice = z.object({
  ...questionFields,
  type: z.enum(['choice', 'particle']),
  choices: choicesSchema,
  answerIndex: z.number().int().min(0).max(3),
});
const order = z.object({
  ...questionFields,
  type: z.literal('order'),
  tiles: z.array(text).min(3).max(10).refine((tiles) => new Set(tiles).size > 1),
});

export const grammarDeckSchema = z.object({ questions: z.array(z.discriminatedUnion('type', [choice, order])).min(1).max(20) });
export type GrammarQuestion = z.infer<typeof grammarDeckSchema>['questions'][number];
export type GrammarAnswer = number | number[];

export function grammarPoint(id?: string) {
  return grammarPoints.find((point) => point.id === id);
}

export function grammarLevel(point: GrammarPoint) {
  return grammarLevels.find((item) => item.id === point.levelId);
}

function selectedQuestion(type: 'choice' | 'particle', prompt: string, answer: string, alternatives: string[], explanation: string, seed: number): GrammarQuestion | undefined {
  const choices = [...new Set(alternatives)].filter((value) => value !== answer && value.trim()).slice(0, 3);
  if (choices.length < 3) return undefined;
  const answerIndex = seed % 4;
  choices.splice(answerIndex, 0, answer);
  return { type, prompt, choices, answerIndex, explanation };
}

type ExerciseSample = { hint: string; tiles: string[]; gap: string; particle: string; explanation: string };
const samples: Record<string, ExerciseSample[]> = {
  'n5-01': [
    { hint: 'Tôi là học sinh.', tiles: ['わたし', 'は', '学生', 'です。'], gap: 'Dùng mẫu A は B です. わたし ___ 学生です。', particle: 'は', explanation: '「は」nêu chủ đề わたし, còn 学生です cho biết người nói là học sinh.' },
    { hint: 'Anh Tanaka là giáo viên.', tiles: ['田中さん', 'は', '先生', 'です。'], gap: 'Nêu chủ đề bằng mẫu A は B です. 田中さん ___ 先生です。', particle: 'は', explanation: '「は」đứng sau chủ đề 田中さん. 「先生です」là phần nhận định.' },
    { hint: 'Đây là sách.', tiles: ['これ', 'は', '本', 'です。'], gap: 'Dùng mẫu A は B です để giới thiệu đồ vật. これ ___ 本です。', particle: 'は', explanation: 'Dùng 「は」sau これ để nêu vật đang được giới thiệu.' },
    { hint: 'Tôi là Maria.', tiles: ['わたし', 'は', 'マリア', 'です。'], gap: 'Tự giới thiệu bằng mẫu A は B です. わたし ___ マリアです。', particle: 'は', explanation: 'Khi tự giới thiệu theo mẫu này, 「は」nối chủ đề わたし với tên người nói.' },
    { hint: 'Bạn đó là người Nhật.', tiles: ['あの人', 'は', '日本人', 'です。'], gap: 'Dùng mẫu A は B です để nhận định. あの人 ___ 日本人です。', particle: 'は', explanation: '「は」nêu あの人 làm chủ đề của nhận định.' },
  ],
  'n5-05': [
    { hint: 'Đây là túi của tôi.', tiles: ['これ', 'は', 'わたし', 'の', 'かばんです。'], gap: 'Biểu thị sở hữu. これはわたし ___ かばんです。', particle: 'の', explanation: '「の」nối người sở hữu わたし với vật sở hữu かばん.' },
    { hint: 'Đây là sách tiếng Nhật.', tiles: ['これ', 'は', '日本語', 'の', '本です。'], gap: 'Nối hai danh từ để chỉ nội dung sách. 日本語 ___ 本です。', particle: 'の', explanation: '「日本語の本」là sách về tiếng Nhật. 「の」liên kết hai danh từ.' },
  ],
  'n5-06': [
    { hint: 'Tôi cũng là học sinh.', tiles: ['わたし', 'も', '学生', 'です。'], gap: 'Diễn đạt “tôi cũng”. わたし ___ 学生です。', particle: 'も', explanation: '「も」thay cho 「は」để cho biết người nói cũng là học sinh.' },
  ],
  'n5-13': [
    { hint: 'Trong phòng có một cái bàn.', tiles: ['部屋', 'に', '机', 'が', 'あります。'], gap: 'Đánh dấu nơi có đồ vật. 部屋 ___ 机があります。', particle: 'に', explanation: '「に」chỉ nơi hiện hữu, 「が」đánh dấu vật tồn tại.' },
    { hint: 'Trong công viên có trẻ em.', tiles: ['公園', 'に', '子ども', 'が', 'います。'], gap: 'Chọn trợ từ chỉ nơi hiện hữu. 公園 ___ 子どもがいます。', particle: 'に', explanation: 'Dùng 「に」với địa điểm và 「います」cho người hoặc động vật.' },
  ],
};

export function grammarExercises(point: GrammarPoint, type: GrammarKind): GrammarQuestion[] {
  const practice = samples[point.id] ?? [];
  if (type === 'order') return practice.map(({ hint, tiles, explanation }) => ({ type, prompt: hint, tiles, explanation }));
  const particles = ['が', 'は', 'を', 'の', 'に', 'も', 'で'];
  const gaps = practice.flatMap(({ gap, particle, explanation }, index) => {
    const item = selectedQuestion(type, gap, particle, particles, explanation, 1 + index);
    return item ? [item] : [];
  });
  if (type === 'particle') return gaps;

  const seed = Number(point.id.match(/\d+$/)?.[0] ?? point.lesson);
  const related = grammarPoints.filter((item) => item.id !== point.id && item.levelId === point.levelId);
  const questions = [
    ...gaps,
    selectedQuestion('choice', `Mẫu ${point.title} có nghĩa gì?`, point.meaning, related.map((item) => item.meaning), point.meaning, seed + 1),
    selectedQuestion('choice', `Chọn cấu trúc của mẫu ${point.title}.`, point.structure, related.map((item) => item.structure), point.structure, seed + 2),
    ...point.examples.map((example, index) => selectedQuestion('choice', `Chọn nghĩa của câu:\n${example.japanese}`,
      example.vietnamese, related.flatMap((item) => item.examples.map((other) => other.vietnamese)), example.vietnamese, seed + index + 3)),
  ];
  return questions.filter((item): item is GrammarQuestion => !!item).slice(0, 10);
}

export function gradeGrammar(question: GrammarQuestion, answer: GrammarAnswer) {
  if (question.type !== 'order') return answer === question.answerIndex;
  return Array.isArray(answer) && answer.length === question.tiles.length
    && answer.every((tile, index) => question.tiles[tile] === question.tiles[index]);
}

export function grammarAnswerText(question: GrammarQuestion, answer?: GrammarAnswer) {
  if (question.type === 'order') return Array.isArray(answer) ? answer.map((index) => question.tiles[index]).join(' ') : question.tiles.join(' ');
  return question.choices[typeof answer === 'number' ? answer : question.answerIndex];
}
