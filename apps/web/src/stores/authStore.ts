import type { CurrentUserResponse } from "@/api/models";
import { create } from "zustand";

interface AuthState {
  user: CurrentUserResponse | null;
  isAuthenticated: boolean;
  login: (user: CurrentUserResponse) => void;
  patchUser: (user: Partial<CurrentUserResponse>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  patchUser: (partial) =>
    set((state) => {
      if (!state.user) {
        return state;
      }
      return { user: { ...state.user, ...partial } };
    }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
