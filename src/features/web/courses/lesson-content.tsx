"use client";

import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import * as React from "react";

import type { CourseLesson } from "@/features/web/courses/course-tree";

const getVideoEmbedUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace("www.", "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = url.searchParams.get("v");
      if (watchId) {
        return `https://www.youtube.com/embed/${watchId}`;
      }

      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.replace("/embed/", "");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const getGoogleDriveFilePreviewUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace("www.", "");
    if (host !== "drive.google.com" && host !== "docs.google.com") {
      return null;
    }

    const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    const fileId = filePathMatch?.[1] ?? url.searchParams.get("id");
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  } catch {
    return null;
  }

  return null;
};

const getGoogleDriveFolderEmbedUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace("www.", "");
    if (host !== "drive.google.com" && host !== "docs.google.com") {
      return null;
    }

    const folderPathMatch = url.pathname.match(/\/drive\/folders\/([^/]+)/);
    const folderId = folderPathMatch?.[1];
    if (folderId) {
      return `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    }
  } catch {
    return null;
  }

  return null;
};

const getPdfEmbedUrl = (rawUrl: string) => {
  const value = rawUrl.trim();
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace("www.", "");

    if (host === "drive.google.com" || host === "docs.google.com") {
      const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const fileId = filePathMatch?.[1] ?? url.searchParams.get("id");
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview?rm=minimal`;
      }
    }

    if (url.pathname.toLowerCase().endsWith(".pdf")) {
      return value.includes("#")
        ? `${value}&toolbar=0&navpanes=0&scrollbar=0&zoom=page-width`
        : `${value}#toolbar=0&navpanes=0&scrollbar=0&zoom=page-width`;
    }

    return `https://docs.google.com/gview?embedded=1&hl=vi&url=${encodeURIComponent(value)}`;
  } catch {
    return `https://docs.google.com/gview?embedded=1&hl=vi&url=${encodeURIComponent(value)}`;
  }
};

const getVideoPlaybackUrl = (rawValue: string) => {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  if (/^\d+$/.test(value) || /^\/api\/v1\/videos\/\d+\/stream$/.test(value)) {
    return null;
  }

  return value;
};

type LessonVideoProps = {
  lesson: CourseLesson;
};

export const LessonVideo = React.memo(function LessonVideo({ lesson }: LessonVideoProps) {
  const playbackUrl = React.useMemo(
    () => (lesson.videoUrl ? getVideoPlaybackUrl(lesson.videoUrl) : null),
    [lesson.videoUrl],
  );
  const embedUrl = React.useMemo(
    () => (playbackUrl ? getVideoEmbedUrl(playbackUrl) : null),
    [playbackUrl],
  );
  const driveFilePreviewUrl = React.useMemo(
    () => (playbackUrl ? getGoogleDriveFilePreviewUrl(playbackUrl) : null),
    [playbackUrl],
  );
  const driveFolderEmbedUrl = React.useMemo(
    () => (playbackUrl ? getGoogleDriveFolderEmbedUrl(playbackUrl) : null),
    [playbackUrl],
  );
  const iframeSrc = embedUrl ?? driveFilePreviewUrl ?? driveFolderEmbedUrl;
  const videoSrc = iframeSrc ? null : playbackUrl;

  return (
    <Paper
      elevation={0}
      className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-4"
    >
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          {lesson.title}
        </Typography>
        <div>
          {iframeSrc ? (
            <iframe
              title={`video-${lesson.id}`}
              src={iframeSrc}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
              allowFullScreen
            />
          ) : videoSrc ? (
            <video
              controls
              src={videoSrc}
              className="aspect-video w-full bg-black"
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noplaybackrate noremoteplayback nopictureinpicture"
              playsInline
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-slate-100 text-slate-500 dark:bg-[#1A2231]">
              Video chưa được cập nhật
            </div>
          )}
        </div>
      </Stack>
    </Paper>
  );
});

type LessonPdfProps = {
  lesson: CourseLesson;
};

export const LessonPdf = React.memo(function LessonPdf({ lesson }: LessonPdfProps) {
  const embedUrl = React.useMemo(
    () => (lesson.pdfUrl ? getPdfEmbedUrl(lesson.pdfUrl) : null),
    [lesson.pdfUrl],
  );

  return (
    <Paper
      elevation={0}
      className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-4"
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PictureAsPdfRoundedIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>
            Tài liệu PDF
          </Typography>
        </Stack>
        <div className="overflow-hidden rounded-2xl border border-[var(--app-border)]">
          {embedUrl ? (
            <iframe
              key={`pdf-viewer-${lesson.id}-${embedUrl}`}
              title={`pdf-${lesson.id}`}
              src={embedUrl}
              className="block h-[420px] w-full bg-white sm:h-[520px] lg:h-[660px]"
              style={{ width: "100%", border: 0 }}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <div className="flex h-[220px] items-center justify-center bg-slate-100 text-slate-500 dark:bg-[#1A2231]">
              Chưa có tài liệu PDF cho bài học này
            </div>
          )}
        </div>
      </Stack>
    </Paper>
  );
});
