import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { NumberInput } from '../components/ui/NumberInput';
import { toast } from '../components/ui/Toast';
import { ExerciseFigure } from '../components/ExerciseFigure';
import { ProgressaoChart } from '../components/ProgressaoChart';
import { DescansoBar, useDescansoStore, fmtTempo } from '../components/Descanso';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { useHistoricoStore, logsAnteriores } from '../hooks/useHistoricoStore';
import { usePerfilStore, getPerfil, type Lesao } from '../hooks/usePerfilStore';
import { repo } from '../data/repository';
import { hojeLocal } from '../data/date';
import {
  equipLabels, posturaLabels, dificLabels, papelLabels, papelColors, articulacaoLabels, estresseLabels,
} from '../data/catalogo';
import {
  esquemaDe, garantirLog, sugerirCarga, pontoDaSessao, recordes, projecao, e1rm, type PontoCarga,
} from '../lib/progressao';
import type { Articulacao, Esforco, Exercicio, SerieLog, SessaoItem } from '../data/types';

const fmtKg = (n: number) => `${String(Math.round(n * 10) / 10).replace('.', ',')} kg`;

const ESFORCOS: { v: Esforco; t: string; dica: string }[] = [
  { v: 'leve', t: 'Leve', dica: 'Sobraram 3 ou mais repetições' },
  { v: 'limite', t: 'No limite', dica: 'Sobraram 1 ou 2 repetições' },
  { v: 'falha', t: 'Falha', dica: 'Não sobrou nenhuma' },
];

const LESAO_ARTICULACAO: Partial<Record<Lesao, Articulacao>> = { lombar: 'lombar', joelho: 'joelho', ombro: 'ombro', cotovelo: 'cotovelo' };

function linkVideo(nome: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nome} execução correta`)}`;
}

/* ---------------- Séries ---------------- */

