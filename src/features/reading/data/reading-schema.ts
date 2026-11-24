import { z } from 'zod';

export const studyLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type StudyLevel = typeof studyLevels[number];
export const preferredReadingLevels = ['N5', 'N4', 'N3'] as const;

export const readingTopics = {
  daily: 'Cuộc sống hằng ngày', family: 'Gia đình', school: 'Trường học', travel: 'Du lịch',
} as const;
export const readingLengths = {
  short: { label: 'Ngắn', minutes: 3 },
  medium: { label: 'Vừa', minutes: 5 },
  long: { label: 'Dài', minutes: 8 },
} as const;

export const readingSettingsSchema = z.object({
  topic: z.enum(['daily', 'family', 'school', 'travel']),
  length: z.enum(['short', 'medium', 'long']),
  questionCount: z.number().int().min(3).max(6),
});
export const readingOptionSchema = z.enum(['A', 'B', 'C', 'D']);
const passageId = z.string().regex(/^[a-z0-9-]{1,100}$/i);
export const readingWordSchema = z.object({
  term: z.string().min(1).max(35),
  reading: z.string().min(1).max(60),
  meaningVi: z.string().min(1).max(200),
});
const readingQuestionSchema = z.object({
  id: z.string().regex(/^q-[1-9][0-9]*$/),
  question: z.string().trim().min(1).max(400),
  options: z.array(z.object({ id: readingOptionSchema, text: z.string().trim().min(1).max(300) })).length(4),
  correctOptionId: readingOptionSchema,
  explanationVi: z.string().trim().min(1).max(1200),
  explanationJa: z.string().trim().min(1).max(1200),
}).refine(({ options }) => new Set(options.map((option) => option.id)).size === 4
  && new Set(options.map((option) => option.text)).size === 4);

export const readingExerciseSchema = z.object({
  id: passageId,
  level: z.enum(studyLevels),
  title: z.string().trim().min(1).max(150),
  passageLines: z.array(z.string().trim().min(1).max(1000)).min(1).max(30),
  questions: z.array(readingQuestionSchema).min(3).max(6)
    .refine((questions) => new Set(questions.map((question) => question.id)).size === questions.length),
  vocabulary: z.array(readingWordSchema).max(8).optional(),
  generation: readingSettingsSchema.partial().optional(),
});

export const readingArticleSchema = readingExerciseSchema.extend({
  topic: z.string().min(1).max(80),
  minutes: z.number().int().positive().max(20),
  source: z.enum(['library', 'ai']),
});

export type ReadingGeneration = z.infer<typeof readingSettingsSchema>;
export type ReadingOption = z.infer<typeof readingOptionSchema>;
export type ReadingExercise = z.infer<typeof readingExerciseSchema>;
export type ReadingArticle = z.infer<typeof readingArticleSchema>;
export type ReadingWord = z.infer<typeof readingWordSchema>;
