import { useEffect, useId, useState, type ReactNode } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon, type IconProps } from '../components/ui/Icon';
import { Pill } from '../components/ui/Pill';
import { Sheet } from '../components/ui/Sheet';
import { toast } from '../components/ui/Toast';
import { LogoMark } from '../brand/logo';
import { brand } from '../brand/brand.config';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  GROQ_MODELS,
  clearAllLocalData,
  getAiStatus,
  useSettingsStore,
  type AiStatus,
} from '../hooks/useSettingsStore';
import { testKey } from '../lib/groq';

const APP_VERSION: string = (import.meta.env.VITE_APP_VERSION as string | undefined) || '1.0.0';

const statusMeta: Record<AiStatus, { label: string; bg: string; fg: string; icon: IconProps['name'] }> = {
  ativa: { label: 'Ativa', bg: '#e7f5ec', fg: '#1a7f37', icon: 'check' },
  nao_configurada: { label: 'Não configurada', bg: '#efeeec', fg: '#615d59', icon: 'info' },
  erro: { label: 'Erro', bg: '#fdecea', fg: '#b8230f', icon: 'warning' },
};

function Section({ icon, title, index, children }: { icon: IconProps['name']; title: string; index: number; children: ReactNode }) {
  return (
    <Card animate index={index}>
      <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink mb-4">
        <span className="w-8 h-8 rounded-full bg-brand-ghost text-brand flex items-center justify-center" aria-hidden>
          <Icon name={icon} size={18} />
        </span>
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 min-h-[44px]">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[15px] text-ink font-medium cursor-pointer">{label}</label>
        {description && <p className="text-[13px] text-ink-body mt-0.5 leading-snug">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="focus-ring pressable relative shrink-0 w-[52px] h-[44px] flex items-center cursor-pointer"
      >
        <span
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[30px] rounded-[var(--radius-pill)] transition-std"
          style={{ background: checked ? 'var(--color-brand)' : '#d9d7d4' }}
        />
        <span
          className="absolute top-1/2 left-[3px] w-[24px] h-[24px] -mt-[12px] rounded-full bg-white transition-std"
          style={{ transform: `translateX(${checked ? 22 : 0}px)` }}
        />
      </button>
    </div>
  );
}

function AiSection() {
  const groqApiKey = useSettingsStore(s => s.groqApiKey);
  const groqModel = useSettingsStore(s => s.groqModel);
  const aiLastError = useSettingsStore(s => s.aiLastError);
  const setGroq = useSettingsStore(s => s.setGroq);
  const setAiError = useSettingsStore(s => s.setAiError);

  const [key, setKey] = useState(groqApiKey);
  const [model, setModel] = useState(groqModel);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const keyId = useId();
  const modelId = useId();

  useEffect(() => { setKey(groqApiKey); setModel(groqModel); }, [groqApiKey, groqModel]);

  const status = getAiStatus({ groqApiKey, aiLastError });
  const meta = statusMeta[status];
  const dirty = key.trim() !== groqApiKey || model !== groqModel;
  const formatoSuspeito = key.trim().length > 0 && !key.trim().startsWith('gsk_');

  async function testar() {
    const k = key.trim();
    if (!k) { toast.error('Informe a chave da Groq para testar.'); return; }
    setTesting(true);
    const r = await testKey(k, model);
    setTesting(false);
    if (r.ok) {
      toast.success('Conexão funcionando');
      if (!dirty) setAiError(null);
    } else {
      toast.error(r.error.message);
      if (!dirty) setAiError(r.error.message);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const k = key.trim();
    setSaving(true);
    setGroq(k, model);
    if (!k) {
      setSaving(false);
      toast.info('Chave removida. O assistente voltou ao modo demonstração.');
      return;
    }
    const r = await testKey(k, model);
    setSaving(false);
    if (r.ok) {
      toast.success('IA ativada. O assistente já está usando a Groq.');
    } else {
      setAiError(r.error.message);
      toast.error(`Salvo, mas o teste falhou: ${r.error.message}`);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] text-ink-body">Status</span>
        <Pill key={status} color={meta.bg} textColor={meta.fg} icon={meta.icon} className="anim-scale">
          {meta.label}
        </Pill>
      </div>
      {status === 'erro' && aiLastError && (
        <p className="anim-fade text-[13px] text-[#b8230f] -mt-2">{aiLastError}</p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={keyId} className="text-[14px] font-medium text-ink">Chave da API Groq</label>
        <div className="relative">
          <input
            id={keyId}
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="gsk_…"
            autoComplete="off"
            spellCheck={false}
            className="w-full h-[44px] pl-4 pr-12 rounded-[var(--radius-btn)] card-border bg-surface text-[15px] text-ink font-mono outline-none transition-std focus:border-brand/40"
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            aria-label={show ? 'Ocultar chave' : 'Mostrar chave'}
            aria-pressed={show}
            className="focus-ring pressable absolute right-0 top-0 h-[44px] w-[44px] flex items-center justify-center text-ink-body hover:text-ink cursor-pointer rounded-[var(--radius-btn)]"
          >
            <Icon name={show ? 'eye-off' : 'eye'} size={20} />
          </button>
        </div>
        {formatoSuspeito && (
          <p className="text-[13px] text-ink-body">As chaves da Groq costumam começar com “gsk_”.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={modelId} className="text-[14px] font-medium text-ink">Modelo</label>
        <div className="relative">
          <select
            id={modelId}
            value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full h-[44px] pl-4 pr-10 appearance-none rounded-[var(--radius-btn)] card-border bg-surface text-[15px] text-ink outline-none transition-std focus:border-brand/40 cursor-pointer"
          >
            {!GROQ_MODELS.some(m => m.id === model) && <option value={model}>{model}</option>}
            {GROQ_MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.label} — {m.hint}</option>
            ))}
          </select>
          <Icon name="chevron-down" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-body" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" loading={saving} disabled={testing || (!dirty && status !== 'erro')} icon="check">
          Salvar
        </Button>
        <Button variant="ghost" loading={testing} disabled={saving || !key.trim()} icon="activity" onClick={testar}>
          Testar conexão
        </Button>
      </div>

      <div className="flex flex-col gap-2 pt-3 border-t border-black/[0.06]">
        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-1.5 min-h-[44px] self-start text-[14px] font-medium text-brand hover:underline underline-offset-4"
        >
          Obter chave em console.groq.com <Icon name="external-link" size={16} />
        </a>
        <p className="flex gap-2 text-[13px] text-ink-body leading-snug">
          <Icon name="lock" size={16} className="shrink-0 mt-0.5" />
          A chave fica salva somente neste dispositivo e é enviada apenas para a Groq ao usar o assistente.
        </p>
      </div>
    </form>
  );
}

export function Configuracoes() {
  const usuario = useAuthStore(s => s.usuario);
  const isAdmin = usuario?.role === 'admin';
  const reduceMotion = useSettingsStore(s => s.reduceMotion);
  const setReduceMotion = useSettingsStore(s => s.setReduceMotion);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Configurações" subtitle="Preferências do app e do assistente" back />

      <Section icon="sparkle" title="Inteligência artificial" index={0}>
        {isAdmin ? (
          <AiSection />
        ) : (
          <div className="flex gap-3 items-start">
            <Icon name="shield" size={20} className="text-brand shrink-0 mt-0.5" />
            <p className="text-[14px] text-ink-body leading-snug">
              Somente o dono do app pode configurar a IA. Enquanto ela não estiver ativa, o assistente usa respostas pré-definidas.
            </p>
          </div>
        )}
      </Section>

      <Section icon="settings" title="Preferências" index={1}>
        <Toggle
          checked={reduceMotion}
          onChange={v => { setReduceMotion(v); toast.success(v ? 'Animações reduzidas' : 'Animações ativadas'); }}
          label="Reduzir animações"
          description="Desliga transições e efeitos de movimento. A configuração do sistema também é respeitada."
        />
      </Section>

      <Section icon="history" title="Dados" index={2}>
        <p className="text-[14px] text-ink-body leading-snug mb-3">
          Seus treinos, hábitos e preferências ficam salvos neste dispositivo. Apagar remove tudo e encerra a sessão.
        </p>
        <Button variant="danger" icon="trash" onClick={() => setConfirmOpen(true)}>
          Apagar dados locais
        </Button>
      </Section>

      <Section icon="info" title="Sobre" index={3}>
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <p className="text-[16px] font-semibold text-ink">{brand.name}</p>
            <p className="text-[14px] text-ink-body" style={{ fontFamily: 'var(--font-serif)' }}>{brand.slogan}</p>
          </div>
          <span className="ml-auto text-[13px] text-ink-body tabular">v{APP_VERSION}</span>
        </div>
        <p className="text-[13px] text-ink-body leading-snug mt-4">
          O Folio é informativo e não substitui orientação de médico, nutricionista ou Profissional de Educação Física.
          Dados de exercícios estão marcados para revisão profissional.
        </p>
      </Section>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Apagar dados locais?" variant="modal">
        <p className="text-[14px] text-ink-body leading-snug">
          Treinos, histórico, hábitos, conversa do assistente e configurações (incluindo a chave da IA) serão removidos deste dispositivo. Essa ação não pode ser desfeita.
        </p>
        <div className="flex flex-wrap justify-end gap-2 mt-5">
          <Button variant="text" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="danger" icon="trash" onClick={() => { setConfirmOpen(false); clearAllLocalData(); }}>
            Apagar tudo
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
