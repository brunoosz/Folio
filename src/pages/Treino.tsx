import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { EmptyState } from '../components/ui/EmptyState';
import { AvatarMark } from '../components/ui/AvatarMark';
import { StretchingPerson } from '../components/illustrations';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { repo } from '../data/repository';
import type { SessaoItem } from '../data/types';

const equipLabels: Record<string, string> = {
  barra_livre: 'Barra livre',
  maquina: 'Máquina',
  haltere: 'Halteres',
  cabo: 'Cabo',
  peso_corporal: 'Peso corporal',
};

const papelColors: Record<string, string> = {
  primario: 'var(--color-muscle)',
  secundario: 'var(--color-muscle-secondary)',
  estabilizador: 'var(--color-routine)',
};

function ExercicioDetalhes({ exercicioId, onClose }: { exercicioId: string; onClose: () => void }) {
  const ex = repo.getExercicio(exercicioId);
  const musculos = repo.getMusculosDoExercicio(exercicioId);
  if (!ex) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-surface w-full max-w-lg rounded-t-[20px] p-6 pb-10 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-ink-muted/30 rounded-full mx-auto mb-4" />
        <h2 className="text-[20px] font-bold tracking-tight-title mb-1">{ex.nome}</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Pill color="var(--color-brand-ghost)">{equipLabels[ex.equipamento]}</Pill>
          <Pill color={ex.dificuldade === 'avancado' ? '#fde2de' : ex.dificuldade === 'intermediario' ? '#fff3d6' : '#e6f3fe'}>
            {ex.dificuldade.charAt(0).toUpperCase() + ex.dificuldade.slice(1)}
          </Pill>
        </div>

        <h3 className="text-[14px] font-semibold mb-2">Músculos</h3>
        <div className="flex flex-col gap-1.5 mb-4">
          {musculos.map(em => (
            <div key={em.musculoId} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: papelColors[em.papel] }} />
              <span className="text-[14px] text-ink-body">{em.musculo.nome}</span>
              <span className="text-[12px] text-ink-muted">({em.papel})</span>
            </div>
          ))}
        </div>

        <h3 className="text-[14px] font-semibold mb-2">Segurança</h3>
        <p className="text-[14px] text-ink-body leading-relaxed mb-4">{ex.notasSeguranca}</p>
        {!ex.revisado && (
          <p className="text-[12px] text-ink-muted italic">
            Dados a revisar por profissional de Educação Física / fisioterapia.
          </p>
        )}

        <Button variant="ghost" onClick={onClose} className="w-full mt-4">Fechar</Button>
      </div>
    </div>
  );
}

