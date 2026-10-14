import { useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { toast } from '../components/ui/Toast';
import { LogoMark, Wordmark } from '../brand/logo';
import { brand } from '../brand/brand.config';
import { useAuthStore } from '../hooks/useAuthStore';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const inputCls =
  'w-full h-[48px] px-4 text-[15px] text-ink bg-surface rounded-[var(--radius-btn)] border transition-colors duration-200 placeholder:text-ink-muted';

export function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const { login, erro, limparErro } = useAuthStore();
  const formRef = useRef<HTMLFormElement>(null);
  const userRef = useRef<HTMLInputElement>(null);

  const shake = () => {
    if (prefersReducedMotion()) return;
    formRef.current?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(7px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 360, easing: 'ease-out' },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    // Pequena pausa para o feedback de carregamento ser perceptível.
    window.setTimeout(() => {
      const ok = login(usuario, senha);
      setEnviando(false);
      if (ok) {
        toast.clear();
      } else {
        shake();
        toast.error('Não foi possível entrar. Confira os dados.');
        userRef.current?.focus();
      }
    }, 280);
  };

  const onChange = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    fn(e.target.value);
    if (erro) limparErro();
  };

  const borda = erro ? 'border-vermillion/60' : 'border-black/[0.08] focus:border-brand';

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 py-10"
      style={{ background: brand.colors.canvas }}
    >
      <div className="login-enter w-full max-w-[340px] flex flex-col items-center">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="illo-spring">
            <LogoMark size={72} />
          </div>
          <Wordmark className="mt-3" />
          <p className="text-[14px] text-ink-body mt-1">{brand.slogan}</p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          aria-label="Entrar no Folio"
          className="w-full flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-usuario" className="text-[14px] font-medium text-ink">
              Usuário
            </label>
            <input
              id="login-usuario"
              ref={userRef}
              type="text"
              name="username"
              value={usuario}
              onChange={onChange(setUsuario)}
              placeholder="Seu usuário"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              aria-invalid={!!erro || undefined}
              aria-describedby={erro ? 'login-erro' : undefined}
              className={`${inputCls} ${borda}`}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-senha" className="text-[14px] font-medium text-ink">
              Senha
            </label>
            <div className="relative">
              <input
                id="login-senha"
                type={mostrarSenha ? 'text' : 'password'}
                name="password"
                value={senha}
                onChange={onChange(setSenha)}
                placeholder="Sua senha"
                autoComplete="current-password"
                enterKeyHint="go"
                aria-invalid={!!erro || undefined}
                aria-describedby={erro ? 'login-erro' : undefined}
                className={`${inputCls} ${borda} pr-12`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
                aria-controls="login-senha"
                className="pressable focus-ring absolute right-0.5 top-0.5 w-[44px] h-[44px] rounded-[var(--radius-btn)] flex items-center justify-center text-ink-body hover:text-ink"
              >
                <Icon name={mostrarSenha ? 'eye-off' : 'eye'} size={20} />
              </button>
            </div>
          </div>

          <div aria-live="polite" className="min-h-[20px] -mt-1">
            {erro && (
              <p id="login-erro" className="anim-fade flex items-center gap-1.5 text-[14px] text-ink">
                <Icon name="warning" size={16} color="var(--color-vermillion)" />
                {erro}
              </p>
            )}
          </div>

          <Button variant="primary" type="submit" fullWidth loading={enviando} iconRight={enviando ? undefined : 'chevron-right'}>
            Entrar
          </Button>
        </form>

        <p className="text-[13px] text-ink-body text-center mt-6 flex items-center justify-center gap-1.5">
          <Icon name="key" size={16} />
          Acesso de desenvolvimento: <span className="font-medium text-ink">admin / admin</span>
        </p>
      </div>
    </div>
  );
}