function LinhaSerie({
  idx, serie, ex, sugestao, onChange, onFeita, bloqueado,
}: {
  idx: number; serie: SerieLog; ex: Exercicio; sugestao: ReturnType<typeof sugerirCarga>;
  onChange: (p: Partial<SerieLog>) => void; onFeita: () => void; bloqueado: boolean;
}) {
  const semCarga = ex.isometrico || ex.equipamento === 'peso_corporal';
  const iconeSug = sugestao.tipo === 'subir' ? 'chevron-up' : sugestao.tipo === 'reduzir' ? 'chevron-down' : 'target';
  return (
    <div
      className={`anim-rise rounded-[var(--radius-card)] border p-3 transition-colors duration-200 ${serie.feita ? 'bg-brand-ghost border-brand/30' : 'bg-surface border-black/[0.08]'}`}
      style={{ '--i': idx + 1 } as CSSProperties}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[15px] font-semibold text-ink">
          Série {idx + 1} <span className="font-normal text-ink-body">· {serie.alvo} {ex.isometrico ? 'segundos' : 'reps'}</span>
        </span>
        {serie.feita && <Pill icon="check" textColor="var(--color-brand)">Feita</Pill>}
      </div>

      <div className={`grid ${semCarga ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
        {!semCarga && (
          <NumberInput id={`carga-${idx}`} label="Carga" unit="kg" decimal max={1000} placeholder={sugestao.cargaKg ? String(sugestao.cargaKg).replace('.', ',') : '—'}
            value={serie.cargaKg} disabled={bloqueado} onChange={v => onChange({ cargaKg: v })} />
        )}
        <NumberInput id={`reps-${idx}`} label={ex.isometrico ? 'Segundos feitos' : 'Reps feitas'} max={300} placeholder={String(serie.alvo)}
          value={serie.reps} disabled={bloqueado} onChange={v => onChange({ reps: v === null ? null : Math.round(v) })} />
      </div>

      {!semCarga && sugestao.cargaKg !== null && serie.cargaKg !== sugestao.cargaKg && !bloqueado && (
        <button
          type="button"
          onClick={() => onChange({ cargaKg: sugestao.cargaKg })}
          className="pressable focus-ring mt-2 min-h-[36px] inline-flex items-center gap-1.5 px-2.5 rounded-[var(--radius-pill)] text-[13px] font-medium bg-canvas card-border text-ink"
          title={sugestao.texto}
        >
          <Icon name={iconeSug} size={14} color={sugestao.tipo === 'subir' ? 'var(--color-muscle)' : 'var(--color-science)'} strokeWidth={2.4} />
          Usar {fmtKg(sugestao.cargaKg)}
        </button>
      )}

      <div className="mt-3">
        <p className="text-[13px] text-ink-body mb-1.5">Como foi?</p>
        <div role="radiogroup" aria-label={`Esforço da série ${idx + 1}`} className="grid grid-cols-3 gap-1.5">
          {ESFORCOS.map(e => (
            <button
              key={e.v}
              type="button"
              role="radio"
              aria-checked={serie.esforco === e.v}
              title={e.dica}
              disabled={bloqueado}
              onClick={() => onChange({ esforco: serie.esforco === e.v ? null : e.v })}
              className={`pressable focus-ring min-h-[40px] rounded-[var(--radius-btn)] text-[13px] font-medium border transition-colors duration-200 disabled:opacity-50 ${
                serie.esforco === e.v
                  ? e.v === 'leve' ? 'bg-tint-ok border-ok text-ok' : e.v === 'limite' ? 'bg-tint-warn border-saffron text-warn-ink' : 'bg-tint-danger border-vermillion text-vermillion'
                  : 'bg-surface border-black/[0.08] text-ink-body'
              }`}
            >
              {e.t}
            </button>
          ))}
        </div>
      </div>

      {!bloqueado && (
        <Button variant={serie.feita ? 'text' : 'ghost'} size="sm" icon={serie.feita ? 'refresh' : 'check'} fullWidth className="mt-3" onClick={onFeita}>
          {serie.feita ? 'Desfazer' : 'Marcar série feita'}
        </Button>
      )}
    </div>
  );
}

/* ---------------- Página ---------------- */

export function ExercicioDetalhe() {
  const { itemId, exId } = useParams();
  const navigate = useNavigate();
  const { sessao, updateItem, atualizarSerie, iniciar, adicionarExercicio, toggleItem, removerItem, modo } = useTreinoStore();
  const historico = useHistoricoStore(s => s.sessoes);
  const perfilState = usePerfilStore();
  const iniciarDescanso = useDescansoStore(s => s.iniciar);
  const [playing, setPlaying] = useState(true);

  const item: SessaoItem | undefined = itemId ? sessao.itens.find(i => i.id === itemId) : undefined;
  const ex = repo.getExercicio(item?.exercicioId ?? exId ?? '');
  const perfil = useMemo(() => getPerfil(), [perfilState.atualizadoEm]); // eslint-disable-line react-hooks/exhaustive-deps

  const hoje = hojeLocal();
  const anteriores = useMemo(() => (ex ? logsAnteriores(historico, ex.id, hoje) : []), [historico, ex, hoje]);
  const log = item && ex ? garantirLog(item, ex) : [];

  const pontos: PontoCarga[] = useMemo(() => {
    const p = [...anteriores].reverse().map(a => pontoDaSessao(a.data, a.series)).filter((x): x is PontoCarga => !!x);
    const deHoje = pontoDaSessao(hoje, log.filter(s => s.feita));
    return deHoje ? [...p, deHoje] : p;
  }, [anteriores, log, hoje]);
  const rec = recordes(pontos);

  if (!ex) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <PageHeader title="Exercício" back />
        <Card animate><EmptyState title="Exercício não encontrado" description="Ele pode ter sido removido do treino de hoje." /></Card>
      </div>
    );
  }

  const musculos = repo.getMusculosDoExercicio(ex.id);
  const primarios = musculos.filter(m => m.papel === 'primario');
  const bloqueado = !item || sessao.status === 'concluida';
  const esquema = item ? esquemaDe(item, ex) : 'piramide';
  const semCarga = ex.isometrico || ex.equipamento === 'peso_corporal';

  const basePlanejada = pontos.length ? pontos[pontos.length - 1].carga12 : null;
  const proj = basePlanejada ? projecao(basePlanejada, perfil, 12) : [];

  const marcarFeita = (idx: number) => {
    if (!item) return;
    const s = log[idx];
    const feita = !s.feita;
    if (feita && sessao.status === 'pendente') { iniciar(); toast.info('Treino iniciado.'); }
    atualizarSerie(item.id, idx, { feita, reps: feita && s.reps === null ? s.alvo : s.reps });
    if (!feita) return;
    // Recorde?
    const reps = s.reps ?? s.alvo;
    if (s.cargaKg && rec && anteriores.length) {
      const anterioresPts = pontos.filter(p => p.data !== hoje);
      const maxCarga = Math.max(0, ...anterioresPts.map(p => p.cargaMax));
      const maxRm = Math.max(0, ...anterioresPts.map(p => p.rm));
      if (s.cargaKg > maxCarga) toast.success(`Novo recorde de carga: ${fmtKg(s.cargaKg)}!`);
      else if (e1rm(s.cargaKg, reps) > maxRm * 1.005) toast.success('Novo recorde de força estimada!');
    }
    if (idx < log.length - 1) iniciarDescanso(item.id, ex.nome, item.descansoSeg ?? 90);
    else toast.success('Exercício concluído!');
  };

  const lesoesRelacionadas = perfil.lesoes
    .map(l => LESAO_ARTICULACAO[l])
    .filter((a): a is Articulacao => !!a && ex.estresse[a] >= 1);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader
        title={ex.nome}
        subtitle={primarios.map(m => m.musculo.nome).join(' · ')}
        back
        className="!mb-0"
        right={item && !bloqueado ? <IconButton icon="swap" label="Trocar exercício" onClick={() => navigate(`/troca/${item.id}`)} /> : undefined}
      />

      <DescansoBar />

      {/* Boneco */}
      <Card animate padding={16}>
        <div className="flex justify-center -mt-1">
          <ExerciseFigure padrao={ex.padrao} postura={ex.postura} equipamento={ex.equipamento} playing={playing} size={250}
            label={`Animação: ${ex.nome}, ${posturaLabels[ex.postura].toLowerCase()}`} />
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center mt-1">
          <Pill icon="body">{posturaLabels[ex.postura]}</Pill>
          <Pill icon="dumbbell">{equipLabels[ex.equipamento]}</Pill>
          <Pill color={ex.dificuldade === 'avancado' ? 'var(--color-tint-danger)' : ex.dificuldade === 'intermediario' ? 'var(--color-tint-warn)' : undefined}>{dificLabels[ex.dificuldade]}</Pill>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="ghost" size="sm" icon={playing ? 'pause' : 'play'} onClick={() => setPlaying(p => !p)} className="flex-1">
            {playing ? 'Pausar' : 'Animar'}
          </Button>
          <a
            href={linkVideo(ex.nome)}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable focus-ring flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 rounded-[var(--radius-btn)] border border-brand/25 text-brand text-[14px] font-medium hover:bg-brand-ghost"
          >
            <Icon name="play" size={18} /> Ver vídeo
          </a>
        </div>
      </Card>

      {lesoesRelacionadas.length > 0 && (
        <Card animate accent="var(--color-tint-warn)" padding={16}>
          <p className="text-[14px] text-ink-body leading-relaxed flex gap-2">
            <Icon name="warning" size={18} color="var(--color-warn-ink)" className="mt-0.5" />
            Você indicou restrição em {lesoesRelacionadas.map(a => articulacaoLabels[a].toLowerCase()).join(' e ')}. Este exercício exige essa região:
            considere uma alternativa e consulte um profissional.
          </p>
        </Card>
      )}

      {/* Séries */}
      {item && (
        <Card animate index={1} padding={16}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="text-[17px] font-semibold text-ink">Séries</h2>
            {!bloqueado && (
              <div className="flex items-center gap-1" aria-label="Número de séries">
                <IconButton icon="minus" label="Remover série" size={18} disabled={item.series <= 1}
                  onClick={() => updateItem(item.id, { series: item.series - 1 })} />
                <span className="w-6 text-center text-[16px] font-semibold tabular">{item.series}</span>
                <IconButton icon="plus" label="Adicionar série" size={18} disabled={item.series >= 10}
                  onClick={() => updateItem(item.id, { series: item.series + 1 })} />
              </div>
            )}
          </div>

          {!ex.isometrico && !bloqueado && (
            <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="Esquema de repetições">
              <Pill selected={esquema === 'piramide'} onClick={() => updateItem(item.id, { esquema: 'piramide', reps: '12/10/8' })}>Pirâmide 12/10/8</Pill>
              <Pill selected={esquema === 'fixo'} onClick={() => updateItem(item.id, { esquema: 'fixo', reps: String(log[0]?.alvo ?? 12) })}>Repetições fixas</Pill>
              {esquema === 'fixo' && (
                <div className="w-24">
                  <NumberInput id="reps-fixas" label="Repetições" hideLabel unit="reps" min={1} max={100}
                    value={log[0]?.alvo ?? 12} onChange={v => v && updateItem(item.id, { reps: String(Math.round(v)) })} />
                </div>
              )}
            </div>
          )}

          <p className="text-[13px] text-ink-body mb-3 flex gap-1.5">
            <Icon name="info" size={15} className="mt-0.5" />
            {modo === 'padrao' ? 'Modo "Salvar como padrão": séries e repetições também vão para a ficha.' : 'Alterações valem só para hoje.'}
          </p>

          <div className="flex flex-col gap-2.5">
            {log.map((s, i) => (
              <LinhaSerie
                key={i}
                idx={i}
                serie={s}
                ex={ex}
                bloqueado={bloqueado}
                sugestao={sugerirCarga(ex, i, s.alvo, anteriores.map(a => a.series), log, perfil)}
                onChange={p => atualizarSerie(item.id, i, p)}
                onFeita={() => marcarFeita(i)}
              />
            ))}
          </div>

          {!bloqueado && (
            <div className="flex items-center justify-between gap-2 mt-3">
              <span className="text-[14px] text-ink-body">Descanso entre séries</span>
              <div className="flex items-center gap-1">
                <IconButton icon="minus" label="Menos 15 segundos" size={18} onClick={() => updateItem(item.id, { descansoSeg: Math.max(15, (item.descansoSeg ?? 90) - 15) })} />
                <span className="w-12 text-center text-[15px] font-semibold tabular">{fmtTempo(item.descansoSeg ?? 90)}</span>
                <IconButton icon="plus" label="Mais 15 segundos" size={18} onClick={() => updateItem(item.id, { descansoSeg: Math.min(600, (item.descansoSeg ?? 90) + 15) })} />
              </div>
            </div>
          )}

          <label htmlFor="notas-item" className="sr-only">Notas</label>
          <input
            id="notas-item"
            type="text"
            value={item.notas}
            disabled={bloqueado}
            onChange={e => updateItem(item.id, { notas: e.target.value })}
            placeholder="Notas (ajuste do banco, pegada…)"
            className="mt-3 w-full h-[44px] px-3 text-[14px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface transition-colors duration-200 disabled:opacity-60"
          />
        </Card>
      )}

      {/* Progressão */}
      {!semCarga && (
        <Card animate index={2} padding={16}>
          <h2 className="text-[17px] font-semibold text-ink">Progressão de carga</h2>
          <p className="text-[13px] text-ink-body mt-0.5 mb-3">Carga estimada para 12 repetições</p>
          {pontos.length ? (
            <>
              <ProgressaoChart reais={pontos.slice(-10)} projecao={proj} />
              {rec && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="rounded-[var(--radius-btn)] bg-canvas p-3">
                    <p className="text-[12px] text-ink-body flex items-center gap-1"><Icon name="trophy" size={14} color="var(--color-routine)" /> Maior carga</p>
                    <p className="text-[18px] font-bold tabular">{fmtKg(rec.cargaMax)}</p>
                  </div>
                  <div className="rounded-[var(--radius-btn)] bg-canvas p-3">
                    <p className="text-[12px] text-ink-body flex items-center gap-1"><Icon name="flame" size={14} color="var(--color-muscle)" /> 1RM estimado</p>
                    <p className="text-[18px] font-bold tabular">{fmtKg(rec.rm)}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-[14px] text-ink-body leading-relaxed">
              Anote carga e repetições das séries para ver aqui a evolução e a projeção
              {perfil.experiencia || perfil.idade ? ' (calculada com seu perfil)' : ''}.
            </p>
          )}
          <details className="mt-3 group">
            <summary className="cursor-pointer text-[14px] font-medium text-brand min-h-[36px] flex items-center gap-1 list-none">
              <Icon name="chevron-down" size={16} className="transition-transform duration-200 group-open:rotate-180" /> Como funciona
            </summary>
            <p className="text-[14px] text-ink-body leading-relaxed mt-1">
              Faça 12 repetições com uma carga, 10 com uma carga maior e 8 com uma maior ainda, levando cada série perto da falha.
              Marque "Leve" quando sobrarem 3 ou mais repetições: na próxima vez o Folio sugere subir a carga daquela série.
              A projeção usa sua experiência e idade para estimar um ritmo típico de evolução. É uma referência, não uma meta.
            </p>
          </details>
        </Card>
      )}

      {/* Ficha técnica */}
      <Card animate index={3} padding={16}>
        <h2 className="text-[17px] font-semibold text-ink mb-3">Como executar</h2>
        <ol className="flex flex-col gap-2.5">
          {ex.execucao.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-ghost text-brand text-[13px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-[15px] text-ink leading-relaxed">{p}</span>
            </li>
          ))}
        </ol>

        <h3 className="text-[15px] font-semibold text-ink mt-5 mb-2">Músculos</h3>
        <ul className="flex flex-col gap-1.5">
          {musculos.map(m => (
            <li key={m.musculoId} className="flex items-center gap-2 text-[14px]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: papelColors[m.papel] }} aria-hidden />
              <span className="text-ink">{m.musculo.nome}</span>
              <span className="text-ink-body">· {papelLabels[m.papel]}</span>
            </li>
          ))}
        </ul>

        <h3 className="text-[15px] font-semibold text-ink mt-5 mb-2">Exigência articular</h3>
        <div className="flex flex-col gap-2">
          {(Object.keys(articulacaoLabels) as Articulacao[]).map(a => (
            <div key={a} className="flex items-center gap-3">
              <span className="text-[14px] text-ink w-[140px] shrink-0">{articulacaoLabels[a]}</span>
              <div className="flex gap-1 flex-1" aria-hidden>
                {[0, 1, 2].map(n => (
                  <span key={n} className="h-2 flex-1 rounded-full" style={{
                    background: n <= ex.estresse[a] ? (ex.estresse[a] === 2 ? 'var(--color-vermillion)' : ex.estresse[a] === 1 ? 'var(--color-routine)' : 'var(--color-ok)') : 'rgba(0,0,0,0.07)',
                  }} />
                ))}
              </div>
              <span className="text-[13px] text-ink-body w-[64px] text-right">{estresseLabels[ex.estresse[a]]}</span>
            </div>
          ))}
        </div>

        <h3 className="text-[15px] font-semibold text-ink mt-5 mb-1 flex items-center gap-1.5">
          <Icon name="shield" size={18} color="var(--color-science)" /> Cuidados
        </h3>
        <p className="text-[14px] text-ink-body leading-relaxed">{ex.notasSeguranca}</p>
        {!ex.revisado && (
          <p className="text-[13px] text-ink-body italic mt-2">Conteúdo a revisar por profissional de Educação Física ou fisioterapia.</p>
        )}
      </Card>

      {item && sessao.status === 'em_andamento' && (
        <Button variant="primary" icon={item.concluido ? 'refresh' : 'check'} fullWidth onClick={() => { toggleItem(item.id); if (!item.concluido) navigate(-1); }}>
          {item.concluido ? 'Reabrir exercício' : 'Concluir exercício'}
        </Button>
      )}
      {item && sessao.status === 'pendente' && (
        <Button variant="text" icon="trash" fullWidth className="!text-vermillion" onClick={() => { removerItem(item.id); toast.success('Removido do treino'); navigate(-1); }}>
          Remover do treino {modo === 'padrao' ? 'e da ficha' : 'de hoje'}
        </Button>
      )}
      {!item && sessao.status !== 'concluida' && (
        <Button variant="primary" icon="plus" fullWidth onClick={() => { adicionarExercicio(ex.id); toast.success('Adicionado ao treino de hoje'); navigate('/treino'); }}>
          Adicionar ao treino de hoje
        </Button>
      )}
    </div>
  );
}
