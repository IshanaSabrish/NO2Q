import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // role, status, _id
      token: null,
      login: (userData, token) => set({ user: userData, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'no2q-auth' }
  )
);

export const useQueueStore = create((set) => ({
  myToken: null,
  setMyToken: (token) => set({ myToken: token }),
  clearToken: () => set({ myToken: null }),
}));
