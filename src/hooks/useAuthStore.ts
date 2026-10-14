import { create } from 'zustand';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'usuario';
}

interface AuthState {
  usuario: Usuario | null;
  logado: boolean;
  erro: string | null;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  limparErro: () => void;
}

const MOCK_USERS: { email: string; senha: string; user: Usuario }[] = [
  {
    email: 'admin',
    senha: 'admin',
    user: { id: 'user_admin', nome: 'Admin Folio', email: 'admin@folio.app', role: 'admin' },
  },
];

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  logado: false,
  erro: null,

  login(email, senha) {
    const id = email.trim().toLowerCase();
    if (!id || !senha) {
      set({ erro: 'Informe usuário e senha.' });
      return false;
    }
    const found = MOCK_USERS.find(u => (u.email === id || u.user.email === id) && u.senha === senha);
    if (found) {
      try { localStorage.setItem('folio_auth', JSON.stringify(found.user)); } catch { /* sem persistência */ }
      set({ usuario: found.user, logado: true, erro: null });
      return true;
    }
    set({ erro: 'Usuário ou senha incorretos.' });
    return false;
  },

  limparErro() {
    set({ erro: null });
  },

  logout() {
    try { localStorage.removeItem('folio_auth'); } catch { /* ignore */ }
    set({ usuario: null, logado: false, erro: null });
  },
}));

export function initAuth() {
  try {
    const raw = localStorage.getItem('folio_auth');
    if (raw) {
      const user = JSON.parse(raw) as Usuario;
      if (user && typeof user.id === 'string' && (user.role === 'admin' || user.role === 'usuario')) {
        useAuthStore.setState({ usuario: user, logado: true });
      } else {
        localStorage.removeItem('folio_auth');
      }
    }
  } catch { /* ignore */ }
}
