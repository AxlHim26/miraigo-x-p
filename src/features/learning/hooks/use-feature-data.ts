import { useQuery } from '@tanstack/react-query';

import { getCourseTree } from '@/features/courses/services/course-service';
import { getPublishedExams } from '@/features/practice/services/jlpt-service';
import { getGrammarBooks } from '@/features/grammar/services/grammar-service';
import { getVocabularyCourses, getVocabularyStats } from '@/features/vocabulary/services/vocabulary-service';
import type { FeatureRoute, FeatureSection } from '@/features/learning/types/feature-screen';

export type FeatureRemoteData = {
  source: 'backend' | 'local';
  sections?: FeatureSection[];
  summary?: string;
};

const loadFeatureData = async (route: FeatureRoute): Promise<FeatureRemoteData> => {
  if (route === '/courses') {
    const courses = await getCourseTree();
    return {
      source: 'backend',
      summary: `${courses.length} khóa học trong thư viện`,
      sections: courses.map((course) => ({
        id: course.id,
        title: course.name,
        description: course.description || 'Bài học tiếng Nhật theo lộ trình.',
        meta: `${course.chapters?.length ?? 0} chương`,
        href: { pathname: '/courses/[courseId]', params: { courseId: course.id } },
      })),
    };
  }

  if (route === '/practice') {
    const exams = await getPublishedExams();
    return {
      source: 'backend',
      summary: `${exams.length} đề luyện JLPT`,
      sections: exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        description: `Đề luyện ${exam.level} năm ${exam.examYear}.`,
        meta: `${exam.totalDurationMinutes} phút`,
        href: { pathname: '/practice/jlpt/exam/[examId]', params: { examId: exam.id } },
      })),
    };
  }

  if (route === '/vocabulary') {
    const [courses, stats] = await Promise.all([getVocabularyCourses(), getVocabularyStats()]);
    return {
      source: 'backend',
      summary: `${stats.dueForReview} từ đến hạn ôn tập`,
      sections: courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: `Khóa từ vựng trình độ ${course.level}.`,
        meta: `${course.totalWords} từ`,
        href: { pathname: '/vocabulary/[courseId]', params: { courseId: course.id } },
      })),
    };
  }

  if (route === '/grammar') {
    const books = await getGrammarBooks();
    return {
      source: 'backend',
      summary: `${books.length} sách ngữ pháp trong thư viện`,
      sections: books.map((book) => ({
        id: book.id,
        title: book.title,
        description: `Mẫu ngữ pháp và ví dụ ở trình độ ${book.level}.`,
        meta: book.isActive ? 'Có thể học' : 'Sắp ra mắt',
      })),
    };
  }

  return { source: 'local' };
};

export const useFeatureData = (route: FeatureRoute) =>
  useQuery({
    queryKey: ['feature', route],
    queryFn: () => loadFeatureData(route),
    staleTime: 60_000,
    retry: 1,
  });
