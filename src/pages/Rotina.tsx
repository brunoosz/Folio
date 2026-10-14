import { useEffect, useState, type CSSProperties } from 'react';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { RestingPerson } from '../components/illustrations';
import { useRotinaStore } from '../hooks/useRotinaStore';
import { addDiasISO, formatDataLonga, hojeLocal, parseLocalISODate } from '../data/date';

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Anel de progresso animado com o ícone do hábito no centro. */
function ProgressRing({ value, color, size = 52, children }: { value: number; color: string; size?: number; children: React.ReactNode }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  // Começa vazio e anima até o valor na montagem.
  const [mostrado, setMostrado] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMostrado(v));
    return () => cancelAnimationFrame(raf);
  }, [v]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - mostrado)}
          style={{ transition: 'stroke-dashoffset 480ms var(--ease-out)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function MiniBarChart({ dados, cor, meta, nome }: { dados: { data: string; valor: number }[]; cor: string; meta: number; nome: string }) {
  const max = Math.max(meta, ...dados.map(d => d.valor), 1);
  const cumpridos = dados.filter(d => d.valor >= meta).length;
  return (
    <div className="flex items-end gap-[6px] h-[48px]" role="img" aria-label={`${nome}: meta cumprida em ${cumpridos} dos últimos ${dados.length} dias`}>
      {dados.map((d, i) => {
        const dia = parseLocalISODate(d.data).getDay();
        return (
          <div key={d.data} className="flex flex-col items-center gap-1" title={`${DIAS[dia]}: ${d.valor}`}>
            <div
              className="w-[10px] rounded-full anim-scale"
              style={{
                height: `${Math.max(4, (d.valor / max) * 28)}px`,
                background: d.valor > 0 ? cor : 'rgba(0,0,0,0.12)',
                opacity: d.valor > 0 && d.valor < meta ? 0.45 : 1,
                transformOrigin: 'bottom',
                transition: 'height 200ms ease, background-color 200ms ease, opacity 200ms ease',
                ['--i' as string]: i,
              } as CSSProperties}
            />
            <span className={`text-[12px] leading-none ${i === dados.length - 1 ? 'text-ink font-semibold' : 'text-ink-body'}`} aria-hidden>
              {LETRAS[dia]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Rotina() {
  const { habitos, registros, load, incrementar, decrementar, getRegistroHoje, getHistorico, getSequencia, getSequenciaGeral } =
    useRotinaStore();
  // força re-render na virada do dia / ao voltar ao app
  const [, setTick] = useState(0);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') { load(); setTick(t => t + 1); } };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);

  const hoje = hojeLocal();
  const titulo = formatDataLonga(parseLocalISODate(hoje));
  const subtitulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);

  const completos = habitos.filter(h => getRegistroHoje(h.id).valor >= Math.max(1, h.meta ?? 1)).length;
  const sequencia = getSequenciaGeral();

  // semana: últimos 7 dias, hoje por último
  const semana = Array.from({ length: 7 }, (_, i) => addDiasISO(hoje, i - 6)).map(data => ({
    data,
    dia: parseLocalISODate(data).getDay(),
    ok: habitos.length > 0 && habitos.every(h => (registros.find(r => r.habitoId === h.id && r.data === data)?.valor ?? 0) >= Math.max(1, h.meta ?? 1)),
  }));

  if (!habitos.length) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <PageHeader title="Rotina" subtitle={subtitulo} />
        <Card animate>
          <EmptyState
            illustration={<RestingPerson size={56} />}
            title="Nenhum hábito ainda"
            description="Seus hábitos diários (água, sono, suplementos) aparecem aqui."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Rotina" subtitle={subtitulo} className="!mb-0" />

      {/* Resumo do dia + sequência */}
      <Card animate index={0}>
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] text-ink-body">Hábitos de hoje</p>
            <p className="text-[22px] font-bold tabular leading-tight">
              <span key={completos} className="num-tick">{completos}</span>
              <span className="text-ink-body font-medium text-[16px]"> de {habitos.length}</span>
            </p>
          </div>
          <div
            className="flex items-center gap-2 rounded-[var(--radius-btn)] px-3 py-2"
            style={{ background: sequencia > 0 ? '#fff3d6' : 'var(--color-canvas)' }}
            aria-label={`Sequência: ${sequencia} ${sequencia === 1 ? 'dia' : 'dias'} com todas as metas`}
          >
            <span key={sequencia > 0 ? 'on' : 'off'} className="anim-pop inline-flex">
              <Icon name="flame" size={22} color={sequencia > 0 ? 'var(--color-saffron)' : 'var(--color-ink-body)'} />
            </span>
            <div className="leading-tight">
              <p className="text-[18px] font-bold tabular"><span key={sequencia} className="num-tick">{sequencia}</span></p>
              <p className="text-[12px] text-ink-body">{sequencia === 1 ? 'dia seguido' : 'dias seguidos'}</p>
            </div>
          </div>
        </div>
        <ProgressBar value={completos / habitos.length} color="var(--color-routine)" className="mt-3" label="Hábitos concluídos hoje" />

        <ul className="flex justify-between mt-4" aria-label="Últimos 7 dias">
          {semana.map(d => {
            const isHoje = d.data === hoje;
            return (
              <li key={d.data} className="flex flex-col items-center gap-1.5 min-w-[36px]" aria-label={`${DIAS[d.dia]}${isHoje ? ' (hoje)' : ''}: ${d.ok ? 'todas as metas' : 'metas incompletas'}`}>
                <span className={`text-[12px] font-medium ${isHoje ? 'text-brand' : 'text-ink-body'}`}>{LETRAS[d.dia]}</span>
                <span
                  className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-200 ${
                    d.ok ? 'bg-routine' : isHoje ? 'border-2 border-brand' : 'bg-black/[0.05]'
                  }`}
                >
                  {d.ok && <Icon name="check" size={14} color="var(--color-ink)" strokeWidth={2.6} />}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Hábitos */}
      <div className="flex flex-col gap-3">
        {habitos.map((habito, idx) => {
          const reg = getRegistroHoje(habito.id);
          const meta = Math.max(1, habito.meta ?? 1);
          const hist = getHistorico(habito.id, 7);
          const completo = reg.valor >= meta;
          const seq = getSequencia(habito.id);

          return (
            <Card key={habito.id} animate index={idx + 1} padding={20}>
              <div className="flex items-center gap-3">
                <ProgressRing value={reg.valor / meta} color={habito.cor}>
                  <span key={completo ? 'ok' : 'no'} className={completo ? 'anim-pop inline-flex' : 'inline-flex'}>
                    <Icon name={habito.icone} size={22} color="var(--color-ink)" />
                  </span>
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-semibold">{habito.nome}</h3>
                    {completo && (
                      <span className="anim-pop">
                        <Pill color="#e0f8e6" textColor="#1a7a3a" icon="check">Meta batida</Pill>
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-ink-body tabular">
                    <span key={reg.valor} className="num-tick font-semibold text-ink">{reg.valor}</span>/{meta} {habito.unidade}
                    {seq > 0 && (
                      <span className="ml-2 inline-flex items-center gap-0.5 align-middle">
                        <Icon name="flame" size={14} color="var(--color-saffron)" />
                        {seq}d
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-between mt-3">
                <MiniBarChart dados={hist} cor={habito.cor} meta={meta} nome={habito.nome} />

                <div className="flex items-center gap-1.5" role="group" aria-label={`Ajustar ${habito.nome}`}>
                  <button
                    type="button"
                    onClick={() => decrementar(habito.id)}
                    disabled={reg.valor <= 0}
                    aria-label={`Diminuir ${habito.nome}`}
                    className="pressable focus-ring w-[44px] h-[44px] rounded-[var(--radius-btn)] bg-surface card-border flex items-center justify-center text-ink disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Icon name="minus" size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => incrementar(habito.id)}
                    aria-label={`Aumentar ${habito.nome}`}
                    className="pressable focus-ring w-[44px] h-[44px] rounded-[var(--radius-btn)] card-border flex items-center justify-center text-ink"
                    style={{ background: `color-mix(in srgb, ${habito.cor} 16%, white)` }}
                  >
                    <Icon name="plus" size={20} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-[13px] text-ink-body text-center">
        Acompanhamento de hábitos não substitui orientação profissional.
      </p>
    </div>
  );
}
