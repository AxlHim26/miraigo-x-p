"use client";

import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import * as React from "react";

import type { CourseChapter, CourseLesson, CourseSection, CourseTree, SectionType } from "@/features/web/courses/course-tree";
import { SECTION_META } from "@/features/web/courses/course-tree-ui";

const NESTED_CARD_HEIGHT_CLASS = "h-[128px]";

const normalizeThumbnailUrl = (rawUrl: string | null) => {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace("www.", "");

    if (host === "drive.google.com" || host === "docs.google.com") {
      const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const fileId = filePathMatch?.[1] ?? url.searchParams.get("id");

      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
      }
    }

    return trimmed;
  } catch {
    return trimmed;
  }
};

type CourseThumbnailProps = {
  title: string;
  thumbnailUrl: string | null;
};

function CourseThumbnail({ title, thumbnailUrl }: CourseThumbnailProps) {
  const [hasError, setHasError] = React.useState(false);
  const resolvedUrl = React.useMemo(() => normalizeThumbnailUrl(thumbnailUrl), [thumbnailUrl]);
  return (
    <Avatar
      src={!hasError && resolvedUrl ? resolvedUrl : ""}
      alt={title}
      imgProps={{ onError: () => setHasError(true) }}
      className="absolute bottom-4 right-4 h-14 w-14 border border-white/80 bg-slate-100 text-slate-500 shadow-md"
    >
      <AutoStoriesRoundedIcon fontSize="small" />
    </Avatar>
  );
}

type CourseCardProps = {
  course: CourseTree;
  lessonCount: number;
  onSelect: (courseId: number) => void;
};

export const CourseCard = React.memo(function CourseCard({
  course,
  lessonCount,
  onSelect,
}: CourseCardProps) {
  return (
    <Paper
      elevation={0}
      onClick={() => onSelect(course.id)}
      className="group relative h-[260px] cursor-pointer overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[linear-gradient(165deg,rgba(255,255,255,0.97),rgba(242,246,252,0.9))] p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_40px_-26px_rgba(59,130,246,0.6)] dark:bg-[linear-gradient(165deg,rgba(42,42,42,0.95),rgba(33,33,33,0.93))] dark:hover:border-[var(--app-active-border)] dark:hover:bg-[var(--app-surface-2)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_42%),linear-gradient(160deg,rgba(15,23,42,0.03),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.03),transparent_55%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            {course.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {course.description ?? "Khóa học chưa có mô tả."}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip size="small" label={`${course.chapters.length} chương`} />
          <Chip size="small" label={`${lessonCount} bài học`} />
        </Stack>
      </div>
      <CourseThumbnail title={course.name} thumbnailUrl={course.thumbnailUrl ?? null} />
    </Paper>
  );
});

type ChapterCardProps = {
  chapter: CourseChapter;
  onSelect: (chapterId: number) => void;
};

