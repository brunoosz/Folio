import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { AvatarMark } from '../components/ui/AvatarMark';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { ProgressBar } from '../components/ui/ProgressBar';
import { toast } from '../components/ui/Toast';
import { ExercisingPerson, StretchingPerson, Sparkle } from '../components/illustrations';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { repo } from '../data/repository';
import type { SessaoItem } from '../data/types';

/** Arrasto só no eixo vertical (sem dependência extra). */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export const equipLabels: Record<string, string> = {
  barra_livre: 'Barra livre',
  maquina: 'Máquina',
  haltere: 'Halteres',
  cabo: 'Cabo',
  peso_corporal: 'Peso corporal',
};

const dificLabels: Record<string, string> = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

const papelLabels: Record<string, string> = {
  primario: 'Primário',
  secundario: 'Secundário',
  estabilizador: 'Estabilizador',
};

const papelColors: Record<string, string> = {
  primario: 'var(--color-muscle)',
  secundario: 'var(--color-muscle-secondary)',
  estabilizador: 'var(--color-routine)',
};

/** Conteúdo de detalhes de um exercício, em um Sheet. Reutilizado pelo Mapa. */
export function ExercicioDetalhesSheet({ exercicioId, onClose }: { exercicioId: string | null; onClose: () => void }) {
  // Mantém o último id durante a animação de saída.
  const [ultimoId, setUltimoId] = useState(exercicioId);
  useEffect(() => { if (exercicioId) setUltimoId(exercicioId); }, [exercicioId]);
  const id = exercicioId ?? ultimoId;
  const ex = id ? repo.getExercicio(id) : undefined;
  const musculos = id ? repo.getMusculosDoExercicio(id) : [];

  return (
    <Sheet open={!!exercicioId && !!ex} onClose={onClose} title={ex?.nome ?? 'Exercício'}>
      {ex && (
        <div className="stagger flex flex-col gap-4 pb-2">
          <div className="flex gap-2 flex-wrap">
            <Pill color="var(--color-brand-ghost)" icon="dumbbell">{equipLabels[ex.equipamento]}</Pill>
            <Pill color={ex.dificuldade === 'avancado' ? '#fde2de' : ex.dificuldade === 'intermediario' ? '#fff3d6' : '#e6f3fe'}>
              {dificLabels[ex.dificuldade]}
            </Pill>
          </div>

          <section>
            <h3 className="text-[14px] font-semibold mb-2">Músculos</h3>
            <ul className="flex flex-col gap-2">
              {musculos.map(em => (
                <li key={em.musculoId} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: papelColors[em.papel] }} aria-hidden />
                  <span className="text-[14px] text-ink">{em.musculo.nome}</span>
                  <span className="text-[14px] text-ink-body">· {papelLabels[em.papel]}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-[14px] font-semibold mb-2 flex items-center gap-1.5">
              <Icon name="shield" size={18} color="var(--color-science)" /> Segurança
            </h3>
            <p className="text-[14px] text-ink-body leading-relaxed">{ex.notasSeguranca}</p>
            {!ex.revisado && (
              <p className="text-[13px] text-ink-body italic mt-2">
                Dados a revisar por profissional de Educação Física / fisioterapia.
              </p>
            )}
          </section>

          <Button variant="ghost" onClick={onClose} fullWidth>Fechar</Button>
        </div>
      )}
    </Sheet>
  );
}

/** Formata número com vírgula decimal (pt-BR). */
function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  return String(n).replace('.', ',');
}

/** Campo numérico que aceita vírgula ou ponto e mantém o rascunho enquanto digita. */
function NumField({
  id,
  label,
  value,
  onChange,
  decimal = false,
  min = 0,
  max = 9999,
  placeholder,
  disabled,
  width = 'w-full',
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  decimal?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  width?: string;
}) {
  const [draft, setDraft] = useState(fmtNum(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(fmtNum(value));
  }, [value]);

  const handle = (raw: string) => {
    const limpo = decimal ? raw.replace(/[^\d.,]/g, '').replace(/\./g, ',') : raw.replace(/\D/g, '');
    // apenas um separador decimal, até 2 casas
    const partes = limpo.split(',');
    const texto = decimal && partes.length > 1 ? `${partes[0]},${partes.slice(1).join('').slice(0, 2)}` : limpo;
    setDraft(texto);
    if (texto === '' || texto === ',') { onChange(null); return; }
    const n = Number(texto.replace(',', '.'));
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
  };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label htmlFor={id} className="text-[14px] text-ink-body">{label}</label>
      <input
        id={id}
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        enterKeyHint="done"
        value={draft}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={e => { focused.current = true; e.currentTarget.select(); }}
        onBlur={() => { focused.current = false; setDraft(fmtNum(value)); }}
        onChange={e => handle(e.target.value)}
        className={`${width} h-[44px] text-center text-[15px] font-medium tabular bg-canvas rounded-[var(--radius-btn)] card-border transition-colors duration-200 focus:bg-surface disabled:opacity-60`}
      />
    </div>
  );
}

