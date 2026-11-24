import { listeningLessons } from '@/features/listening/data/listening-lessons';
import { applyListeningAction, emptyListeningProgress, type ListeningProgress } from '@/features/listening/data/listening-progress';
import { readingLibrary } from '@/features/reading/data/reading-library';
import { applyReadingAction, emptyReadingProgress, readingDate, type ReadingProgress } from '@/features/reading/data/reading-progress';
import { demoDate } from '@/integrations/demo/demo-data';

export function demoListeningProgress(): ListeningProgress {
  let result = emptyListeningProgress;
  for (const [index, lesson] of listeningLessons.slice(0, 4).entries()) {
    const when = demoDate(7 - index);
    result = applyListeningAction(result, { type: 'favorite', lesson }, when);
    lesson.lines.forEach((_, index) => { result = applyListeningAction(result, { type: 'heard', lesson, index }, when); });
    result = applyListeningAction(result, { type: 'submit', lesson, answers: lesson.lines.length, correct: lesson.lines.length - 1, review: true }, demoDate(index));
  }
  return result;
}

export function demoReadingProgress(): ReadingProgress {
  let result = emptyReadingProgress;
  for (const [index, article] of readingLibrary.slice(0, 4).entries()) {
    const when = demoDate(4 - index);
    result = applyReadingAction(result, { type: 'save', article }, when);
    result = applyReadingAction(result, { type: 'retry', article }, when);
    article.questions.forEach((question, position) => {
      const option = position === index ? question.options.find((choice) => choice.id !== question.correctOptionId)?.id : question.correctOptionId;
      if (option) result = applyReadingAction(result, { type: 'answer', article, question: question.id, option }, when);
    });
    result = applyReadingAction(result, { type: 'submit', article }, when);
  }
  return result;
}

export function demoVocabularyHistory() {
  return Object.fromEntries(Array.from({ length: 6 }, (_, index) => [readingDate(demoDate(index)), [8 - index % 3, 10]]));
}
