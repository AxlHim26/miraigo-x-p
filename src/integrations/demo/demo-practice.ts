import { grammarLevels, grammarPoints } from '@/features/grammar/data/catalog';
import { grammarExercises, type GrammarQuestion } from '@/features/grammar/data/grammar-exercises';
import { readingLibrary } from '@/features/reading/data/reading-library';
import { readingSettingsSchema, readingTopics } from '@/features/reading/data/reading-schema';
import { ApiError } from '@/shared/utils/api-error';

type GrammarInput = { level: string; topic: string; structure: string; type: 'choice' | 'order' | 'particle'; questionCount: number };
const particles = ['は', 'を', 'が', 'に'];
const names = ['田中', '鈴木', '佐藤', '山田', '加藤', 'ミン', 'リン', 'アン', 'ケン', 'ユキ'];
const occupations = [['学生', 'sinh viên'], ['先生', 'giáo viên'], ['会社員', 'nhân viên công ty'], ['医者', 'bác sĩ']];

function grammar(input: GrammarInput) {
  const level = grammarLevels.find((item) => item.level === input.level);
  const point = grammarPoints.find((point) => point.levelId === level?.id && point.title === input.topic);
  const existing = point ? grammarExercises(point, input.type) : [];
  const questions: GrammarQuestion[] = [...existing];
  for (let index = questions.length; index < input.questionCount; index += 1) {
    const name = names[index % names.length];
    const [job, translation] = occupations[Math.floor(index / names.length) % occupations.length];
    const example = point?.examples[index % (point.examples.length || 1)];
    if (input.type === 'order') {
      const char = index + 1;
      questions.push({ type: 'order', prompt: `${char}. ${name} là ${translation}.`, tiles: [name, 'は', job, 'です。'],
        explanation: 'Ghép câu theo thứ tự chủ đề, trợ từ は, danh từ và です。' });
    } else if (input.type === 'choice' && example) {
      const related = grammarPoints.filter((entry) => entry.levelId === level?.id).flatMap((entry) => entry.examples.map((item) => item.vietnamese));
      const alternatives = [...new Set(related)].filter((item) => item !== example.vietnamese).slice(0, 3);
      if (alternatives.length === 3) {
        const answerIndex = index % 4;
        alternatives.splice(answerIndex, 0, example.vietnamese);
        questions.push({ type: 'choice', prompt: `${index + 1}. ${example.japanese}`, choices: alternatives, answerIndex, explanation: example.vietnamese });
        continue;
      }
    }
    if (questions.length === index) questions.push({ type: input.type === 'particle' ? 'particle' : 'choice',
      prompt: `${name} ___ ${job}です。`, choices: particles, answerIndex: 0, explanation: '「は」đánh dấu chủ đề của câu.' });
  }
  return { questions: questions.slice(0, input.questionCount) };
}

export function practiceRequest(path: string[], body: unknown) {
  const [tool, action] = path;
  if (tool === 'grammar' && action === 'generate') return grammar(body as GrammarInput);
  if (tool === 'reading' && action === 'generate') {
    const input = body as { proficiencyLevel: string };
    const settings = readingSettingsSchema.safeParse(body);
    const options = settings.success ? settings.data : { topic: 'daily' as const, length: 'short' as const, questionCount: 4 };
    const matching = readingLibrary.filter((item) => item.level === input.proficiencyLevel);
    const article = matching.find((item) => item.topic === readingTopics[options.topic]) ?? matching[0] ?? readingLibrary[0];
    const questions = Array.from({ length: options.questionCount }, (_, index) => {
      const question = article.questions[index % article.questions.length];
      return { ...question, id: `q-${index + 1}` };
    });
    return { ...article, id: 'demo-reading-' + Date.now().toString(36), level: input.proficiencyLevel,
      title: article.title + ' · Demo', generation: options, questions };
  }
  if (tool === 'reading' && action === 'annotate') {
    const { lines } = body as { lines: string[] };
    return { items: lines.map((line) => ({ line, romaji: '', translation: 'Đoạn tiếng Nhật trong bài đọc mẫu.' })) };
  }
  if (tool === 'reading' && action === 'word') {
    const { word } = body as { word: string };
    const known = readingLibrary.flatMap((item) => item.vocabulary ?? []).find((entry) => entry.term === word);
    return { word, reading: known?.reading ?? word, meaningVi: known?.meaningVi ?? 'Từ trong bài đọc mẫu',
      exampleJa: `「${word}」を勉強します。`, exampleVi: 'Tôi học từ này.' };
  }
  throw new ApiError('Tính năng này chưa có dữ liệu demo.', 404);
}
