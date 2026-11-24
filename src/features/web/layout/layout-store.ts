import { create } from 'zustand';

type LayoutState = {
  sidebarOpen: boolean;
  commandOpen: boolean;
  immersiveMode: boolean;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  setCommandOpen: (commandOpen: boolean) => void;
  setImmersiveMode: (immersiveMode: boolean) => void;
};

export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarOpen: false,
  commandOpen: false,
  immersiveMode: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setImmersiveMode: (immersiveMode) => set({ immersiveMode }),
}));
