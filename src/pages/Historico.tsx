import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Button } from '../components/ui/Button';
import { Icon, type IconName } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ExercisingPerson, RestingPerson } from '../components/illustrations';
import {
  useHistoricoStore,
  sessoesNoPeriodo,
  progressaoExercicio,
  resumoSemanal,
  semanasAtivas,
  exerciciosComHistorico,
  volumeSessao,
} from '../hooks/useHistoricoStore';
import { repo } from '../data/repository';
import { parseLocalISODate } from '../data/date';

/* =========================================================
   Utilidades de formatação
   ========================================================= */

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function ddmm(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function dataSessao(iso: string) {
  const d = parseLocalISODate(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/* =========================================================
   Abas segmentadas com indicador deslizante (usada também no Admin)
   ========================================================= */

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly { key: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const idx = Math.max(0, tabs.findIndex(t => t.key === value));
  const n = tabs.length;
  return (
    <div role="tablist" aria-label={label} className="relative flex p-1 rounded-[var(--radius-btn)] bg-black/[0.05]">
      <div
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-[6px] bg-surface card-border"
        style={{
          width: `calc((100% - 8px) / ${n})`,
          transform: `translateX(${idx * 100}%)`,
          transition: 'transform var(--dur-enter) var(--ease-out)',
        }}
      />
      {tabs.map(t => {
        const ativo = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(t.key)}
            className={`relative z-[1] flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 text-[14px] font-medium rounded-[6px] cursor-pointer transition-colors duration-200 focus-ring ${
              ativo ? 'text-ink' : 'text-ink-body hover:text-ink'
            }`}
          >
            {t.icon && <Icon name={t.icon} size={16} strokeWidth={2} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   Gráficos
   ========================================================= */

/** Gráfico de linha com traço desenhado na entrada (stroke-dashoffset). */
export function LineChart({
  dados,
  cor,
  label,
  unidade,
  formatar = v => nf.format(v),
}: {
  dados: { x: string; y: number }[];
  cor: string;
  label: string;
  unidade: string;
  formatar?: (v: number) => string;
}) {
  if (dados.length === 0) return null;
  const w = 300;
  const h = 96;
  const pad = 6;
  const max = Math.max(...dados.map(d => d.y), 1);
  const step = dados.length > 1 ? (w - pad * 2) / (dados.length - 1) : 0;
  const pts = dados.map((d, i) => ({
    x: dados.length > 1 ? pad + i * step : w / 2,
    y: pad + (1 - d.y / max) * (h - pad * 2),
  }));
  const line = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${pts[0].x},${h} ${line} ${pts[pts.length - 1].x},${h}`;
  const primeiro = dados[0];
  const ultimo = dados[dados.length - 1];
  const delta = ultimo.y - primeiro.y;
  const resumo = `${label}: ${formatar(primeiro.y)} ${unidade} em ${ddmm(primeiro.x)}, ${formatar(ultimo.y)} ${unidade} em ${ddmm(ultimo.x)}.`;

  return (
    <figure className="m-0">
      <figcaption className="flex items-baseline justify-between gap-2 mb-2">
        <span className="text-[14px] text-ink-body font-medium">{label}</span>
        <span className="text-[14px] font-semibold tabular" style={{ color: cor }}>
          {formatar(ultimo.y)} {unidade}
          {dados.length > 1 && delta !== 0 && (
            <span className="ml-1.5 text-[12px] text-ink-body font-medium">
              ({delta > 0 ? '+' : '−'}{formatar(Math.abs(delta))})
            </span>
          )}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={resumo} className="overflow-visible block">
        <line x1={0} x2={w} y1={h - 0.5} y2={h - 0.5} stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
        {dados.length > 1 && (
          <>
            <polygon points={area} fill={cor} opacity={0.08} className="anim-fade" style={{ animationDelay: '280ms' }} />
            <polyline
              points={line}
              fill="none"
              stroke={cor}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              style={{ strokeDashoffset: 1, animation: 'f-draw 720ms var(--ease-out) 80ms both' }}
            />
          </>
        )}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={i === pts.length - 1 ? cor : 'var(--color-surface)'}
            stroke={cor}
            strokeWidth={2}
            className="anim-pop"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animationDelay: `${200 + (i / Math.max(1, pts.length - 1)) * 520}ms`,
            }}
          />
        ))}
      </svg>
      <div className="flex justify-between mt-1.5">
        <span className="text-[12px] text-ink-body tabular">{ddmm(primeiro.x)}</span>
        {dados.length > 1 && <span className="text-[12px] text-ink-body tabular">{ddmm(ultimo.x)}</span>}
      </div>
    </figure>
  );
}

/** Barras verticais que crescem a partir da base. */
function BarChart({ dados, cor, label }: { dados: { x: string; y: number; rotulo: string }[]; cor: string; label: string }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const max = Math.max(...dados.map(d => d.y), 1);
  const resumo = `${label}: ${dados.map(d => `${d.rotulo}, ${d.y}`).join('; ')}.`;

  return (
    <div role="img" aria-label={resumo}>
      <div className="flex items-end gap-2 h-[120px]" aria-hidden>
        {dados.map((d, i) => {
          const v = d.y / max;
          return (
            <div key={d.x} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
              <span
                className="text-[12px] font-semibold tabular transition-opacity duration-200"
                style={{ color: d.y ? cor : 'var(--color-ink-body)', opacity: montado ? 1 : 0, transitionDelay: `${300 + i * 45}ms` }}
              >
                {d.y}
              </span>
              <div className="w-full flex-1 flex items-end rounded-[6px] bg-black/[0.04] overflow-hidden">
                <div
                  className="w-full rounded-[6px]"
                  style={{
                    height: `${Math.max(v * 100, d.y ? 6 : 0)}%`,
                    background: cor,
                    transformOrigin: 'bottom',
                    transform: `scaleY(${montado ? 1 : 0})`,
                    transition: `transform 520ms var(--ease-out) ${i * 45}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-1.5" aria-hidden>
        {dados.map(d => (
          <span key={d.x} className="flex-1 text-center text-[11px] text-ink-body tabular">{ddmm(d.x)}</span>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   Abas
   ========================================================= */

type Periodo = 30 | 90 | 3650;
const PERIODOS: { v: Periodo; label: string }[] = [
  { v: 30, label: '30 dias' },
  { v: 90, label: '90 dias' },
  { v: 3650, label: 'Tudo' },
];

function SessoesTab() {
  const sessoesTodas = useHistoricoStore(s => s.sessoes);
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const sessoes = useMemo(() => sessoesNoPeriodo(sessoesTodas, periodo), [sessoesTodas, periodo]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap" role="group" aria-label="Período">
        {PERIODOS.map(p => (
          <Pill key={p.v} onClick={() => setPeriodo(p.v)} selected={periodo === p.v}>
            {p.label}
          </Pill>
        ))}
      </div>

      {sessoes.length === 0 ? (
        <Card>
          <EmptyState
            compact
            illustration={<RestingPerson size={64} color="var(--color-brand)" />}
            title="Nada neste período"
            description="Nenhum treino registrado nesse intervalo. Tente um período maior."
          />
        </Card>
      ) : (
        sessoes.map((s, idx) => {
          const feitos = s.itens.filter(i => i.concluido);
          const vol = volumeSessao(s);
          const concluida = s.status === 'concluida';
          return (
            <Card key={`${s.id}-${s.data}`} animate index={Math.min(idx, 10)} padding={20}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h3 className="text-[16px] font-semibold text-ink truncate">{s.fichaModeloNome}</h3>
                  <p className="text-[13px] text-ink-body">{dataSessao(s.data)}</p>
                </div>
                <Pill
                  color={concluida ? 'var(--color-tint-ok)' : 'var(--color-brand-ghost)'}
                  textColor={concluida ? 'var(--color-ok)' : 'var(--color-brand-ink)'}
                  icon={concluida ? 'check' : 'clock'}
                >
                  {concluida ? 'Concluído' : 'Parcial'}
                </Pill>
              </div>
              <div className="flex items-center gap-4 mb-3 text-[13px] text-ink-body">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="dumbbell" size={16} />
                  <span className="tabular">{feitos.length}/{s.itens.length}</span> exercícios
                </span>
                {vol > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="activity" size={16} />
                    <span className="tabular">{nf.format(vol)}</span> kg de volume
                  </span>
                )}
              </div>
              {feitos.length > 0 && (
                <ul className="flex flex-col divide-y divide-black/[0.06] border-t border-black/[0.06]">
                  {feitos.map(item => {
                    const ex = repo.getExercicio(item.exercicioId);
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                        <span className="text-ink truncate">{ex?.nome ?? 'Exercício removido'}</span>
                        <span className="text-ink-body tabular whitespace-nowrap">
                          {item.series}×{item.reps}
                          {item.cargaKg ? ` · ${nf.format(item.cargaKg)} kg` : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

function ExerciciosTab() {
  const sessoes = useHistoricoStore(s => s.sessoes);
  const comHistorico = useMemo(() => {
    const ids = exerciciosComHistorico(sessoes);
    return repo.getExercicios().filter(e => ids.has(e.id));
  }, [sessoes]);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const selecionado = comHistorico.some(e => e.id === escolhido) ? escolhido! : comHistorico[0]?.id ?? '';
  const dados = useMemo(() => (selecionado ? progressaoExercicio(sessoes, selecionado, 90) : []), [sessoes, selecionado]);
  const ex = comHistorico.find(e => e.id === selecionado);

  if (comHistorico.length === 0) {
    return (
      <Card>
        <EmptyState
          compact
          illustration={<ExercisingPerson size={64} color="var(--color-muscle)" />}
          title="Sem exercícios concluídos"
          description="Marque exercícios como concluídos no treino para acompanhar carga e volume aqui."
        />
      </Card>
    );
  }

  const temCarga = dados.some(d => d.cargaMax > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap" role="group" aria-label="Escolha o exercício">
        {comHistorico.map(e => (
          <Pill
            key={e.id}
            onClick={() => setEscolhido(e.id)}
            selected={selecionado === e.id}
          >
            {e.nome}
          </Pill>
        ))}
      </div>

      <Card key={selecionado} animate padding={20}>
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-[16px] font-semibold text-ink">{ex?.nome}</h3>
          <span className="text-[13px] text-ink-body">Últimos 90 dias</span>
        </div>

        {dados.length === 0 ? (
          <p className="text-[14px] text-ink-body">Nenhum registro nos últimos 90 dias.</p>
        ) : !temCarga ? (
          <p className="text-[14px] text-ink-body leading-relaxed">
            {dados.length} {dados.length === 1 ? 'sessão registrada' : 'sessões registradas'}, mas sem carga informada.
            Registre a carga no treino para ver a evolução.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <LineChart
              dados={dados.map(d => ({ x: d.data, y: d.cargaMax }))}
              cor="var(--color-muscle)"
              label="Carga máxima"
              unidade="kg"
            />
            <LineChart
              dados={dados.map(d => ({ x: d.data, y: d.volumeTotal }))}
              cor="var(--color-science)"
              label="Volume total"
              unidade="kg"
            />
            {dados.length === 1 && (
              <p className="text-[13px] text-ink-body">Registre mais uma sessão para ver a linha de evolução.</p>
            )}
          </div>
        )}
      </Card>

      <p className="flex gap-2 text-[13px] text-ink-body leading-relaxed px-1">
        <Icon name="info" size={16} className="shrink-0 mt-[2px]" />
        <span>
          Volume = séries × repetições × carga. Em faixas como “8-10”, usamos o primeiro valor (estimativa conservadora).
          Valores apenas informativos — não substituem a orientação de um profissional.
        </span>
      </p>
    </div>
  );
}

function ResumoTab() {
  const sessoes = useHistoricoStore(s => s.sessoes);
  const resumo = useMemo(() => resumoSemanal(sessoes, 8), [sessoes]);
  const ativas = useMemo(() => semanasAtivas(sessoes), [sessoes]);
  const vol8 = resumo.reduce((a, r) => a + r.volumeTotal, 0);

  const kpis: { label: string; valor: string; cor: string; icon: IconName }[] = [
    { label: 'Treinos', valor: String(sessoes.length), cor: 'var(--color-brand)', icon: 'dumbbell' },
    { label: 'Semanas ativas', valor: String(ativas), cor: 'var(--color-muscle)', icon: 'calendar' },
    { label: 'Volume (8 sem.)', valor: vol8 >= 10000 ? `${nf.format(vol8 / 1000)} t` : `${nf.format(vol8)} kg`, cor: 'var(--color-science)', icon: 'activity' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {kpis.map((k, i) => (
          <Card key={k.label} animate index={i} padding={14} className="flex flex-col gap-1">
            <Icon name={k.icon} size={18} color={k.cor} />
            <span className="text-[22px] font-bold tabular leading-tight" style={{ color: k.cor }}>{k.valor}</span>
            <span className="text-[12px] text-ink-body leading-tight">{k.label}</span>
          </Card>
        ))}
      </div>

      <Card animate index={3} padding={20}>
        <h3 className="text-[16px] font-semibold text-ink mb-1">Treinos por semana</h3>
        <p className="text-[13px] text-ink-body mb-4">Últimas 8 semanas (início na segunda-feira)</p>
        <BarChart
          dados={resumo.map(r => ({ x: r.semana, y: r.sessoes, rotulo: `semana de ${ddmm(r.semana)}` }))}
          cor="var(--color-brand)"
          label="Treinos por semana"
        />
      </Card>
    </div>
  );
}

/* =========================================================
   Página
   ========================================================= */

type Tab = 'sessoes' | 'exercicios' | 'resumo';
const TABS = [
  { key: 'sessoes', label: 'Sessões' },
  { key: 'exercicios', label: 'Exercícios' },
  { key: 'resumo', label: 'Resumo' },
] as const satisfies readonly { key: Tab; label: string }[];

export function Historico() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('sessoes');
  const load = useHistoricoStore(s => s.load);
  const total = useHistoricoStore(s => s.sessoes.length);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Histórico" subtitle="Seus treinos, carga e volume" back className="!mb-0" />

      {total === 0 ? (
        <Card animate>
          <EmptyState
            illustration={<ExercisingPerson size={80} color="var(--color-muscle)" />}
            title="Nenhum treino registrado"
            description="Conclua um treino para começar seu histórico. Ele aparece aqui automaticamente."
            action={<Button icon="play" onClick={() => navigate('/treino')}>Ir para o treino</Button>}
          />
        </Card>
      ) : (
        <>
          <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} label="Seções do histórico" />
          <div key={tab} className="anim-fade" role="tabpanel" aria-label={TABS.find(t => t.key === tab)?.label}>
            {tab === 'sessoes' && <SessoesTab />}
            {tab === 'exercicios' && <ExerciciosTab />}
            {tab === 'resumo' && <ResumoTab />}
          </div>
        </>
      )}
    </div>
  );
}
