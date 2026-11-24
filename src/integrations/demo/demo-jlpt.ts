import type { JlptAttemptAnswer, JlptAttemptResult, JlptExamDetail, JlptPracticeQuestion, JlptSectionAttempt, JlptStartAttemptResponse } from '@/features/practice/types/jlpt-schema';
import { readingLibrary } from '@/features/reading/data/reading-library';
import { studyLevels } from '@/features/reading/data/reading-schema';
import { demoDate, demoVideo, demoVocabulary } from '@/integrations/demo/demo-data';
import { ApiError } from '@/shared/utils/api-error';

const keys = ['A', 'B', 'C', 'D'];
const sections = [
  ['LANGUAGE_KNOWLEDGE', 'Từ vựng'], ['GRAMMAR_KNOWLEDGE', 'Ngữ pháp'],
  ['READING', 'Đọc hiểu'], ['LISTENING', 'Nghe hiểu'],
] as const;
type DemoAttempt = { id: number; examId: number; startedAt: string; status: 'IN_PROGRESS' | 'SUBMITTED'; answers: JlptAttemptAnswer[]; sections: JlptSectionAttempt[] };
export type DemoJlptState = { attempts: DemoAttempt[]; nextId: number };

function questions(level: string, type: string): JlptPracticeQuestion[] {
  const atLevel = demoVocabulary.find((course) => course.level === level) ?? demoVocabulary[0];
  if (type === 'LISTENING') {
    const audioQuestions = [
      { prompt: '話している人の名前は何ですか。', choices: ['山田', '田中', '高橋', '鈴木'], answer: 'B', explanation: 'Người nói giới thiệu tên mình là Tanaka.' },
      { prompt: '何を勉強しますか。', choices: ['日本語', '英語', '数学', '音楽'], answer: 'A', explanation: 'Người nói học tiếng Nhật.' },
      { prompt: '最初に何と言いましたか。', choices: ['おやすみなさい', 'ありがとう', 'また明日', '初めまして'], answer: 'D', explanation: '「初めまして」là lời chào khi gặp lần đầu.' },
    ];
    return audioQuestions.map(({ prompt, choices, answer, explanation }, index) => ({
      id: 40 + index, questionNumber: index + 1, prompt, audioUrl: demoVideo, explanation, correctOptionKey: answer,
      options: choices.map((text, item) => ({ key: keys[item], text })),
    }));
  }
  if (type === 'READING') {
    const article = readingLibrary.find((item) => item.level === level) ?? readingLibrary[0];
    return article.questions.map((question, index) => ({
      id: 30 + index, questionNumber: index + 1, prompt: question.question,
      passageText: article.passageLines.map((line) => line.replace(/\[([^|\]]+)\|[^\]]+\]/g, '$1')).join('\n'),
      explanation: question.explanationVi, correctOptionKey: question.correctOptionId,
      options: question.options.map((option) => ({ key: option.id, text: option.text })),
    }));
  }
  if (type === 'GRAMMAR_KNOWLEDGE') {
    const items = [
      ['わたし ___ 学生です。', 'は', 'Nêu chủ đề bằng 「は」。'],
      ['わたしは日本語 ___ 勉強します。', 'を', '「を」đánh dấu tân ngữ.'],
      ['学校 ___ 行きます。', 'へ', '「へ」chỉ hướng di chuyển.'],
      ['学校 ___ 日本語を勉強します。', 'で', '「で」đánh dấu nơi diễn ra hành động.'],
    ];
    return items.map(([prompt, correct, explanation], index) => {
      const options = items.map((entry) => entry[1]);
      return { id: 20 + index, questionNumber: index + 1, prompt, explanation, correctOptionKey: keys[options.indexOf(correct)],
        options: options.map((text, item) => ({ key: keys[item], text })) };
    });
  }
  return atLevel.entries.slice(0, 6).map((word, index) => {
    const options = Array.from({ length: 4 }, (_, item) => atLevel.entries[(index + item) % atLevel.entries.length].meaning);
    const offset = index % 4;
    const texts = options.slice(4 - offset).concat(options.slice(0, 4 - offset));
    return { id: 10 + index, questionNumber: index + 1, prompt: `「${word.term}」có nghĩa gì?`, explanation: word.term + ' nghĩa là ' + word.meaning,
      correctOptionKey: keys[texts.indexOf(word.meaning)], options: texts.map((text, item) => ({ key: keys[item], text })) };
  });
}
const demoExams: JlptExamDetail[] = studyLevels.map((level, index) => ({
  id: 9900 + index, level, code: 'DEMO-' + level, title: 'Đề thi thử ' + level + ' · MiraiGo', examYear: 2025, examMonth: 12, totalDurationMinutes: 30,
  sections: sections.map(([sectionType, title], order) => ({
    id: 100 + order, sectionType, title, sectionOrder: order + 1, durationMinutes: order ? 7 : 9,
    questions: questions(level, sectionType).map((question) => ({ ...question, id: question.id + order * 100 })),
  })),
}));

function startAttempt(exam: JlptExamDetail, id: number, time = new Date().toISOString()): DemoAttempt {
  return { id, examId: exam.id, startedAt: time, status: 'IN_PROGRESS', answers: [],
    sections: exam.sections.map((section) => ({ sectionId: section.id, sectionStatus: 'NOT_STARTED', remainingSeconds: section.durationMinutes * 60 })) };
}

