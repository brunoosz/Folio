import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type Modifier,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
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
import { DescansoBar, useDescansoStore } from '../components/Descanso';
import { ExercicioPicker } from '../components/ExercicioPicker';
import { InsightSono } from '../components/InsightSono';
import { useTreinoStore, type ModoEdicao } from '../hooks/useTreinoStore';
import { repo } from '../data/repository';
import { siglaDaFicha } from '../data/seed';
import { esquemaDe, repsResumo } from '../lib/progressao';
import { volumeSessao } from '../hooks/useHistoricoStore';
import type { SessaoItem } from '../data/types';

/** Arrasto só no eixo vertical (sem dependência extra). */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

const fmtKg = (n: number) => `${String(Math.round(n * 10) / 10).replace('.', ',')} kg`;

/** Resumo da linha: "3 × 12/10/8 · 20–30 kg". */
function resumoItem(item: SessaoItem) {
  const ex = repo.getExercicio(item.exercicioId);
  const esquema = esquemaDe(item, ex);
  const reps = repsResumo(item.series, item.reps, esquema);
  const cargas = (item.seriesLog ?? []).map(s => s.cargaKg).filter((c): c is number => !!c);
  const todas = cargas.length ? cargas : item.cargaKg ? [item.cargaKg] : [];
  let carga = '';
  if (todas.length) {
    const min = Math.min(...todas), max = Math.max(...todas);
    carga = min === max ? fmtKg(max) : `${String(min).replace('.', ',')}–${fmtKg(max)}`;
  }
  const feitas = (item.seriesLog ?? []).filter(s => s.feita).length;
  return { texto: `${item.series} × ${reps}${ex?.isometrico ? ' s' : ''}`, carga, feitas };
}

function LinhaExercicio({
  item, index, status, onToggle, onAbrir,
}: { item: SessaoItem; index: number; status: 'pendente' | 'em_andamento' | 'concluida'; onToggle: () => void; onAbrir: () => void }) {
  const ex = repo.getExercicio(item.exercicioId);
  const bloqueado = status === 'concluida';
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: bloqueado });
  if (!ex) return null;
  const { texto, carga, feitas } = resumoItem(item);

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, position: 'relative' }}>
      <div
        style={{ '--i': Math.min(index, 12) } as CSSProperties}
        className={`anim-rise card-border rounded-[var(--radius-card)] flex items-center gap-1 pr-1 transition-colors duration-200 ${
          item.concluido ? 'bg-brand-ghost' : 'bg-surface'
        } ${isDragging ? 'border-brand/40' : ''}`}
      >
        {!bloqueado ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reordenar ${ex.nome}`}
            className="focus-ring w-[40px] h-[60px] shrink-0 flex items-center justify-center text-ink-body cursor-grab active:cursor-grabbing touch-none rounded-l-[var(--radius-card)]"
          >
            <Icon name="drag-handle" size={18} />
          </button>
        ) : <span className="w-3" />}

        {status === 'em_andamento' && (
          <button
            type="button"
            role="checkbox"
            aria-checked={item.concluido}
            aria-label={`Marcar ${ex.nome} como feito`}
            onClick={onToggle}
            className="pressable focus-ring w-[44px] h-[44px] shrink-0 flex items-center justify-center rounded-full"
          >
            <span className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${item.concluido ? 'bg-brand border-brand' : 'border-black/25 bg-surface'}`}>
              {item.concluido && <span key="ok" className="anim-pop flex"><Icon name="check" size={16} color="#ffffff" strokeWidth={2.6} /></span>}
            </span>
          </button>
        )}
        {bloqueado && item.concluido && (
          <span className="w-[40px] h-[44px] shrink-0 flex items-center justify-center" aria-label="Feito">
            <Icon name="check" size={20} color="var(--color-brand)" strokeWidth={2.4} />
          </span>
        )}

        <button type="button" onClick={onAbrir} className="focus-ring flex-1 min-w-0 min-h-[60px] py-2.5 flex items-center gap-2 text-left rounded-[var(--radius-btn)]">
          <span className="flex-1 min-w-0">
            <span className={`block text-[15px] font-semibold text-ink leading-snug ${item.concluido ? 'line-through decoration-ink-body/50' : ''}`}>{ex.nome}</span>
            <span className="flex items-center gap-2 mt-0.5 text-[14px] text-ink-body tabular">
              <span>{texto}</span>
              {carga && <><span aria-hidden>·</span><span className="font-medium text-ink">{carga}</span></>}
              {status === 'em_andamento' && feitas > 0 && !item.concluido && (
                <span className="text-[12px] font-medium text-muscle">{feitas}/{item.series} séries</span>
              )}
            </span>
          </span>
          <Icon name="chevron-right" size={20} color="var(--color-ink-body)" />
        </button>
      </div>
    </div>
  );
}

