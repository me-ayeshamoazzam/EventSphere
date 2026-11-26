import { create } from 'zustand';
import { apiClient, errorMessage } from '../attendee/services/apiClient';

const USER_KEY = 'eventsphere:user';
const TOKEN_KEY = 'token';
const SAVED_SESSIONS_KEY = 'eventsphere:attendee:saved-sessions';

const readUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Supports both { token, user: {...} } and flat { _id, name, email, role, token } responses
const parseAuthPayload = (data) => {
  const token = data?.token || '';
  if (data?.user && typeof data.user === 'object') {
    return { token, user: data.user };
  }
  const { token: _t, message: _m, ...rest } = data || {};
  return { token, user: Object.keys(rest).length ? rest : null };
};

export const useAuthStore = create((set) => ({
  user: readUser(),
  token: localStorage.getItem(TOKEN_KEY) || null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, user } = parseAuthPayload(res.data);

      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

      set({ user, token, loading: false, error: null });
      return { ok: true, user };
    } catch (err) {
      const msg = errorMessage(err);
      set({ loading: false, error: msg });
      return { ok: false, error: msg };
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post('/auth/register', payload);
      const { token, user } = parseAuthPayload(res.data);

      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

      set({ user, token: token || null, loading: false, error: null });
      return { ok: true, user, token };
    } catch (err) {
      const msg = errorMessage(err);
      set({ loading: false, error: msg });
      return { ok: false, error: msg };
    }
  },

  setUser: (user) => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },
logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SAVED_SESSIONS_KEY);
    set({ user: null, token: null, error: null });
  },
}));

export default useAuthStore;