function fmtTempo(seg: number) {
  const s = Math.max(0, Math.ceil(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

type Descanso = { itemId: string; nome: string; total: number; fim: number };

function SortableExercicio({
  item,
  index,
  status,
  descansoAtivo,
  onToggle,
  onUpdate,
  onDetalhes,
  onDescanso,
}: {
  item: SessaoItem;
  index: number;
  status: 'pendente' | 'em_andamento' | 'concluida';
  descansoAtivo: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Pick<SessaoItem, 'series' | 'reps' | 'cargaKg' | 'notas'>>) => void;
  onDetalhes: () => void;
  onDescanso: () => void;
}) {
  const ex = repo.getExercicio(item.exercicioId);
  const musculos = repo.getMusculosDoExercicio(item.exercicioId);
  const primarios = musculos.filter(m => m.papel === 'primario');
  const bloqueado = status === 'concluida';
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: bloqueado,
  });

  if (!ex) return null;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  };
  const descanso = item.descansoSeg ?? 0;

  // A animação de entrada fica num wrapper interno: animações CSS com `fill: both`
  // sobrescreveriam o transform inline usado pelo dnd-kit durante o arrasto.
  return (
    <div ref={setNodeRef} style={style}>
    <div
      style={{ ['--i' as string]: Math.min(index, 12) } as CSSProperties}
      className={`anim-rise card-border rounded-[var(--radius-card)] p-4 transition-colors duration-200 ${
        item.concluido ? 'bg-brand-ghost' : 'bg-surface'
      } ${isDragging ? 'border-brand/40' : ''}`}
    >
      <div className="flex items-start gap-2">
        {!bloqueado && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reordenar ${ex.nome}`}
            className="focus-ring -ml-2 w-[44px] h-[44px] shrink-0 flex items-center justify-center rounded-[var(--radius-btn)] text-ink-body cursor-grab active:cursor-grabbing touch-none"
          >
            <Icon name="drag-handle" size={20} />
          </button>
        )}

        {status === 'em_andamento' && (
          <button
            type="button"
            role="checkbox"
            aria-checked={item.concluido}
            aria-label={`Marcar ${ex.nome} como feito`}
            onClick={onToggle}
            className="pressable focus-ring w-[44px] h-[44px] shrink-0 -my-0.5 flex items-center justify-center rounded-full"
          >
            <span
              className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                item.concluido ? 'bg-brand border-brand' : 'border-black/25 bg-surface'
              }`}
            >
              {item.concluido && (
                <span key="ok" className="anim-pop flex">
                  <Icon name="check" size={16} color="#ffffff" strokeWidth={2.6} />
                </span>
              )}
            </span>
          </button>
        )}

        {bloqueado && item.concluido && (
          <span className="w-[44px] h-[44px] shrink-0 flex items-center justify-center" aria-label="Feito">
            <Icon name="check" size={22} color="var(--color-brand)" strokeWidth={2.4} />
          </span>
        )}

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={onDetalhes}
            className="focus-ring text-left min-h-[44px] w-full flex items-center gap-1 rounded-[var(--radius-btn)] group"
          >
            <span className={`text-[16px] font-semibold leading-tight ${item.concluido ? 'line-through decoration-ink-body/50' : ''}`}>
              {ex.nome}
            </span>
            <Icon name="info" size={16} className="text-ink-body group-hover:text-brand transition-colors duration-200" />
          </button>
          <p className="text-[14px] text-ink-body">
            {primarios.map(m => m.musculo.nome).join(', ')}
            {primarios.length ? ' · ' : ''}
            {equipLabels[ex.equipamento]}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        <NumField
          id={`series-${item.id}`}
          label="Séries"
          value={item.series}
          min={1}
          max={20}
          disabled={bloqueado}
          onChange={v => onUpdate({ series: v === null ? 1 : Math.max(1, Math.round(v)) })}
        />
        <div className="flex flex-col gap-1 min-w-0">
          <label htmlFor={`reps-${item.id}`} className="text-[14px] text-ink-body">Reps</label>
          <input
            id={`reps-${item.id}`}
            type="text"
            value={item.reps}
            maxLength={24}
            disabled={bloqueado}
            onChange={e => onUpdate({ reps: e.target.value })}
            className="w-full h-[44px] px-2 text-center text-[15px] font-medium bg-canvas rounded-[var(--radius-btn)] card-border transition-colors duration-200 focus:bg-surface disabled:opacity-60"
          />
        </div>
        <NumField
          id={`carga-${item.id}`}
          label="Carga (kg)"
          value={item.cargaKg}
          decimal
          max={1000}
          placeholder="—"
          disabled={bloqueado}
          onChange={v => onUpdate({ cargaKg: v })}
        />
      </div>

      <label htmlFor={`notas-${item.id}`} className="sr-only">Notas de {ex.nome}</label>
      <input
        id={`notas-${item.id}`}
        type="text"
        value={item.notas}
        disabled={bloqueado}
        onChange={e => onUpdate({ notas: e.target.value })}
        placeholder="Notas…"
        className="mt-3 w-full h-[44px] px-3 text-[14px] text-ink-body bg-canvas rounded-[var(--radius-btn)] card-border transition-colors duration-200 focus:bg-surface disabled:opacity-60"
      />

      {!bloqueado && (
        <div className="flex items-center justify-between gap-2 mt-2 -mb-1">
          {descanso > 0 ? (
            <button
              type="button"
              onClick={onDescanso}
              aria-pressed={descansoAtivo}
              className={`pressable focus-ring min-h-[44px] px-2 -ml-2 flex items-center gap-1.5 text-[14px] font-medium rounded-[var(--radius-btn)] ${
                descansoAtivo ? 'text-muscle' : 'text-ink-body hover:text-ink'
              }`}
            >
              <Icon name={descansoAtivo ? 'pause' : 'timer'} size={18} />
              {descansoAtivo ? 'Parar descanso' : `Descanso ${fmtTempo(descanso)}`}
            </button>
          ) : <span />}
          <Link
            to={`/troca/${item.id}`}
            className="pressable focus-ring min-h-[44px] px-2 -mr-2 flex items-center gap-1.5 text-[14px] text-brand font-medium rounded-[var(--radius-btn)]"
          >
            <Icon name="swap" size={18} />
            Trocar
          </Link>
        </div>
      )}
    </div>
    </div>
  );
}