export function initialJlpt(): DemoJlptState {
  const exam = demoExams[0];
  const attempt = startAttempt(exam, 1, demoDate(2).toISOString());
  attempt.status = 'SUBMITTED';
  attempt.sections = attempt.sections.map((section) => ({ ...section, sectionStatus: 'SUBMITTED', remainingSeconds: 0 }));
  attempt.answers = exam.sections.flatMap((section) => section.questions.map((question, index) => ({
    questionId: question.id, selectedOptionKey: index % 4 !== 0 ? question.correctOptionKey ?? null : null,
  })));
  return { attempts: [attempt], nextId: 1 };
}

function lookupExam(id: number) {
  const exam = demoExams.find((exam) => exam.id === id);
  if (!exam) throw new ApiError('Không tìm thấy đề thi.', 404);
  return exam;
}

function score(attempt: DemoAttempt, exam: JlptExamDetail): JlptAttemptResult {
  const results = exam.sections.map((section) => {
    const answers = section.questions.map((question) => {
      const selectedOptionKey = attempt.answers.find((answer) => answer.questionId === question.id)?.selectedOptionKey ?? null;
      return { ...question, questionId: question.id, selectedOptionKey, correctOptionKey: question.correctOptionKey ?? '',
        correct: !!selectedOptionKey && selectedOptionKey === question.correctOptionKey };
    });
    const rawScore = answers.filter((item) => item.correct).length;
    return { sectionId: section.id, sectionType: section.sectionType, title: section.title, rawScore,
      rawMaxScore: answers.length, scaledScore: Math.round(45 * rawScore / answers.length), scaledMaxScore: 45, questions: answers };
  });
  const totalScaledScore = results.reduce((sum, result) => sum + result.scaledScore, 0);
  return { attemptId: attempt.id, examId: exam.id, examTitle: exam.title, examCode: exam.code, level: exam.level,
    totalScaledScore, passed: totalScaledScore >= 90, sections: results };
}

function session(attempt: DemoAttempt, exam: JlptExamDetail): JlptStartAttemptResponse {
  const remainingSeconds = attempt.status !== 'IN_PROGRESS' ? 0
    : Math.max(0, exam.totalDurationMinutes * 60 - Math.floor((Date.now() - Date.parse(attempt.startedAt)) / 1000));
  return { attemptId: attempt.id, examId: exam.id, status: attempt.status, startedAt: attempt.startedAt,
    totalDurationMinutes: exam.totalDurationMinutes, remainingSeconds, answers: attempt.answers,
    sectionAttempts: attempt.sections.map((section) => ({ ...section, remainingSeconds: section.expiresAt && section.sectionStatus === 'IN_PROGRESS'
      ? Math.max(0, Math.min(remainingSeconds, Math.ceil((Date.parse(section.expiresAt) - Date.now()) / 1000))) : section.remainingSeconds })),
  };
}

export function jlptRequest(state: DemoJlptState, path: string[], params: URLSearchParams, method: string, body: unknown) {
  const [resource, id, child, segment, action] = path;
  if (resource === 'practice') return questions(params.get('level') ?? 'N5', params.get('sectionType') ?? 'LANGUAGE_KNOWLEDGE');
  if (resource === 'placement') return 'N5';
  if (resource === 'exams' && !id) return demoExams.map(({ sections: _sections, ...exam }) => exam);
  if (resource === 'exams') {
    const exam = lookupExam(Number(id));
    if (method === 'GET') return exam;
    const attempt = startAttempt(exam, ++state.nextId);
    state.attempts.unshift(attempt);
    return session(attempt, exam);
  }
  if (id === 'history') return state.attempts.map((attempt) => {
    const exam = lookupExam(attempt.examId);
    return { attemptId: attempt.id, examId: exam.id, examTitle: exam.title, level: exam.level, status: attempt.status,
      totalScaledScore: attempt.status === 'SUBMITTED' ? score(attempt, exam).totalScaledScore : null };
  });
  const attempt = state.attempts.find((attempt) => attempt.id === Number(id));
  if (!attempt) throw new ApiError('Không tìm thấy bài làm.', 404);
  const exam = lookupExam(attempt.examId);
  if (child === 'result') return score(attempt, exam);
  if (method === 'GET') return session(attempt, exam);
  if (attempt.status !== 'IN_PROGRESS') throw new ApiError('Bài thi đã được nộp.', 409);
  if (child === 'answers') {
    const { answers } = body as { answers: JlptAttemptAnswer[] };
    for (const answer of answers) attempt.answers = attempt.answers.filter((item) => item.questionId !== answer.questionId).concat(answer);
    return { attemptId: attempt.id, savedCount: answers.length };
  }
  if (child === 'sections') {
    const section = attempt.sections.find((item) => item.sectionId === Number(segment));
    if (!section) throw new ApiError('Không tìm thấy phần thi.', 404);
    const now = new Date();
    if (action === 'start' && section.sectionStatus === 'NOT_STARTED') Object.assign(section, { sectionStatus: 'IN_PROGRESS',
      startedAt: now.toISOString(), expiresAt: new Date(now.getTime() + section.remainingSeconds * 1000).toISOString() });
    if (action === 'submit') Object.assign(section, { sectionStatus: 'SUBMITTED', submittedAt: now.toISOString(), remainingSeconds: 0 });
    return section;
  }
  if (child === 'submit') {
    attempt.status = 'SUBMITTED';
    return { attemptId: attempt.id };
  }
  throw new ApiError('Không tìm thấy thao tác JLPT.', 404);
}
