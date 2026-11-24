"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import FontDownloadRoundedIcon from "@mui/icons-material/FontDownloadRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import ImportContactsRoundedIcon from "@mui/icons-material/ImportContactsRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import * as React from "react";

import EmptyState from "@/features/web/components/empty-state";
import type { SectionType } from "@/features/web/courses/course-tree";

export const SECTION_ORDER: SectionType[] = [
  "VOCABULARY",
  "GRAMMAR",
  "KANJI",
  "READING",
  "LISTENING",
];

export const SECTION_META: Record<
  SectionType,
  { title: string; description: string; icon: React.ReactNode; colorClass: string }
> = {
  VOCABULARY: {
    title: "Từ vựng",
    description: "Mở rộng vốn từ qua video và tài liệu học tập",
    icon: <LibraryBooksRoundedIcon fontSize="small" />,
    colorClass: "bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-slate-200",
  },
  GRAMMAR: {
    title: "Ngữ pháp",
    description: "Hiểu cấu trúc câu và cách diễn đạt theo ngữ cảnh",
    icon: <EditNoteRoundedIcon fontSize="small" />,
    colorClass: "bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-slate-200",
  },
  KANJI: {
    title: "Hán Tự",
    description: "Ghi nhớ Kanji theo bài học có hệ thống",
    icon: <FontDownloadRoundedIcon fontSize="small" />,
    colorClass: "bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-slate-200",
  },
  READING: {
    title: "Đọc",
    description: "Luyện đọc hiểu theo ngữ cảnh thực tế",
    icon: <ImportContactsRoundedIcon fontSize="small" />,
    colorClass: "bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-slate-200",
  },
  LISTENING: {
    title: "Nghe",
    description: "Luyện nghe với hội thoại và bài tập thực hành",
    icon: <GraphicEqRoundedIcon fontSize="small" />,
    colorClass: "bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-slate-200",
  },
};

type CourseStateProps = {
  isLoading: boolean;
  isError: boolean;
  unauthorized: boolean;
  hasData: boolean;
  onReauth: () => void;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
};

export function CourseStateBlock({
  isLoading,
  isError,
  unauthorized,
  hasData,
  onReauth,
  emptyTitle,
  emptyDescription,
  children,
}: CourseStateProps) {
  if (isLoading) {
    return (
      <Paper elevation={0} className="rounded-2xl border border-[var(--app-border)] p-4">
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            Đang tải khóa học...
          </Typography>
          <LinearProgress />
        </Stack>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert
        severity={unauthorized ? "warning" : "error"}
        action={
          unauthorized ? (
            <Button color="inherit" size="small" onClick={onReauth}>
              Đăng nhập lại
            </Button>
          ) : undefined
        }
      >
        {unauthorized
          ? "Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn."
          : "Không thể tải dữ liệu khóa học từ máy chủ. Vui lòng thử lại sau."}
      </Alert>
    );
  }

  if (!hasData) {
    return (
      <EmptyState
        icon={<AutoStoriesRoundedIcon />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return <Stack spacing={2}>{children}</Stack>;
}

type HeaderWithBackProps = {
  title: string;
  onBack: () => void;
  backText: string;
};

export function HeaderWithBack({ title, onBack, backText }: HeaderWithBackProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Button
        size="large"
        startIcon={<ArrowBackRoundedIcon fontSize="medium" />}
        onClick={onBack}
        className="text-base font-semibold normal-case"
      >
        {backText}
      </Button>
      <Divider flexItem orientation="vertical" />
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
    </Stack>
  );
}
