import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Button } from '../components/ui/Button';
import { repo } from '../data/repository';

const equipLabels: Record<string, string> = {
  barra_livre: 'Barra livre', maquina: 'Máquina', haltere: 'Halteres', cabo: 'Cabo', peso_corporal: 'Peso corporal',
};

interface MuscleRegion {
  id: string;
  label: string;
  path: string;
  side: 'front' | 'back';
}

const regions: MuscleRegion[] = [
  // Front
  { id: 'deltoide_anterior', label: 'Deltóide Ant.', side: 'front', path: 'M28,28 C24,30 22,36 24,40 L30,38 C32,34 30,30 28,28z M72,28 C76,30 78,36 76,40 L70,38 C68,34 70,30 72,28z' },
  { id: 'peitoral_maior', label: 'Peitoral', side: 'front', path: 'M34,34 C38,32 46,31 50,32 C54,31 62,32 66,34 L66,46 C62,50 54,52 50,52 C46,52 38,50 34,46z' },
  { id: 'biceps', label: 'Bíceps', side: 'front', path: 'M22,42 C20,48 20,56 22,62 L28,60 C28,54 28,48 28,42z M78,42 C80,48 80,56 78,62 L72,60 C72,54 72,48 72,42z' },
  { id: 'abdominais', label: 'Abdominais', side: 'front', path: 'M40,48 L60,48 L60,72 C56,74 52,75 50,75 C48,75 44,74 40,72z' },
  { id: 'obliquos', label: 'Oblíquos', side: 'front', path: 'M34,48 L40,48 L40,70 C38,68 36,64 34,60z M66,48 L60,48 L60,70 C62,68 64,64 66,60z' },
  { id: 'quadriceps', label: 'Quadríceps', side: 'front', path: 'M36,76 C38,82 38,94 40,104 L48,104 C48,94 48,86 50,76z M64,76 C62,82 62,94 60,104 L52,104 C52,94 52,86 50,76z' },
  { id: 'adutores', label: 'Adutores', side: 'front', path: 'M44,76 L50,76 L50,96 C48,94 46,90 44,86z M56,76 L50,76 L50,96 C52,94 54,90 56,86z' },
  { id: 'panturrilha', label: 'Panturrilha', side: 'front', path: 'M38,108 C40,114 40,122 40,128 L48,128 C48,122 46,114 44,108z M62,108 C60,114 60,122 60,128 L52,128 C52,122 54,114 56,108z' },

  // Back
  { id: 'trapezio', label: 'Trapézio', side: 'back', path: 'M40,24 L50,20 L60,24 L56,34 L50,36 L44,34z' },
  { id: 'deltoide_posterior', label: 'Deltóide Post.', side: 'back', path: 'M28,30 C24,32 22,38 24,42 L30,40 C32,36 30,32 28,30z M72,30 C76,32 78,38 76,42 L70,40 C68,36 70,32 72,30z' },
  { id: 'deltoide_lateral', label: 'Deltóide Lat.', side: 'back', path: 'M24,32 C22,34 21,38 22,40 L26,38z M76,32 C78,34 79,38 78,40 L74,38z' },
  { id: 'grande_dorsal', label: 'Grande Dorsal', side: 'back', path: 'M34,40 C38,38 46,37 50,38 C54,37 62,38 66,40 L66,58 C62,62 54,64 50,64 C46,64 38,62 34,58z' },
  { id: 'romboides', label: 'Rombóides', side: 'back', path: 'M42,34 L50,36 L58,34 L56,44 L50,46 L44,44z' },
  { id: 'triceps', label: 'Tríceps', side: 'back', path: 'M22,44 C20,50 20,58 22,64 L28,62 C28,56 28,50 28,44z M78,44 C80,50 80,58 78,64 L72,62 C72,56 72,50 72,44z' },
  { id: 'eretores_espinha', label: 'Eretores', side: 'back', path: 'M46,46 L50,48 L54,46 L54,70 L50,72 L46,70z' },
  { id: 'gluteos', label: 'Glúteos', side: 'back', path: 'M36,68 C40,66 46,65 50,66 C54,65 60,66 64,68 L64,80 C60,82 54,83 50,83 C46,83 40,82 36,80z' },
  { id: 'isquiotibiais', label: 'Isquiotibiais', side: 'back', path: 'M38,84 C40,90 40,100 42,108 L48,108 C48,100 48,92 50,84z M62,84 C60,90 60,100 58,108 L52,108 C52,100 52,92 50,84z' },
];

