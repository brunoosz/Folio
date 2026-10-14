import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { LogoMark, Wordmark } from '../brand/logo';
import { brand } from '../brand/brand.config';
import { useAuthStore } from '../hooks/useAuthStore';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { login, erro } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, senha);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: brand.colors.canvas }}>
      <div className="flex flex-col items-center mb-8">
        <LogoMark size={72} />
        <Wordmark className="mt-3" />
        <p className="text-[14px] text-ink-body mt-1">{brand.slogan}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-[320px] flex flex-col gap-3">
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Usuário"
          className="w-full h-[48px] px-4 text-[15px] bg-surface rounded-[var(--radius-btn)] card-border"
          autoFocus
        />
        <input
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          placeholder="Senha"
          className="w-full h-[48px] px-4 text-[15px] bg-surface rounded-[var(--radius-btn)] card-border"
        />
        {erro && <p className="text-[13px] text-muscle text-center">{erro}</p>}
        <Button variant="primary" type="submit" className="w-full mt-1">Entrar</Button>
        <p className="text-[12px] text-ink-muted text-center mt-2">
          Acesso de desenvolvimento: admin / admin
        </p>
      </form>
    </div>
  );
}