function SortableExercicio({
  item,
  modoAtivo,
  onToggle,
  onUpdate,
  onDetalhes,
}: {
  item: SessaoItem;
  modoAtivo: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Pick<SessaoItem, 'series' | 'reps' | 'cargaKg' | 'notas'>>) => void;
  onDetalhes: () => void;
}) {
  const ex = repo.getExercicio(item.exercicioId);
  const musculos = repo.getMusculosDoExercicio(item.exercicioId);
  const primarios = musculos.filter(m => m.papel === 'primario');
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  if (!ex) return null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`card-border rounded-[var(--radius-card)] bg-surface p-4 ${item.concluido ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1" {...attributes} {...listeners}>
          <span className="text-ink-muted/50 cursor-grab text-[14px]">☰</span>
        </div>

        {modoAtivo && (
          <button onClick={onToggle} className="mt-0.5 shrink-0">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                item.concluido ? 'bg-brand border-brand' : 'border-ink-muted/30'
              }`}
            >
              {item.concluido && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <button onClick={onDetalhes} className="text-left">
            <h4 className="text-[15px] font-semibold leading-tight">{ex.nome}</h4>
          </button>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {primarios.map(m => (
              <Pill key={m.musculoId} color="#fde2de">
                <span className="text-[11px]" style={{ color: 'var(--color-muscle)' }}>{m.musculo.nome}</span>
              </Pill>
            ))}
            <Pill color="var(--color-canvas)">
              <span className="text-[11px] text-ink-muted">{equipLabels[ex.equipamento]}</span>
            </Pill>
          </div>

          <div className="flex gap-3 mt-3 flex-wrap">
            <label className="flex flex-col gap-0.5">
              <span className="text-[11px] text-ink-muted">Séries</span>
              <input
                type="number"
                value={item.series}
                onChange={e => onUpdate({ series: +e.target.value || 1 })}
                className="w-[52px] h-[36px] text-center text-[14px] font-medium bg-canvas rounded-[var(--radius-btn)] card-border"
                min={1}
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[11px] text-ink-muted">Reps</span>
              <input
                type="text"
                value={item.reps}
                onChange={e => onUpdate({ reps: e.target.value })}
                className="w-[72px] h-[36px] text-center text-[14px] font-medium bg-canvas rounded-[var(--radius-btn)] card-border"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[11px] text-ink-muted">Carga (kg)</span>
              <input
                type="number"
                value={item.cargaKg ?? ''}
                onChange={e => onUpdate({ cargaKg: e.target.value ? +e.target.value : null })}
                placeholder="—"
                className="w-[72px] h-[36px] text-center text-[14px] font-medium bg-canvas rounded-[var(--radius-btn)] card-border"
                min={0}
                step={0.5}
              />
            </label>
          </div>

          <input
            type="text"
            value={item.notas}
            onChange={e => onUpdate({ notas: e.target.value })}
            placeholder="Notas..."
            className="mt-2 w-full h-[36px] px-3 text-[13px] text-ink-body bg-canvas rounded-[var(--radius-btn)] card-border"
          />

          <div className="flex gap-3 mt-2">
            <Link to={`/troca/${item.id}`} className="text-[13px] text-brand font-medium min-h-[36px] flex items-center">
              Trocar exercício
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Treino() {
  const { sessao, modoAtivo, load, iniciar, concluir, toggleItem, updateItem, reorder } = useTreinoStore();
  const [detalheId, setDetalheId] = useState<string | null>(null);

  useEffect(() => { load(); }, [load]);

  const fichas = repo.getFichas();
  const ficha = fichas.find(f => f.id === sessao.fichaModeloId);
  const concluidos = sessao.itens.filter(i => i.concluido).length;
  const total = sessao.itens.length;

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIdx = sessao.itens.findIndex(i => i.id === active.id);
      const newIdx = sessao.itens.findIndex(i => i.id === over.id);
      reorder(arrayMove(sessao.itens, oldIdx, newIdx));
    }
  };

  if (!total) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <h1 className="text-[24px] font-bold tracking-tight-title mb-4">Treino</h1>
        <Card>
          <EmptyState
            illustration={<AvatarMark accentColor="var(--color-science)" size={48}><StretchingPerson size={32} /></AvatarMark>}
            title="Nenhuma ficha criada"
            description="Seus treinos aparecerão aqui."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight-title">{ficha?.nome ?? 'Treino'}</h1>
        <p className="text-[14px] text-ink-body mt-1">
          {concluidos}/{total} exercícios {sessao.status === 'concluida' ? '— Concluído!' : ''}
        </p>
      </div>

      {modoAtivo && (
        <div className="card-border rounded-[var(--radius-card)] bg-muscle/5 p-3 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-muscle animate-pulse" />
          <span className="text-[14px] font-medium text-muscle">Treino em andamento</span>
        </div>
      )}

      <div className="w-full bg-canvas rounded-full h-2">
        <div
          className="bg-muscle rounded-full h-2 transition-all duration-200"
          style={{ width: `${total ? (concluidos / total) * 100 : 0}%` }}
        />
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sessao.itens.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {sessao.itens.map(item => (
              <SortableExercicio
                key={item.id}
                item={item}
                modoAtivo={modoAtivo}
                onToggle={() => toggleItem(item.id)}
                onUpdate={patch => updateItem(item.id, patch)}
                onDetalhes={() => setDetalheId(item.exercicioId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-3 mt-2">
        {sessao.status === 'pendente' && (
          <Button variant="primary" onClick={iniciar} className="flex-1">Iniciar treino</Button>
        )}
        {sessao.status === 'em_andamento' && (
          <Button variant="primary" onClick={concluir} className="flex-1">Concluir treino</Button>
        )}
      </div>

      {detalheId && <ExercicioDetalhes exercicioId={detalheId} onClose={() => setDetalheId(null)} />}
    </div>
  );
}