export function Mapa() {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');

  const exerciciosDoMusculo = selected ? repo.getExerciciosDoMusculo(selected) : [];
  const musculoInfo = selected ? repo.getMusculos().find(m => m.id === selected) : null;

  const currentRegions = regions.filter(r => r.side === view);

  const getColor = (regionId: string) => {
    if (!selected) return 'rgba(0,0,0,0.06)';
    if (regionId === selected) return 'var(--color-muscle)';
    const exIds = exerciciosDoMusculo.map(e => e.exercicioId);
    const relatedMuscles = new Set<string>();
    exIds.forEach(exId => {
      repo.getMusculosDoExercicio(exId).forEach(em => {
        if (em.papel === 'secundario') relatedMuscles.add(em.musculoId);
      });
    });
    if (relatedMuscles.has(regionId)) return 'var(--color-muscle-secondary)';
    return 'rgba(0,0,0,0.06)';
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Mapa muscular</h1>

      {/* View toggle */}
      <div className="flex bg-canvas rounded-[var(--radius-btn)] p-1 gap-1">
        <button
          onClick={() => setView('front')}
          className={`flex-1 py-2 text-[14px] font-medium rounded-[var(--radius-btn)] transition-colors duration-200 min-h-[44px] ${view === 'front' ? 'bg-surface card-border text-ink' : 'text-ink-muted'}`}
        >
          Frontal
        </button>
        <button
          onClick={() => setView('back')}
          className={`flex-1 py-2 text-[14px] font-medium rounded-[var(--radius-btn)] transition-colors duration-200 min-h-[44px] ${view === 'back' ? 'bg-surface card-border text-ink' : 'text-ink-muted'}`}
        >
          Dorsal
        </button>
      </div>

      {/* SVG Body */}
      <Card className="flex items-center justify-center">
        <svg viewBox="10 10 80 130" width="260" height="400" className="mx-auto">
          {/* Body outline */}
          <path
            d="M50,14 C44,14 40,18 40,22 C40,26 44,30 50,30 C56,30 60,26 60,22 C60,18 56,14 50,14z
               M50,30 C46,30 34,32 28,28 C22,34 20,40 20,46 C20,56 22,64 24,66
               L30,66 C30,60 32,52 34,48 L34,72 C34,74 36,76 36,76
               C36,82 36,104 38,110 C38,116 38,128 40,132 L48,132
               C48,126 48,114 48,108 C48,104 50,96 50,86
               C50,96 52,104 52,108 C52,114 52,126 52,132 L60,132
               C62,128 62,116 62,110 C64,104 64,82 64,76 C64,76 66,74 66,72
               L66,48 C68,52 70,60 70,66 L76,66
               C78,64 80,56 80,46 C80,40 78,34 72,28 C66,32 54,30 50,30z"
            fill="none"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="1"
          />

          {/* Muscle regions */}
          {currentRegions.map(region => (
            <path
              key={region.id}
              d={region.path}
              fill={getColor(region.id)}
              stroke={selected === region.id ? 'var(--color-muscle)' : 'rgba(0,0,0,0.08)'}
              strokeWidth={selected === region.id ? 1.5 : 0.5}
              className="cursor-pointer transition-all duration-200"
              onClick={() => setSelected(selected === region.id ? null : region.id)}
            >
              <title>{region.label}</title>
            </path>
          ))}
        </svg>
      </Card>

      {/* Muscle labels as pills */}
      <div className="flex flex-wrap gap-2">
        {currentRegions.map(region => (
          <button key={region.id} onClick={() => setSelected(selected === region.id ? null : region.id)}>
            <Pill
              color={selected === region.id ? '#fde2de' : 'var(--color-canvas)'}
              className={`cursor-pointer transition-colors duration-200 ${selected === region.id ? 'font-semibold' : ''}`}
            >
              {region.label}
            </Pill>
          </button>
        ))}
      </div>

      {/* Selected muscle detail */}
      {selected && musculoInfo && (
        <Card>
          <h3 className="text-[17px] font-bold mb-1">{musculoInfo.nome}</h3>
          <p className="text-[13px] text-ink-muted mb-3">{musculoInfo.grupo} · {musculoInfo.regiao}</p>

          {exerciciosDoMusculo.length === 0 ? (
            <p className="text-[14px] text-ink-body">Nenhum exercício cadastrado para este músculo.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <h4 className="text-[13px] text-ink-muted font-medium">EXERCÍCIOS ({exerciciosDoMusculo.length})</h4>
              {exerciciosDoMusculo.map(({ exercicio, papel }) => (
                <div key={exercicio.id} className="flex items-center justify-between py-2 border-b border-black/[0.05] last:border-0">
                  <div>
                    <span className="text-[14px] font-medium">{exercicio.nome}</span>
                    <div className="flex gap-1.5 mt-0.5">
                      <Pill color={papel === 'primario' ? '#fde2de' : papel === 'secundario' ? '#e0f0ff' : '#fff3d6'}>
                        <span className="text-[11px]">{papel}</span>
                      </Pill>
                      <span className="text-[12px] text-ink-muted">{equipLabels[exercicio.equipamento]}</span>
                    </div>
                  </div>
                  <Link to="/treino">
                    <Button variant="text" className="text-[13px]">Ver</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <p className="text-[12px] text-ink-muted text-center">
        Dados anatômicos simplificados, a revisar por profissional de Educação Física.
      </p>
    </div>
  );
}
