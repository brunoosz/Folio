import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Toggle } from './ui/Toggle';
import { toast } from './ui/Toast';
import { useLembretesStore } from '../hooks/useLembretesStore';
import { useMedicamentosStore, diasSemanaCurto } from '../hooks/useMedicamentosStore';
import {
  ehNativo, montarLembretes, mostrarNotificacao, pedirPermissao, sincronizarNativo, verificarAgora, verificarPermissao, type Permissao,
} from '../lib/lembretes';

/**
 * Mantém os lembretes funcionando: no Android reagenda no sistema quando algo muda;
 * no PC/navegador verifica a cada 20 s se chegou a hora de algum lembrete.
 */
export function LembretesWatcher() {
  const navigate = useNavigate();
  useEffect(() => {
    if (ehNativo()) {
      let t: number | undefined;
      const agendar = () => { window.clearTimeout(t); t = window.setTimeout(() => { void sincronizarNativo().catch(() => undefined); }, 800); };
      agendar();
      const a = useLembretesStore.subscribe(agendar);
      const b = useMedicamentosStore.subscribe((s, p) => { if (s.medicamentos !== p.medicamentos) agendar(); });
      let remover: (() => void) | undefined;
      import('@capacitor/local-notifications').then(({ LocalNotifications }) =>
        LocalNotifications.addListener('localNotificationActionPerformed', () => navigate('/rotina')).then(h => { remover = () => void h.remove(); }),
      ).catch(() => undefined);
      return () => { window.clearTimeout(t); a(); b(); remover?.(); };
    }
    // Sem permissão do sistema, o lembrete aparece como aviso dentro do app.
    const tick = () => verificarAgora(l => toast.info(`${l.titulo} — ${l.corpo}`, 8000));
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, [navigate]);
  return null;
}

function Hora({ value, onChange, label, largura = '!w-[128px]' }: { value: string; onChange: (v: string) => void; label: string; largura?: string }) {
  return (
    <input type="time" className={`input ${largura} !min-h-[44px] !px-2 tabular font-semibold`} value={value} aria-label={label}
      onChange={e => e.target.value && onChange(e.target.value)} />
  );
}

/** Seção "Lembretes" das Configurações. */
export function LembretesSection() {
  const navigate = useNavigate();
  const cfg = useLembretesStore();
  const meds = useMedicamentosStore(s => s.medicamentos);
  const [permissao, setPermissao] = useState<Permissao | null>(null);
  useEffect(() => { verificarPermissao().then(setPermissao).catch(() => setPermissao('unsupported')); }, []);

  const total = montarLembretes(cfg, meds).length;
  const nMedsHorarios = meds.filter(m => m.ativo).reduce((s, m) => s + m.horarios.length, 0);

  const ligar = async (v: boolean) => {
    if (v && permissao !== 'granted') {
      const p = await pedirPermissao().catch(() => 'unsupported' as const);
      setPermissao(p);
      if (p === 'denied') toast.error('Notificações bloqueadas. Libere nas configurações do aparelho/navegador.');
    }
    cfg.set({ ativo: v });
    if (ehNativo()) void sincronizarNativo(true).catch(() => undefined);
  };

  const testar = async () => {
    try {
      if (permissao !== 'granted') {
        const p = await pedirPermissao();
        setPermissao(p);
        if (p !== 'granted') throw new Error('sem permissão');
      }
      await mostrarNotificacao('Folio', 'Assim chegam os seus lembretes.', 'teste');
      toast.success('Notificação de teste enviada');
    } catch {
      toast.error('Não foi possível notificar. Verifique a permissão de notificações.');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Toggle checked={cfg.ativo} onChange={v => void ligar(v)} label="Ativar lembretes"
        description={ehNativo() ? 'Chegam mesmo com o app fechado.' : 'No PC, chegam enquanto o Folio estiver aberto ou na bandeja.'} />

      {permissao === 'denied' && (
        <p className="text-[13px] rounded-[var(--radius-btn)] p-3 leading-snug" style={{ background: 'var(--color-tint-warn)', color: 'var(--color-warn-ink)' }}>
          As notificações estão bloqueadas para o Folio. Libere nas configurações do {ehNativo() ? 'Android' : 'sistema ou navegador'}; enquanto isso, os lembretes aparecem dentro do app.
        </p>
      )}

      <div className={`flex flex-col gap-3 transition-opacity duration-200 ${cfg.ativo ? '' : 'opacity-50 pointer-events-none'}`} aria-disabled={!cfg.ativo}>
        <div className="border-t border-black/[0.06] pt-3">
          <Toggle checked={cfg.agua.ativo} onChange={v => cfg.setAgua({ ativo: v })} label="Beber água" description="Avisos ao longo do dia. No PC, param quando a meta é batida." />
          {cfg.agua.ativo && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2 text-[14px] text-ink-body">
                Das <Hora largura="!w-full" value={cfg.agua.inicio} onChange={v => cfg.setAgua({ inicio: v })} label="Início dos lembretes de água" />
                às <Hora largura="!w-full" value={cfg.agua.fim} onChange={v => cfg.setAgua({ fim: v })} label="Fim dos lembretes de água" />
              </div>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Intervalo">
                {[60, 90, 120, 180].map(m => (
                  <button key={m} type="button" role="radio" aria-checked={cfg.agua.intervaloMin === m} onClick={() => cfg.setAgua({ intervaloMin: m })}
                    className="pressable focus-ring min-h-[40px] px-3 rounded-[var(--radius-pill)] text-[13px] font-medium border transition-colors duration-200"
                    style={{
                      background: cfg.agua.intervaloMin === m ? 'var(--color-brand-ghost)' : 'var(--color-surface)',
                      borderColor: cfg.agua.intervaloMin === m ? 'var(--color-brand)' : 'rgba(0,0,0,0.08)',
                      color: cfg.agua.intervaloMin === m ? 'var(--color-brand)' : 'var(--color-ink-body)',
                    }}>
                    a cada {m >= 120 ? `${m / 60} h` : m === 90 ? '1h30' : '1 h'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-black/[0.06] pt-3">
          <Toggle checked={cfg.dormir.ativo} onChange={v => cfg.setDormir({ ativo: v })} label="Hora de dormir" description="Aviso 30 minutos antes, para desacelerar." />
          {cfg.dormir.ativo && (
            <div className="flex items-center gap-2 mt-2 text-[14px] text-ink-body">
              Dormir às <Hora value={cfg.dormir.hora} onChange={v => cfg.setDormir({ hora: v })} label="Horário de dormir" />
            </div>
          )}
        </div>

        <div className="border-t border-black/[0.06] pt-3">
          <Toggle checked={cfg.remedios.ativo} onChange={v => cfg.setRemedios({ ativo: v })} label="Remédios"
            description={nMedsHorarios ? `${nMedsHorarios} horário${nMedsHorarios > 1 ? 's' : ''} cadastrados na Rotina.` : 'Cadastre seus remédios na Rotina.'} />
          {!meds.length && (
            <Button variant="text" size="sm" icon="pill" className="!px-0" onClick={() => navigate('/rotina')}>Ir para a Rotina</Button>
          )}
        </div>

        <div className="border-t border-black/[0.06] pt-3">
          <Toggle checked={cfg.treino.ativo} onChange={v => cfg.setTreino({ ativo: v })} label="Treino" description="Lembrete nos dias escolhidos." />
          {cfg.treino.ativo && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 text-[14px] text-ink-body">
                Às <Hora value={cfg.treino.hora} onChange={v => cfg.setTreino({ hora: v })} label="Horário do treino" />
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasSemanaCurto.map((d, i) => {
                  const on = cfg.treino.dias.includes(i);
                  return (
                    <button key={d} type="button" aria-pressed={on}
                      onClick={() => cfg.setTreino({ dias: on ? cfg.treino.dias.filter(x => x !== i) : [...cfg.treino.dias, i].sort() })}
                      className="pressable focus-ring min-h-[44px] rounded-[var(--radius-btn)] text-[13px] font-medium border transition-colors duration-200"
                      style={{ background: on ? 'var(--color-brand-ghost)' : 'var(--color-surface)', borderColor: on ? 'var(--color-brand)' : 'rgba(0,0,0,0.08)', color: on ? 'var(--color-brand)' : 'var(--color-ink-body)' }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] pt-3">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-body">
          <Icon name="bell" size={16} /> {cfg.ativo ? `${total} lembrete${total === 1 ? '' : 's'} por dia` : 'Lembretes desligados'}
        </span>
        <Button variant="ghost" size="sm" icon="bell" onClick={testar}>Enviar teste</Button>
      </div>
    </div>
  );
}