function DescansoBar({ descanso, onParar, onMais }: { descanso: Descanso; onParar: () => void; onMais: () => void }) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);
  const restante = Math.max(0, (descanso.fim - agora) / 1000);

  return (
    <div className="sticky top-[calc(8px+env(safe-area-inset-top))] z-20 anim-rise" role="timer" aria-live="off">
      <div className="card-border rounded-[var(--radius-card)] bg-surface p-3 flex items-center gap-3">
        <AvatarMark accentColor="var(--color-routine)" size={40}>
          <Icon name="timer" size={20} color="var(--color-ink)" />
        </AvatarMark>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-ink-body truncate">Descanso · {descanso.nome}</p>
          <p className="text-[20px] font-bold tabular leading-tight">{fmtTempo(restante)}</p>
          <ProgressBar value={restante / descanso.total} color="var(--color-routine)" height={4} className="mt-1" label="Tempo de descanso restante" />
        </div>
        <Button variant="text" size="sm" onClick={onMais} aria-label="Adicionar 15 segundos">+15s</Button>
        <IconButton icon="x" label="Parar descanso" onClick={onParar} />
      </div>
    </div>
  );
}

function volumeDe(itens: SessaoItem[]) {
  return itens.reduce((acc, i) => {
    if (!i.concluido) return acc;
    const reps = parseInt(i.reps, 10) || 0;
    return acc + i.series * reps * (i.cargaKg ?? 0);
  }, 0);
}

