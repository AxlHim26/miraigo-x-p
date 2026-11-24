"use client";

import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useRouter } from "@/features/web/components/web-router";
import * as React from "react";
import { useShallow } from "zustand/react/shallow";

import { grammarPoints } from "@/features/grammar/data/catalog";
import { useHotkeys } from "@/features/web/layout/use-hotkeys";
import { useLayoutStore } from "@/features/web/layout/layout-store";

export default function CommandPalette() {
  const router = useRouter();
  const { commandOpen, setCommandOpen } = useLayoutStore(
    useShallow((state) => ({
      commandOpen: state.commandOpen,
      setCommandOpen: state.setCommandOpen,
    })),
  );
  const [query, setQuery] = React.useState("");

  useHotkeys("mod+k", (event) => {
    event.preventDefault();
    setCommandOpen(true);
  });

  const close = () => {
    setCommandOpen(false);
    setQuery("");
  };

  const results = React.useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return grammarPoints.slice(0, 6);
    }
    return grammarPoints.filter((point) =>
      [point.title, point.meaning, point.structure].some((text) =>
        text.toLowerCase().includes(keyword),
      ),
    );
  }, [query]);

  const handleSelect = (levelId: string) => {
    close();
    router.push(`/grammar/${levelId}`);
  };

  return (
    <Dialog
      open={commandOpen}
      onClose={close}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        className: "rounded-3xl bg-white/95 p-2 shadow-2xl backdrop-blur dark:bg-[#161D2A]/95",
      }}
    >
      <Box className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-[#2F3A4B] dark:bg-[#1A2231]">
        <SearchIcon fontSize="small" className="text-slate-400" />
        <InputBase
          autoFocus
          placeholder="Tìm ngữ pháp, cấu trúc..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 text-sm"
        />
        <IconButton size="small" onClick={close}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box className="px-2 pb-2">
        <Typography variant="caption" color="text.secondary" className="px-2 py-2">
          Kết quả gợi ý
        </Typography>
        <List dense className="max-h-[320px] overflow-y-auto">
          {results.length === 0 ? (
            <Typography variant="body2" color="text.secondary" className="px-4 py-6">
              Không có kết quả phù hợp.
            </Typography>
          ) : (
            results.map((result) => (
              <ListItemButton
                key={result.id}
                onClick={() => handleSelect(result.levelId)}
                className="rounded-xl"
              >
                <ListItemText
                  primary={result.title}
                  secondary={`${result.meaning} • Bài ${result.lesson}`}
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Box>
    </Dialog>
  );
}
