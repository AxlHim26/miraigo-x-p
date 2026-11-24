import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GridViewIcon from "@mui/icons-material/GridView";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import MapIcon from "@mui/icons-material/Map";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import SearchIcon from "@mui/icons-material/Search";

import { grammarLevels } from "@/features/grammar/data/catalog";
import type { NavSection, TopTab } from "@/features/web/layout/navigation";

export const topTabs: TopTab[] = [
  {
    id: "vocabulary",
    label: "Từ Vựng",
    href: "/vocabulary",
    icon: <LibraryBooksIcon fontSize="small" />,
  },
  {
    id: "grammar",
    label: "Ngữ Pháp",
    href: "/grammar",
    icon: <MenuBookIcon fontSize="small" />,
  },
  {
    id: "kanji-map",
    label: "Hán Tự",
    href: "/kanji-map",
    icon: <MapIcon fontSize="small" />,
  },
  {
    id: "courses",
    label: "Khoá Học",
    href: "/courses",
    icon: <SchoolIcon fontSize="small" />,
  },
  {
    id: "practice",
    label: "Luyện Tập",
    href: "/practice",
    icon: <AutoAwesomeIcon fontSize="small" />,
  },
];

export const grammarSidebarSections: NavSection[] = [
  {
    id: "overview",
    items: [
      {
        id: "home",
        label: "Trang chủ",
        href: "/grammar",
        icon: <GridViewIcon fontSize="small" />,
      },
      {
        id: "search",
        label: "Tìm kiếm",
        icon: <SearchIcon fontSize="small" />,
        badge: "(Ctrl + K)",
        variant: "plain",
      },
    ],
  },
  {
    id: "courses",
    title: "Giáo trình",
    items: grammarLevels.map((level) => ({
      id: level.id,
      label: level.title,
      href: `/grammar/${level.id}`,
      variant: "plain",
    })),
  },
];

export const vocabularySidebarSections: NavSection[] = [
  {
    id: "overview",
    items: [
      { id: "home", label: "Tổng quan", href: "/vocabulary", icon: <GridViewIcon fontSize="small" /> },
      { id: "review", label: "Ôn tập", href: "/vocabulary/review", icon: <HistoryRoundedIcon fontSize="small" /> },
    ],
  },
];

export const practiceSidebarSections: NavSection[] = [
  {
    id: "practice",
    title: "Luyện tập",
    items: [
      { id: "home", label: "Luyện tập", href: "/practice", icon: <SchoolIcon fontSize="small" /> },
      { id: "jlpt", label: "Lịch sử thi JLPT", href: "/practice/jlpt/history", icon: <HistoryRoundedIcon fontSize="small" /> },
    ],
  },
];

export const coursesSidebarSections: NavSection[] = [
  {
    id: "overview",
    items: [
      {
        id: "home",
        label: "Trang chủ",
        href: "/courses",
        icon: <GridViewIcon fontSize="small" />,
      },
      {
        id: "search",
        label: "Tìm kiếm",
        icon: <SearchIcon fontSize="small" />,
        badge: "Ctrl + K",
      },
      {
        id: "continue-learning",
        label: "Tiếp tục xem",
        icon: <HistoryRoundedIcon fontSize="small" />,
        variant: "plain",
      },
    ],
  },
];

export const kanjiSidebarSections: NavSection[] = [
  {
    id: "overview",
    items: [
      {
        id: "home",
        label: "Lộ trình",
        href: "/kanji-map",
        icon: <GridViewIcon fontSize="small" />,
      },
      {
        id: "kanji-lookup",
        label: "Tra cứu",
        href: "/kanji/lookup",
        icon: <SearchIcon fontSize="small" />,
      },
    ],
  },
  {
    id: "kanji-library",
    title: "Kho hán tự",
    items: [
      {
        id: "kanji-n5",
        label: "Hán tự N5",
        href: "/kanji/n5",
        variant: "plain",
      },
      {
        id: "kanji-n4",
        label: "Hán tự N4",
        href: "/kanji/n4",
        variant: "plain",
      },
      {
        id: "kanji-n3",
        label: "Hán tự N3",
        href: "/kanji/n3",
        variant: "plain",
      },
      {
        id: "kanji-n2",
        label: "Hán tự N2",
        href: "/kanji/n2",
        variant: "plain",
      },
      {
        id: "kanji-n1",
        label: "Hán tự N1",
        href: "/kanji/n1",
        variant: "plain",
      },
    ],
  },
];
