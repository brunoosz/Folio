import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { HeartPulse } from '../components/illustrations';
import { repo } from '../data/repository';
import { ExercicioDetalhesSheet } from './Treino';

const equipLabels: Record<string, string> = {
  barra_livre: 'Barra livre', maquina: 'Máquina', haltere: 'Halteres', cabo: 'Cabo', peso_corporal: 'Peso corporal',
};

const grupoLabels: Record<string, string> = {
  pernas: 'Pernas', peito: 'Peito', ombros: 'Ombros', costas: 'Costas', bracos: 'Braços', core: 'Core',
};

const papelInfo: Record<string, { label: string; bg: string }> = {
  primario: { label: 'Primário', bg: '#fde2de' },
  secundario: { label: 'Secundário', bg: '#e0f0ff' },
  estabilizador: { label: 'Estabilizador', bg: '#fff3d6' },
};

const ordemPapel: Record<string, number> = { primario: 0, secundario: 1, estabilizador: 2 };

const NEUTRO = 'rgba(0,0,0,0.06)';
const HOVER = 'rgba(246,73,50,0.28)';

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
  const [hovered, setHovered] = useState<string | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const exerciciosDoMusculo = useMemo(
    () => (selected ? [...repo.getExerciciosDoMusculo(selected)].sort((a, b) => ordemPapel[a.papel] - ordemPapel[b.papel]) : []),
    [selected],
  );
  const musculoInfo = selected ? repo.getMusculos().find(m => m.id === selected) : null;

  /** Músculos secundários nos exercícios que treinam o músculo selecionado. */
  const relacionados = useMemo(() => {
    const set = new Set<string>();
    exerciciosDoMusculo.forEach(({ exercicioId }) => {
      repo.getMusculosDoExercicio(exercicioId).forEach(em => {
        if (em.papel === 'secundario' && em.musculoId !== selected) set.add(em.musculoId);
      });
    });
    return set;
  }, [exerciciosDoMusculo, selected]);

  const currentRegions = regions.filter(r => r.side === view);
  const selectedNaVista = !!selected && currentRegions.some(r => r.id === selected);

  const getColor = (regionId: string) => {
    if (regionId === selected) return 'var(--color-muscle)';
    if (selected && relacionados.has(regionId)) return 'var(--color-muscle-secondary)';
    if (regionId === hovered) return HOVER;
    return NEUTRO;
  };

  const alternar = (id: string) => setSelected(s => (s === id ? null : id));

  const trocarVista = (v: 'front' | 'back') => {
    setView(v);
    setHovered(null);
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Mapa muscular" subtitle="Toque em um músculo para ver os exercícios" className="!mb-0" />

      {/* Alternar vista */}
      <div className="anim-fade relative flex bg-black/[0.05] rounded-[var(--radius-btn)] p-1" role="group" aria-label="Vista do corpo">
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-surface card-border rounded-[calc(var(--radius-btn)-2px)] transition-transform duration-200 ease-out"
          style={{ transform: view === 'back' ? 'translateX(100%)' : 'none' }}
        />
        {(['front', 'back'] as const).map(v => (
          <button
            key={v}
            type="button"
            onClick={() => trocarVista(v)}
            aria-pressed={view === v}
            className={`relative z-[1] flex-1 text-[14px] font-medium rounded-[var(--radius-btn)] transition-colors duration-200 min-h-[44px] focus-ring ${
              view === v ? 'text-ink' : 'text-ink-body hover:text-ink'
            }`}
          >
            {v === 'front' ? 'Frontal' : 'Dorsal'}
          </button>
        ))}
      </div>

      {/* Corpo */}
      <Card animate index={1} className="flex flex-col items-center justify-center">
        <svg
          key={view}
          viewBox="10 10 80 130"
          width="260"
          height="400"
          className="mx-auto max-w-full h-auto anim-fade"
          role="group"
          aria-label={view === 'front' ? 'Corpo, vista frontal' : 'Corpo, vista dorsal'}
          onPointerLeave={() => setHovered(null)}
        >
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
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1"
            pointerEvents="none"
          />

          {currentRegions.map(region => {
            const ativo = selected === region.id;
            return (
              <path
                key={region.id}
                d={region.path}
                fill={getColor(region.id)}
                stroke={ativo || hovered === region.id ? 'var(--color-muscle)' : 'rgba(0,0,0,0.12)'}
                strokeWidth={ativo ? 1.5 : 0.6}
                role="button"
                tabIndex={0}
                aria-label={region.label}
                aria-pressed={ativo}
                className="cursor-pointer outline-none focus-visible:[stroke:var(--color-brand)] focus-visible:[stroke-width:1.5]"
                style={{ transition: 'fill 200ms ease, stroke 200ms ease, stroke-width 200ms ease' }}
                onPointerEnter={() => setHovered(region.id)}
                onPointerLeave={() => setHovered(h => (h === region.id ? null : h))}
                onFocus={() => setHovered(region.id)}
                onBlur={() => setHovered(null)}
                onClick={() => alternar(region.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(region.id); }
                }}
              >
                <title>{region.label}</title>
              </path>
            );
          })}
        </svg>

        <div className="flex items-center gap-4 mt-2 text-[13px] text-ink-body" aria-hidden>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muscle" /> Selecionado</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muscle-secondary" /> Secundário relacionado</span>
        </div>
      </Card>

      {/* Rótulos */}
      <div className="stagger flex flex-wrap gap-2" key={`pills-${view}`}>
        {currentRegions.map(region => {
          const ativo = selected === region.id;
          return (
            <Pill
              key={region.id}
              onClick={() => alternar(region.id)}
              selected={ativo}
              color={ativo ? '#fde2de' : undefined}
              className={ativo ? 'font-semibold' : ''}
            >
              <span
                onPointerEnter={() => setHovered(region.id)}
                onPointerLeave={() => setHovered(null)}
              >
                {region.label}
              </span>
            </Pill>
          );
        })}
      </div>

      {/* Detalhe do músculo */}
      {selected && musculoInfo ? (
        <Card key={selected} animate>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-[17px] font-bold">{musculoInfo.nome}</h3>
              <p className="text-[14px] text-ink-body">
                {grupoLabels[musculoInfo.grupo] ?? musculoInfo.grupo} · {musculoInfo.regiao === 'anterior' ? 'Anterior' : 'Posterior'}
                {!selectedNaVista && ' · na outra vista'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Limpar seleção"
              className="pressable focus-ring -mr-2 -mt-2 w-[44px] h-[44px] rounded-full flex items-center justify-center text-ink-body hover:bg-black/[0.05]"
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          {exerciciosDoMusculo.length === 0 ? (
            <p className="text-[14px] text-ink-body">Nenhum exercício cadastrado para este músculo.</p>
          ) : (
            <div className="flex flex-col">
              <h4 className="text-[13px] text-ink-body font-semibold tracking-wide mb-1">EXERCÍCIOS ({exerciciosDoMusculo.length})</h4>
              <ul className="stagger flex flex-col">
                {exerciciosDoMusculo.map(({ exercicio, papel }) => (
                  <li key={exercicio.id} className="border-b border-black/[0.06] last:border-0">
                    <button
                      type="button"
                      onClick={() => setDetalheId(exercicio.id)}
                      className="pressable-soft focus-ring w-full min-h-[56px] py-2 flex items-center justify-between gap-3 text-left rounded-[var(--radius-btn)] hover:bg-black/[0.02]"
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium text-ink">{exercicio.nome}</span>
                        <span className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Pill color={papelInfo[papel].bg}>{papelInfo[papel].label}</Pill>
                          <span className="text-[13px] text-ink-body">{equipLabels[exercicio.equipamento]}</span>
                        </span>
                      </span>
                      <Icon name="chevron-right" size={20} className="text-ink-body shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ) : (
        <Card animate index={2} padding={8}>
          <EmptyState
            compact
            illustration={<HeartPulse size={40} />}
            title="Nenhum músculo selecionado"
            description="Toque em uma região do corpo ou em um nome acima."
          />
        </Card>
      )}

      <p className="text-[13px] text-ink-body text-center">
        Dados anatômicos simplificados, a revisar por profissional de Educação Física.
      </p>

      <ExercicioDetalhesSheet exercicioId={detalheId} onClose={() => setDetalheId(null)} />
    </div>
  );
}
