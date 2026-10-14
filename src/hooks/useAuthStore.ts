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
    const found = MOCK_USERS.find(u => u.email === email && u.senha === senha);
    if (found) {
      localStorage.setItem('folio_auth', JSON.stringify(found.user));
      set({ usuario: found.user, logado: true, erro: null });
      return true;
    }
    set({ erro: 'Credenciais inválidas' });
    return false;
  },

  logout() {
    localStorage.removeItem('folio_auth');
    set({ usuario: null, logado: false, erro: null });
  },
}));

export function initAuth() {
  try {
    const raw = localStorage.getItem('folio_auth');
    if (raw) {
      const user = JSON.parse(raw) as Usuario;
      useAuthStore.setState({ usuario: user, logado: true });
    }
  } catch { /* ignore */ }
}