function Conclusao({ concluidos, total, volume, minutos }: { concluidos: number; total: number; volume: number; minutos: number | null }) {
  const navigate = useNavigate();
  const stats = [
    { label: 'Exercícios', valor: `${concluidos}/${total}` },
    { label: 'Volume', valor: volume > 0 ? `${Math.round(volume).toLocaleString('pt-BR')} kg` : '—' },
    { label: 'Duração', valor: minutos !== null ? `${minutos} min` : '—' },
  ];
  return (
    <Card accent="var(--color-brand-ghost)" animate className="relative overflow-hidden">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <AvatarMark accentColor="var(--color-muscle)" size={88} animate>
            <ExercisingPerson size={56} />
          </AvatarMark>
          <span className="absolute -top-1 -left-3 anim-pop" style={{ animationDelay: '280ms' }}><Sparkle size={20} /></span>
          <span className="absolute top-2 -right-4 anim-pop" style={{ animationDelay: '380ms' }}><Sparkle size={16} color="var(--color-science)" /></span>
          <span className="absolute -bottom-1 -right-2 anim-pop" style={{ animationDelay: '480ms' }}><Sparkle size={14} color="var(--color-muscle)" /></span>
        </div>
        <h2 className="text-[20px] font-bold tracking-tight-title mt-4 anim-rise" style={{ ['--i' as string]: 2 } as CSSProperties}>
          Treino concluído!
        </h2>
        <p className="text-[14px] text-ink-body mt-1 anim-rise" style={{ ['--i' as string]: 3 } as CSSProperties}>
          Registro salvo no seu histórico. Descanse e hidrate-se.
        </p>
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          {stats.map((s, i) => (
            <div key={s.label} className="anim-rise bg-surface card-border rounded-[var(--radius-btn)] py-2 px-1" style={{ ['--i' as string]: 4 + i } as CSSProperties}>
              <p className="text-[16px] font-bold tabular">{s.valor}</p>
              <p className="text-[13px] text-ink-body">{s.label}</p>
            </div>
          ))}
        </div>
        <Button variant="ghost" icon="history" className="mt-4" onClick={() => navigate('/historico')}>
          Ver histórico
        </Button>
      </div>
    </Card>
  );
}

