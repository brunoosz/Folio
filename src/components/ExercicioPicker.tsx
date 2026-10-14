import { useMemo, useState } from 'react';
import { Sheet } from './ui/Sheet';
import { Icon } from './ui/Icon';
import { Pill } from './ui/Pill';
import { repo } from '../data/repository';
import { equipLabels } from '../data/catalogo';
import type { GrupoMuscularId } from '../data/types';

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Busca no catálogo por nome e grupo muscular. */
export function ExercicioPicker({
  open, onClose, onPick, titulo = 'Adicionar exercício', excluir = [],
}: { open: boolean; onClose: () => void; onPick: (exercicioId: string) => void; titulo?: string; excluir?: string[] }) {
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState<GrupoMuscularId | null>(null);

  const lista = useMemo(() => {
    const q = norm(busca.trim());
    const base = grupo ? repo.getExerciciosDoGrupo(grupo).filter(x => x.papel === 'primario').map(x => x.exercicio) : repo.getExercicios();
    return base
      .filter(e => !excluir.includes(e.id))
      .filter(e => !q || norm(`${e.nome} ${equipLabels[e.equipamento]}`).includes(q))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [busca, grupo, excluir]);

  return (
    <Sheet open={open} onClose={onClose} title={titulo}>
      <div className="flex flex-col gap-3 pb-2">
        <div className="relative">
          <label htmlFor="picker-busca" className="sr-only">Buscar exercício</label>
          <Icon name="search" size={20} color="var(--color-ink-body)" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="picker-busca"
            type="search"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome"
            autoComplete="off"
            className="w-full min-h-[48px] pl-11 pr-3 rounded-[var(--radius-btn)] bg-canvas card-border text-[15px] text-ink focus:bg-surface transition-colors duration-200"
          />
        </div>
        <div className="-mx-5 px-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por músculo">
          <Pill onClick={() => setGrupo(null)} selected={!grupo} className="shrink-0">Todos</Pill>
          {repo.getGrupos().map(g => (
            <Pill key={g.id} onClick={() => setGrupo(cur => (cur === g.id ? null : g.id))} selected={grupo === g.id} className="shrink-0">
              {g.nome}
            </Pill>
          ))}
        </div>
        <p className="text-[13px] text-ink-body tabular" aria-live="polite">{lista.length} exercícios</p>
        <ul className="flex flex-col divide-y divide-black/[0.06] -mx-1">
          {lista.map(ex => {
            const prim = repo.getMusculosDoExercicio(ex.id).filter(m => m.papel === 'primario').map(m => m.musculo.nome);
            return (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => { onPick(ex.id); onClose(); }}
                  className="pressable focus-ring w-full text-left min-h-[56px] px-1 py-2.5 flex items-center gap-3 rounded-[var(--radius-btn)] hover:bg-black/[0.03]"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium text-ink">{ex.nome}</span>
                    <span className="block text-[13px] text-ink-body truncate">{prim.join(', ')} · {equipLabels[ex.equipamento]}</span>
                  </span>
                  <Icon name="plus" size={20} color="var(--color-brand)" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