function SeletorModo({ modo, onChange }: { modo: ModoEdicao; onChange: (m: ModoEdicao) => void }) {
  const opcoes: { v: ModoEdicao; t: string }[] = [{ v: 'hoje', t: 'Apenas hoje' }, { v: 'padrao', t: 'Salvar como padrão' }];
  return (
    <div className="anim-fade">
      <div role="radiogroup" aria-label="Modo de salvamento das alterações" className="grid grid-cols-2 p-1 rounded-[var(--radius-btn)] bg-black/[0.05] gap-1">
        {opcoes.map(o => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={modo === o.v}
            onClick={() => onChange(o.v)}
            className={`pressable focus-ring min-h-[40px] rounded-[6px] text-[14px] font-medium transition-colors duration-200 ${
              modo === o.v ? 'bg-surface text-ink card-border' : 'text-ink-body'
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>
      <p className={`text-[13px] mt-1.5 flex items-center gap-1.5 ${modo === 'padrao' ? 'text-muscle' : 'text-ink-body'}`}>
        <Icon name={modo === 'padrao' ? 'warning' : 'info'} size={14} />
        {modo === 'padrao'
          ? 'Mudanças em séries, ordem e exercícios também atualizam a ficha.'
          : 'Mudanças valem só para o treino de hoje.'}
      </p>
    </div>
  );
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
        <h2 className="text-[20px] font-bold tracking-tight-title mt-4 anim-rise" style={{ '--i': 2 } as CSSProperties}>Treino concluído!</h2>
        <p className="text-[14px] text-ink-body mt-1 anim-rise" style={{ '--i': 3 } as CSSProperties}>
          Registro salvo no seu histórico. Descanse e hidrate-se.
        </p>
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          {stats.map((s, i) => (
            <div key={s.label} className="anim-rise bg-surface card-border rounded-[var(--radius-btn)] py-2 px-1" style={{ '--i': 4 + i } as CSSProperties}>
              <p className="text-[16px] font-bold tabular">{s.valor}</p>
              <p className="text-[13px] text-ink-body">{s.label}</p>
            </div>
          ))}
        </div>
        <Button variant="ghost" icon="history" className="mt-4" onClick={() => navigate('/historico')}>Ver histórico</Button>
      </div>
    </Card>
  );
}

export function Treino() {
  const navigate = useNavigate();
  const { sessao, modo, load, setModo, iniciar, concluir, toggleItem, reorder, adicionarExercicio, usarFicha } = useTreinoStore();
  const [confirmar, setConfirmar] = useState(false);
  const [picker, setPicker] = useState(false);
  const [trocarFicha, setTrocarFicha] = useState(false);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fichas = useMemo(() => repo.getFichas(), [sessao.fichaModeloId, trocarFicha]);
  const ficha = fichas.find(f => f.id === sessao.fichaModeloId);
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

  const handleConcluir = () => {
    setConfirmar(false);
    useDescansoStore.getState().parar();
    concluir();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const header = (
    <PageHeader
      title={ficha?.nome ?? 'Treino de hoje'}
      subtitle={sessao.status === 'concluida' ? 'Concluído hoje' : total ? `${concluidos} de ${total} exercícios feitos` : undefined}
      className="!mb-0"
      right={<IconButton icon="calendar" label="Minhas fichas" onClick={() => navigate('/fichas')} />}
    />
  );

  if (!total) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
        {header}
        <Card animate>
          <EmptyState
            illustration={<AvatarMark accentColor="var(--color-science)" size={64}><StretchingPerson size={40} /></AvatarMark>}
            title="Nenhum exercício para hoje"
            description="Monte uma ficha, use um modelo pronto ou adicione exercícios só para hoje."
            action={
              <div className="flex flex-col gap-2 w-full">
                <Button variant="primary" icon="calendar" onClick={() => navigate('/fichas')}>Minhas fichas</Button>
                <Button variant="ghost" icon="plus" onClick={() => setPicker(true)}>Adicionar exercício</Button>
              </div>
            }
          />
        </Card>
        <ExercicioPicker open={picker} onClose={() => setPicker(false)} onPick={id => { adicionarExercicio(id); toast.success('Exercício adicionado'); }} />
      </div>
    );
  }

  const minutos = sessao.iniciadaEm && sessao.concluidaEm
    ? Math.max(1, Math.round((Date.parse(sessao.concluidaEm) - Date.parse(sessao.iniciadaEm)) / 60000))
    : null;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      {header}

      {sessao.status === 'concluida' && (
        <Conclusao concluidos={concluidos} total={total} volume={volumeSessao(sessao)} minutos={minutos} />
      )}

      {sessao.status !== 'concluida' && <InsightSono />}

      {sessao.status === 'em_andamento' && (
        <div className="anim-fade card-border rounded-[var(--radius-card)] bg-surface p-3 flex items-center gap-3" role="status">
          <span className="w-3 h-3 rounded-full bg-muscle pulse shrink-0" aria-hidden />
          <span className="text-[14px] font-medium text-ink flex-1">Treino em andamento</span>
          <span className="text-[14px] text-ink-body tabular"><span key={concluidos} className="num-tick">{concluidos}</span>/{total}</span>
        </div>
      )}

      {sessao.status === 'pendente' && fichas.length > 1 && (
        <button type="button" onClick={() => setTrocarFicha(true)} className="anim-fade pressable focus-ring self-start min-h-[40px] -mt-1 flex items-center gap-1.5 text-[14px] font-medium text-brand">
          <Icon name="swap" size={18} /> Trocar o treino de hoje
        </button>
      )}

      {sessao.status !== 'concluida' && <SeletorModo modo={modo} onChange={setModo} />}

      <ProgressBar value={total ? concluidos / total : 0} color="var(--color-muscle)" label="Progresso do treino" />

      <DescansoBar />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={sessao.itens.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {sessao.itens.map((item, i) => (
              <LinhaExercicio
                key={item.id}
                item={item}
                index={i}
                status={sessao.status}
                onToggle={() => toggleItem(item.id)}
                onAbrir={() => navigate(`/treino/${item.id}`)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sessao.status !== 'concluida' && (
        <Button variant="text" icon="plus" onClick={() => setPicker(true)} className="self-center">Adicionar exercício</Button>
      )}

      {sessao.status === 'pendente' && (
        <Button variant="primary" icon="play" fullWidth onClick={() => { iniciar(); toast.success('Treino iniciado. Bom treino!'); }}>Iniciar treino</Button>
      )}
      {sessao.status === 'em_andamento' && (
        <Button variant="primary" icon="flag" fullWidth onClick={() => setConfirmar(true)}>Concluir treino</Button>
      )}

      <p className="text-[13px] text-ink-body text-center">
        Toque em um exercício para ver a execução, anotar cargas e acompanhar a progressão. Fichas e cargas são referências:
        ajustes individuais devem ser feitos com um profissional de Educação Física.
      </p>

      <ExercicioPicker
        open={picker}
        onClose={() => setPicker(false)}
        excluir={sessao.itens.map(i => i.exercicioId)}
        onPick={id => { adicionarExercicio(id); toast.success(modo === 'padrao' ? 'Adicionado ao treino e à ficha' : 'Adicionado ao treino de hoje'); }}
      />

      <Sheet open={trocarFicha} onClose={() => setTrocarFicha(false)} title="Treino de hoje">
        <div className="flex flex-col gap-2 pb-2">
          {fichas.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => { usarFicha(f.id); setTrocarFicha(false); toast.success(`Hoje: ${f.nome}`); }}
              className={`pressable-soft focus-ring w-full text-left min-h-[56px] px-4 py-3 rounded-[var(--radius-card)] border flex items-center gap-3 ${
                f.id === sessao.fichaModeloId ? 'bg-brand-ghost border-brand' : 'bg-surface border-black/[0.08]'
              }`}
            >
              <span className="w-9 h-9 rounded-[var(--radius-btn)] bg-canvas flex items-center justify-center text-[14px] font-bold">{siglaDaFicha(f)}</span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold">{f.nome}</span>
                <span className="block text-[13px] text-ink-body">{f.itens.length} exercícios</span>
              </span>
              {f.id === sessao.fichaModeloId && <Pill textColor="var(--color-brand)">Atual</Pill>}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={confirmar} onClose={() => setConfirmar(false)} title="Concluir treino?" variant="modal">
        <div className="flex flex-col gap-4 pt-1">
          <p className="text-[14px] text-ink-body leading-relaxed">
            {pendentes === 0
              ? 'Todos os exercícios foram marcados. O treino será salvo no seu histórico.'
              : `${pendentes} ${pendentes === 1 ? 'exercício ainda não foi marcado' : 'exercícios ainda não foram marcados'}. Você pode concluir mesmo assim: apenas as séries feitas entram no histórico.`}
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