export const ChapterCard = React.memo(function ChapterCard({
  chapter,
  onSelect,
}: ChapterCardProps) {
  return (
    <Paper
      elevation={0}
      onClick={() => onSelect(chapter.id)}
      className={`${NESTED_CARD_HEIGHT_CLASS} cursor-pointer rounded-2xl border border-[var(--app-border)] bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(242,246,252,0.86))] p-4 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_28px_-24px_rgba(59,130,246,0.55)] dark:bg-[linear-gradient(165deg,rgba(42,42,42,0.95),rgba(33,33,33,0.93))] dark:hover:border-[var(--app-active-border)] dark:hover:bg-[var(--app-surface-2)]`}
    >
      <Stack spacing={1} className="h-full">
        <Typography variant="subtitle1" fontWeight={700}>
          {chapter.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {chapter.description ?? "Không có mô tả cho chương này."}
        </Typography>
      </Stack>
    </Paper>
  );
});

type SectionCardProps = {
  sectionType: SectionType;
  section: CourseSection | null;
  onSelect: (type: SectionType) => void;
};

export const SectionCard = React.memo(function SectionCard({
  sectionType,
  section,
  onSelect,
}: SectionCardProps) {
  const meta = SECTION_META[sectionType];

  return (
    <Paper
      elevation={0}
      onClick={() => {
        if (section) {
          onSelect(sectionType);
        }
      }}
      className={`${NESTED_CARD_HEIGHT_CLASS} rounded-2xl border p-4 transition ${
        section
          ? "cursor-pointer border-[var(--app-border)] bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(242,246,252,0.86))] duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_28px_-24px_rgba(59,130,246,0.55)] dark:bg-[linear-gradient(165deg,rgba(42,42,42,0.95),rgba(33,33,33,0.93))] dark:hover:border-[var(--app-active-border)] dark:hover:bg-[var(--app-surface-2)]"
          : "cursor-not-allowed border-dashed border-[var(--app-border)] bg-[linear-gradient(165deg,rgba(255,255,255,0.94),rgba(242,246,252,0.78))] opacity-70 dark:bg-[linear-gradient(165deg,rgba(42,42,42,0.95),rgba(33,33,33,0.91))]"
      }`}
    >
      <Stack spacing={1.5} className="h-full">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${meta.colorClass}`}>
            {meta.icon}
          </span>
          <Chip
            size="small"
            label={
              !section
                ? "Trống"
                : section.status === "UNDER_DEVELOPMENT"
                  ? "Đang phát triển"
                  : `${section.lessons.length} bài`
            }
            color={section && section.status !== "UNDER_DEVELOPMENT" ? "primary" : "default"}
            variant={section ? "filled" : "outlined"}
          />
        </Stack>
        <Typography variant="subtitle1" fontWeight={700}>
          {meta.title}
        </Typography>
      </Stack>
    </Paper>
  );
});

type LessonCardProps = {
  lesson: CourseLesson;
  onSelect: (lessonId: number) => void;
};

export const LessonCard = React.memo(function LessonCard({ lesson, onSelect }: LessonCardProps) {
  const hasVideo = Boolean(lesson.videoUrl);
  const hasPdf = Boolean(lesson.pdfUrl);

  return (
    <Paper
      elevation={0}
      onClick={() => onSelect(lesson.id)}
      className={`${NESTED_CARD_HEIGHT_CLASS} cursor-pointer rounded-2xl border border-[var(--app-border)] bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(242,246,252,0.86))] p-4 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_30px_-24px_rgba(59,130,246,0.65)] dark:bg-[linear-gradient(165deg,rgba(42,42,42,0.95),rgba(33,33,33,0.93))] dark:hover:border-[var(--app-active-border)] dark:hover:bg-[var(--app-surface-2)]`}
    >
      <Stack spacing={1.5} className="h-full">
        <div className="flex items-start justify-between gap-3">
          <Typography variant="subtitle1" fontWeight={700} className="line-clamp-2 leading-6">
            {lesson.title}
          </Typography>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-600 shadow-sm dark:border-[var(--app-active-border)] dark:bg-[var(--app-surface-2)] dark:text-[var(--app-fg)]">
            <PlayCircleRoundedIcon fontSize="medium" />
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {hasVideo ? <Chip size="small" label="Video" /> : null}
            {hasPdf ? <Chip size="small" label="PDF" /> : null}
            {!hasVideo && !hasPdf ? (
              <Chip size="small" label="Đang cập nhật" variant="outlined" />
            ) : null}
          </div>
          <Typography
            variant="caption"
            color="text.secondary"
            className="whitespace-nowrap font-semibold"
          >
            Nhấn để học
          </Typography>
        </div>
      </Stack>
    </Paper>
  );
});

type LessonListItemProps = {
  lesson: CourseLesson;
  active: boolean;
  onSelect: (lessonId: number) => void;
};

export const LessonListItem = React.memo(function LessonListItem({
  lesson,
  active,
  onSelect,
}: LessonListItemProps) {
  const hasVideo = Boolean(lesson.videoUrl);
  const hasPdf = Boolean(lesson.pdfUrl);
  const chipClassName =
    "!h-6 !rounded-full !border !border-[var(--app-border)] !bg-[var(--app-surface-2)] !px-2 !text-[11px] !font-semibold !text-[var(--app-fg-muted)] dark:!border-[rgba(255,255,255,0.1)] dark:!bg-[rgba(255,255,255,0.06)] dark:!text-slate-300";

  return (
    <button
      type="button"
      onClick={() => onSelect(lesson.id)}
      className={`group min-h-[96px] min-w-[220px] rounded-2xl border px-4 py-3 text-left transition duration-200 lg:min-w-0 ${
        active
          ? "border-blue-300 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] shadow-[0_12px_24px_-24px_rgba(37,99,235,0.95)] dark:border-[rgba(255,255,255,0.2)] dark:bg-[#34373d] dark:bg-none dark:shadow-[0_16px_28px_-22px_rgba(0,0,0,0.72)]"
          : "border-[var(--app-border)] bg-[var(--app-card)] hover:-translate-y-px hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#27272a] dark:hover:border-[rgba(255,255,255,0.16)] dark:hover:bg-[#303338] dark:hover:shadow-[0_14px_24px_-22px_rgba(0,0,0,0.72)]"
      }`}
    >
      <div className="flex h-full flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <Typography variant="body2" fontWeight={700} className="leading-5">
            {lesson.title}
          </Typography>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm ${
              active
                ? "border-blue-100 bg-white text-blue-600 dark:border-[rgba(255,255,255,0.2)] dark:bg-[rgba(255,255,255,0.14)] dark:text-slate-100"
                : "border-blue-100 bg-white text-blue-600 dark:border-[rgba(255,255,255,0.1)] dark:bg-[rgba(255,255,255,0.06)] dark:text-slate-300 dark:group-hover:bg-[rgba(255,255,255,0.1)]"
            }`}
          >
            <PlayCircleRoundedIcon fontSize="medium" />
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {hasVideo ? <Chip size="small" label="Video" className={chipClassName} /> : null}
            {hasPdf ? <Chip size="small" label="PDF" className={chipClassName} /> : null}
            {!hasVideo && !hasPdf ? (
              <Chip
                size="small"
                label="Đang cập nhật"
                variant="outlined"
                className={chipClassName}
              />
            ) : null}
          </div>
          {active ? (
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white dark:bg-[rgba(255,255,255,0.14)] dark:text-slate-100">
              Đang xem
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
});
