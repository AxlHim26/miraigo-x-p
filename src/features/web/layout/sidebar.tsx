"use client";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonIcon from "@mui/icons-material/Person";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { usePathname, useRouter } from "@/features/web/components/web-router";
import * as React from "react";
import { useShallow } from "zustand/react/shallow";

import {
  coursesSidebarSections,
  grammarSidebarSections,
  kanjiSidebarSections,
  practiceSidebarSections,
  topTabs,
  vocabularySidebarSections,
} from "@/features/web/layout/nav-config";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useResumeLesson } from "@/features/courses/hooks/use-resume-lesson";
import { getResumePath } from "@/features/web/courses/course-tree-selectors";
import SidebarSection from "@/features/web/layout/sidebar-section";
import TopTabs from "@/features/web/layout/top-tabs";
import ThemeToggle from "@/features/web/theme/theme-toggle";
import BrandLogo from "@/features/web/components/brand-logo";
import { useLayoutStore } from "@/features/web/layout/layout-store";

const sectionMap = {
  grammar: grammarSidebarSections,
  vocabulary: vocabularySidebarSections,
  practice: practiceSidebarSections,
  courses: coursesSidebarSections,
  kanji: kanjiSidebarSections,
};

const normalizePath = (value?: string) => {
  if (!value || value === "/") {
    return "/";
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const isPathMatch = (pathname: string, href: string) => {
  const normalizedPath = normalizePath(pathname);
  const normalizedHref = normalizePath(href);

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
};

const isItemMatch = (pathname: string, item: { id: string; href?: string }) => {
  if (!item.href) {
    return false;
  }

  if (item.id === "home") {
    return normalizePath(pathname) === normalizePath(item.href);
  }

  return isPathMatch(pathname, item.href);
};

const resolveActiveHref = (pathname: string, sections: typeof grammarSidebarSections) => {
  const matches = sections
    .flatMap((section) => section.items)
    .filter((item) => isItemMatch(pathname, item))
    .map((item) => item.href)
    .filter((href): href is string => Boolean(href))
    .sort((first, second) => normalizePath(second).length - normalizePath(first).length);

  return matches[0];
};

type SidebarProps = {
  current: "grammar" | "vocabulary" | "practice" | "courses" | "kanji";
};

export default function Sidebar({ current }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setCommandOpen, setSidebarOpen } = useLayoutStore(
    useShallow((state) => ({
      setCommandOpen: state.setCommandOpen,
      setSidebarOpen: state.setSidebarOpen,
    })),
  );

  const sections = React.useMemo(() => sectionMap[current], [current]);
  const recentLesson = useResumeLesson();
  const { handleLogout, logoutPending } = useLogout();

  const handleItemClick = React.useCallback(
    (id: string) => {
      if (id === "search") {
        setCommandOpen(true);
      }
      setSidebarOpen(false);
      if (id === "continue-learning") {
        const nextPath = getResumePath(recentLesson);
        router.push(nextPath || "/courses");
        setSidebarOpen(false);
      }
    },
    [recentLesson, router, setCommandOpen, setSidebarOpen],
  );

  const activeHref = React.useMemo(
    () => resolveActiveHref(pathname, sections),
    [pathname, sections],
  );
  const { data: user } = useCurrentUser();
  const email = user?.email ?? user?.username ?? "";

  return (
    <Box className="flex h-full flex-col gap-6 px-4 py-6">
      <BrandLogo />

      <TopTabs tabs={topTabs} />

      <div className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
        {sections.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            onItemClick={handleItemClick}
            {...(activeHref ? { activeId: activeHref } : {})}
          />
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Typography variant="caption" color="text.secondary">
            Giao diện
          </Typography>
          <ThemeToggle />
        </div>
        <Divider />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <PersonIcon fontSize="small" />
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#E5E7EB]">{email}</div>
          </div>
          <IconButton
            size="small"
            onClick={handleLogout}
            aria-label="Đăng xuất"
            disabled={logoutPending}
          >
            <LogoutRoundedIcon fontSize="inherit" />
          </IconButton>
        </div>
      </div>
    </Box>
  );
}
