import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { MuscleMap, idsPorVista, type EstadoMusculo, type Vista } from '../components/MuscleMap';
import { repo } from '../data/repository';
import { equipLabels, papelLabels, papelColors } from '../data/catalogo';
import type { Equipamento, GrupoMuscularId, MusculoPapel } from '../data/types';

const ordemPapel: Record<MusculoPapel, number> = { primario: 0, secundario: 1, estabilizador: 2 };

export function Mapa() {
  const navigate = useNavigate();
  const [vista, setVista] = useState<Vista>('frente');
  const [grupo, setGrupo] = useState<GrupoMuscularId | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [equip, setEquip] = useState<Equipamento | null>(null);
  const [destaqueEx, setDestaqueEx] = useState<string | null>(null);

  const selecionar = useCallback((id: string) => {
    const m = repo.getMusculo(id);
    if (!m) return;
    setDestaqueEx(null);
    setGrupo(m.grupo);
    setSub(cur => (cur === id ? null : id));
  }, []);

  const escolherGrupo = (g: GrupoMuscularId) => {
    setDestaqueEx(null);
    setSub(null);
    setGrupo(cur => (cur === g ? null : g));
    // Mostra a vista onde o grupo aparece.
    const ids = repo.getMusculosDoGrupo(g).map(m => m.id);
    if (!ids.some(id => idsPorVista[vista].has(id))) setVista(vista === 'frente' ? 'costas' : 'frente');
  };

  const papeisDestaque = useMemo(() => {
    const mapa = new Map<string, MusculoPapel>();
    if (destaqueEx) repo.getMusculosDoExercicio(destaqueEx).forEach(m => mapa.set(m.musculoId, m.papel));
    return mapa;
  }, [destaqueEx]);

  const estado = useCallback((id: string): EstadoMusculo => {
    if (destaqueEx) {
      const p = papeisDestaque.get(id);
      return p === 'primario' ? 'selecionado' : p ? 'secundario' : 'normal';
    }
    if (sub === id) return 'selecionado';
    const m = repo.getMusculo(id);
    if (grupo && m?.grupo === grupo) return sub ? 'grupo' : 'selecionado';
    return 'normal';
  }, [destaqueEx, papeisDestaque, sub, grupo]);

  const nomeDe = useCallback((id: string) => repo.getMusculo(id)?.nome ?? id, []);

  const lista = useMemo(() => {
    if (!grupo) return [];
    const base = sub
      ? repo.getExerciciosDoMusculo(sub).map(x => ({ exercicio: x.exercicio, papel: x.papel }))
      : repo.getExerciciosDoGrupo(grupo).map(x => ({ exercicio: x.exercicio, papel: x.papel }));
    return base
      .filter(x => !equip || x.exercicio.equipamento === equip)
      .sort((a, b) => ordemPapel[a.papel] - ordemPapel[b.papel] || a.exercicio.nome.localeCompare(b.exercicio.nome, 'pt-BR'));
  }, [grupo, sub, equip]);

  const grupoInfo = grupo ? repo.getGrupo(grupo) : null;
  const subs = grupo ? repo.getMusculosDoGrupo(grupo) : [];
  const subInfo = sub ? repo.getMusculo(sub) : null;
  const equipsDisponiveis = useMemo(() => {
    if (!grupo) return [];
    const set = new Set(repo.getExerciciosDoGrupo(grupo).map(x => x.exercicio.equipamento));
    return (Object.keys(equipLabels) as Equipamento[]).filter(e => set.has(e));
  }, [grupo]);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Mapa muscular" subtitle="Toque em um músculo para ver os exercícios" className="!mb-0" />

      <div className="anim-fade flex items-center gap-3">
        <div role="radiogroup" aria-label="Vista" className="grid grid-cols-2 p-1 rounded-[var(--radius-btn)] bg-black/[0.05] gap-1 flex-1">
          {(['frente', 'costas'] as Vista[]).map(v => (
            <button key={v} type="button" role="radio" aria-checked={vista === v} onClick={() => setVista(v)}
              className={`pressable focus-ring min-h-[40px] rounded-[6px] text-[14px] font-medium transition-colors duration-200 ${vista === v ? 'bg-surface text-ink card-border' : 'text-ink-body'}`}>
              {v === 'frente' ? 'Frente' : 'Costas'}
            </button>
          ))}
        </div>
      </div>

      <Card animate padding={12} className="relative">
        <div key={vista} className="anim-scale mx-auto max-w-[270px]">
          <MuscleMap vista={vista} estado={estado} nomeDe={nomeDe} onSelect={selecionar} />
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-[12px] text-ink-body">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-muscle)' }} />{destaqueEx ? 'Primário' : 'Selecionado'}</span>
          {destaqueEx
            ? <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-muscle-secondary)' }} />Secundário / estabilizador</span>
            : <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-map-group)' }} />Mesmo grupo</span>}
        </div>
      </Card>

      <div className="anim-fade -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Grupos musculares">
        {repo.getGrupos().map(g => (
          <Pill key={g.id} onClick={() => escolherGrupo(g.id)} selected={grupo === g.id} className="shrink-0">{g.nome}</Pill>
        ))}
      </div>

      {!grupo ? (
        <Card animate>
          <EmptyState compact title="Escolha um músculo" description="Toque no boneco ou em um grupo acima. Dá para escolher partes específicas, como peito superior, médio ou inferior." />
        </Card>
      ) : (
        <Card key={`${grupo}-${sub}`} animate padding={16}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[18px] font-bold text-ink">{subInfo ? subInfo.nome : grupoInfo?.nome}</h2>
              {subInfo?.anatomico && <p className="text-[13px] text-ink-body">{subInfo.anatomico}</p>}
            </div>
            <span className="text-[13px] text-ink-body tabular mt-1">{lista.length} exercícios</span>
          </div>

          {subs.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Partes do músculo">
              <Pill onClick={() => setSub(null)} selected={!sub}>Todo o grupo</Pill>
              {subs.map(m => (
                <Pill key={m.id} onClick={() => { setDestaqueEx(null); setSub(cur => (cur === m.id ? null : m.id)); }} selected={sub === m.id}>
                  {m.nome.replace(`${grupoInfo?.nome} — `, '')}
                </Pill>
              ))}
            </div>
          )}

          {equipsDisponiveis.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label="Equipamento">
              {equipsDisponiveis.map(e => (
                <Pill key={e} icon="dumbbell" onClick={() => setEquip(cur => (cur === e ? null : e))} selected={equip === e}>{equipLabels[e]}</Pill>
              ))}
            </div>
          )}

          <ul className="flex flex-col mt-3 divide-y divide-black/[0.06]">
            {lista.map(({ exercicio, papel }, i) => (
              <li key={exercicio.id} className="anim-rise flex items-center gap-1" style={{ '--i': Math.min(i, 10) } as CSSProperties}>
                <button
                  type="button"
                  aria-pressed={destaqueEx === exercicio.id}
                  aria-label={`Destacar no mapa: ${exercicio.nome}`}
                  title="Destacar no mapa"
                  onClick={() => setDestaqueEx(cur => (cur === exercicio.id ? null : exercicio.id))}
                  className={`pressable focus-ring w-[40px] h-[44px] shrink-0 -ml-2 flex items-center justify-center rounded-full ${destaqueEx === exercicio.id ? 'text-muscle' : 'text-ink-body'}`}
                >
                  <Icon name="eye" size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/exercicio/${exercicio.id}`)}
                  className="focus-ring flex-1 min-w-0 min-h-[56px] py-2 flex items-center gap-2 text-left rounded-[var(--radius-btn)]"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium text-ink">{exercicio.nome}</span>
                    <span className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: papel === 'primario' ? 'var(--color-danger-ink)' : papel === 'secundario' ? 'var(--color-brand-ink)' : 'var(--color-warn-ink)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: papelColors[papel] }} />{papelLabels[papel]}
                      </span>
                      <span className="text-[12px] text-ink-body">· {equipLabels[exercicio.equipamento]}</span>
                    </span>
                  </span>
                  <Icon name="chevron-right" size={18} color="var(--color-ink-body)" />
                </button>
              </li>
            ))}
          </ul>
          {lista.length === 0 && <p className="text-[14px] text-ink-body mt-3">Nenhum exercício com esse filtro.</p>}
        </Card>
      )}

      <p className="text-[13px] text-ink-body text-center">Mapa ilustrativo. Os vínculos entre músculos e exercícios estão a revisar por profissional.</p>
    </div>
  );
}