export function Treino() {
  const { sessao, load, iniciar, concluir, toggleItem, updateItem, reorder } = useTreinoStore();
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [descanso, setDescanso] = useState<Descanso | null>(null);

  useEffect(() => { load(); }, [load]);

  // Recarrega ao voltar para o app (virada de dia, outra aba).
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);

  // Fim do descanso
  useEffect(() => {
    if (!descanso) return;
    const ms = descanso.fim - Date.now();
    const t = window.setTimeout(() => {
      setDescanso(null);
      try { navigator.vibrate?.([180, 80, 180]); } catch { /* sem vibração */ }
      toast.info('Descanso concluído. Bora para a próxima série!');
    }, Math.max(0, ms));
    return () => window.clearTimeout(t);
  }, [descanso]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ficha = useMemo(() => repo.getFichas().find(f => f.id === sessao.fichaModeloId), [sessao.fichaModeloId]);
  const concluidos = sessao.itens.filter(i => i.concluido).length;
  const total = sessao.itens.length;
  const pendentes = total - concluidos;

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIdx = sessao.itens.findIndex(i => i.id === active.id);
      const newIdx = sessao.itens.findIndex(i => i.id === over.id);
      if (oldIdx >= 0 && newIdx >= 0) reorder(arrayMove(sessao.itens, oldIdx, newIdx));
    }
  };

  const alternarDescanso = useCallback((item: SessaoItem) => {
    setDescanso(atual => {
      if (atual?.itemId === item.id) return null;
      const total = item.descansoSeg ?? 60;
      const nome = repo.getExercicio(item.exercicioId)?.nome ?? 'Exercício';
      return { itemId: item.id, nome, total, fim: Date.now() + total * 1000 };
    });
  }, []);

  const handleIniciar = () => {
    iniciar();
    toast.success('Treino iniciado. Bom treino!');
  };

  const handleConcluir = () => {
    setConfirmar(false);
    setDescanso(null);
    concluir();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  if (!total) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <PageHeader title="Treino" />
        <Card animate>
          <EmptyState
            illustration={<AvatarMark accentColor="var(--color-science)" size={64}><StretchingPerson size={40} /></AvatarMark>}
            title="Nenhuma ficha para hoje"
            description="Quando houver uma ficha de treino cadastrada, ela aparece aqui com séries, repetições e carga."
          />
        </Card>
      </div>
    );
  }

  const minutos =
    sessao.iniciadaEm && sessao.concluidaEm
      ? Math.max(1, Math.round((Date.parse(sessao.concluidaEm) - Date.parse(sessao.iniciadaEm)) / 60000))
      : null;

  const subtitulo =
    sessao.status === 'concluida'
      ? 'Concluído hoje'
      : `${concluidos} de ${total} exercícios feitos`;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title={ficha?.nome ?? 'Treino de hoje'} subtitle={subtitulo} className="!mb-0" />

      {sessao.status === 'concluida' && (
        <Conclusao concluidos={concluidos} total={total} volume={volumeDe(sessao.itens)} minutos={minutos} />
      )}

      {sessao.status === 'em_andamento' && (
        <div className="anim-fade card-border rounded-[var(--radius-card)] bg-surface p-3 flex items-center gap-3" role="status">
          <span className="w-3 h-3 rounded-full bg-muscle pulse shrink-0" aria-hidden />
          <span className="text-[14px] font-medium text-ink flex-1">Treino em andamento</span>
          <span className="text-[14px] text-ink-body tabular">
            <span key={concluidos} className="num-tick">{concluidos}</span>/{total}
          </span>
        </div>
      )}

      {sessao.status === 'pendente' && (
        <Card accent="var(--color-brand-ghost)" padding={16} animate>
          <p className="text-[14px] text-ink-body flex items-start gap-2">
            <Icon name="info" size={18} color="var(--color-science)" className="mt-0.5" />
            Ajuste séries, repetições e carga antes de começar. Segure o ícone de arrastar para mudar a ordem.
          </p>
        </Card>
      )}

      <ProgressBar value={total ? concluidos / total : 0} color="var(--color-muscle)" label="Progresso do treino" />

      {descanso && (
        <DescansoBar
          descanso={descanso}
          onParar={() => setDescanso(null)}
          onMais={() => setDescanso(d => (d ? { ...d, fim: d.fim + 15000, total: d.total + 15 } : d))}
        />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={sessao.itens.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {sessao.itens.map((item, i) => (
              <SortableExercicio
                key={item.id}
                item={item}
                index={i}
                status={sessao.status}
                descansoAtivo={descanso?.itemId === item.id}
                onToggle={() => toggleItem(item.id)}
                onUpdate={patch => updateItem(item.id, patch)}
                onDetalhes={() => setDetalheId(item.exercicioId)}
                onDescanso={() => alternarDescanso(item)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sessao.status === 'pendente' && (
        <Button variant="primary" icon="play" fullWidth onClick={handleIniciar} className="mt-2">
          Iniciar treino
        </Button>
      )}
      {sessao.status === 'em_andamento' && (
        <Button variant="primary" icon="flag" fullWidth onClick={() => setConfirmar(true)} className="mt-2">
          Concluir treino
        </Button>
      )}

      <p className="text-[13px] text-ink-body text-center">
        Fichas e cargas são referências. Ajustes individuais devem ser feitos com um profissional de Educação Física.
      </p>

      <ExercicioDetalhesSheet exercicioId={detalheId} onClose={() => setDetalheId(null)} />

      <Sheet open={confirmar} onClose={() => setConfirmar(false)} title="Concluir treino?" variant="modal">
        <div className="flex flex-col gap-4 pt-1">
          <p className="text-[14px] text-ink-body leading-relaxed">
            {pendentes === 0
              ? 'Todos os exercícios foram marcados. O treino será salvo no seu histórico.'
              : `${pendentes} ${pendentes === 1 ? 'exercício ainda não foi marcado' : 'exercícios ainda não foram marcados'}. Você pode concluir mesmo assim — apenas os marcados entram no volume do histórico.`}
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="primary" icon="check" fullWidth onClick={handleConcluir}>Concluir e salvar</Button>
            <Button variant="text" fullWidth onClick={() => setConfirmar(false)}>Continuar treinando</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
