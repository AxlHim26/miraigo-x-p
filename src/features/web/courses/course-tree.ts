import type {
  Course,
  CourseChapter as ApiChapter,
  CourseSection as ApiSection,
} from '@/features/courses/services/course-service';

export type { CourseLesson } from '@/features/courses/services/course-service';
export type SectionType = 'VOCABULARY' | 'GRAMMAR' | 'KANJI' | 'READING' | 'LISTENING';

export type CourseSection = Omit<ApiSection, 'lessons' | 'type'> & {
  type: SectionType;
  lessons: NonNullable<ApiSection['lessons']>;
};

export type CourseChapter = Omit<ApiChapter, 'sections'> & { sections: CourseSection[] };
export type CourseTree = Omit<Course, 'chapters'> & { chapters: CourseChapter[] };
