import { useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { NumberInput } from '../components/ui/NumberInput';
import { Sheet } from '../components/ui/Sheet';
import { toast } from '../components/ui/Toast';
import { ExercicioPicker } from '../components/ExercicioPicker';
import { repo } from '../data/repository';
import { modelosFicha, instanciarModelo, siglaDaFicha } from '../data/seed';
import { diasCurtos } from '../hooks/useMinhaRotinaStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { getPerfil } from '../hooks/usePerfilStore';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { sugerirFichaIA } from '../lib/groq';
import { repsResumo } from '../lib/progressao';
import type { FichaModelo, FichaModeloItem } from '../data/types';

const novoId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Lista de fichas + criar (manual, modelo pronto ou IA). */
export function Fichas() {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<FichaModelo[]>(() => repo.getFichas());
  const [modelos, setModelos] = useState(false);
  const [iaAberta, setIaAberta] = useState(false);
  const [iaPedido, setIaPedido] = useState('');
  const [iaCarregando, setIaCarregando] = useState(false);
  const temIA = !!useSettingsStore(s => s.groqApiKey);
  const { groqApiKey, groqModel } = useSettingsStore();
  const sessaoFicha = useTreinoStore(s => s.sessao.fichaModeloId);

  const salvar = (lista: FichaModelo[]) => { repo.salvarFichas(lista); setFichas(lista); };

  const criarVazia = () => {
    const id = novoId('ficha');
    const nova: FichaModelo = { id, nome: `Treino ${String.fromCharCode(65 + fichas.length)}`, sigla: String.fromCharCode(65 + fichas.length), diaSemana: null, itens: [] };
    salvar([...fichas, nova]);
    navigate(`/fichas/${id}`);
  };

  const usarModelo = (modeloId: string, substituir: boolean) => {
    const m = modelosFicha.find(x => x.id === modeloId);
    if (!m) return;
    const novas = instanciarModelo(m, Date.now().toString(36));
    salvar(substituir ? novas : [...fichas, ...novas]);
    setModelos(false);
    toast.success(`Modelo "${m.nome}" adicionado`);
  };

  const gerarComIA = async () => {
    setIaCarregando(true);
    try {
      const fichasIA = await sugerirFichaIA(groqApiKey, groqModel, getPerfil(), iaPedido);
      const novas = fichasIA.map(f => {
        const id = novoId('ficha');
        return { ...f, id, itens: f.itens.map((it, i) => ({ ...it, id: `${id}_i${i}`, fichaId: id, ordem: i })) };
      });
      salvar([...fichas, ...novas]);
      setIaAberta(false);
      toast.success(`${novas.length} ${novas.length === 1 ? 'ficha criada' : 'fichas criadas'} pela IA. Revise antes de treinar.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível gerar a ficha.');
    } finally {
      setIaCarregando(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-3">
      <PageHeader title="Minhas fichas" subtitle="Modelos de treino que geram a sessão do dia" back className="!mb-1" />

      {fichas.length === 0 && (
        <Card animate>
          <EmptyState title="Nenhuma ficha ainda" description="Crie do zero, use um modelo pronto ou peça uma sugestão à IA." />
        </Card>
      )}

      {fichas.map((f, i) => (
        <Card key={f.id} interactive animate index={i} padding={16} onClick={() => navigate(`/fichas/${f.id}`)} aria-label={`Editar ${f.nome}`}>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-[var(--radius-btn)] bg-tint-danger text-muscle flex items-center justify-center text-[17px] font-bold shrink-0">{siglaDaFicha(f)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-ink truncate">{f.nome}</p>
              <p className="text-[13px] text-ink-body">
                {f.itens.length} exercícios · {f.diaSemana === null ? 'sem dia fixo' : diasCurtos[f.diaSemana]}
              </p>
            </div>
            {f.id === sessaoFicha && <Pill textColor="var(--color-brand)">Hoje</Pill>}
            <Icon name="chevron-right" size={20} color="var(--color-ink-body)" />
          </div>
        </Card>
      ))}

      <div className="flex flex-col gap-2 pt-2 anim-fade" style={{ animationDelay: '200ms' } as CSSProperties}>
        <Button variant="primary" icon="plus" fullWidth onClick={criarVazia}>Nova ficha</Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" icon="copy" onClick={() => setModelos(true)}>Modelos prontos</Button>
          <Button variant="ghost" icon="sparkle" onClick={() => (temIA ? setIaAberta(true) : toast.info('Configure a IA em Configurações para usar esta opção.'))}>
            Sugerir com IA
          </Button>
        </div>
      </div>

      <Sheet open={modelos} onClose={() => setModelos(false)} title="Modelos prontos">
        <div className="flex flex-col gap-3 pb-2">
          {modelosFicha.map(m => (
            <div key={m.id} className="rounded-[var(--radius-card)] card-border p-4">
              <p className="text-[15px] font-semibold text-ink">{m.nome}</p>
              <p className="text-[13px] text-ink-body mt-0.5">{m.descricao}</p>
              <p className="text-[13px] text-ink-body mt-1">{m.fichas.map(f => f.nome).join(' · ')}</p>
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm" onClick={() => usarModelo(m.id, false)}>Adicionar</Button>
                {fichas.length > 0 && <Button variant="text" size="sm" onClick={() => usarModelo(m.id, true)}>Substituir as atuais</Button>}
              </div>
            </div>
          ))}
          <p className="text-[13px] text-ink-body">Modelos genéricos. Ajuste com um profissional de Educação Física.</p>
        </div>
      </Sheet>

      <Sheet open={iaAberta} onClose={() => !iaCarregando && setIaAberta(false)} title="Sugerir ficha com IA">
        <div className="flex flex-col gap-3 pb-2">
          <p className="text-[14px] text-ink-body leading-relaxed">
            A IA monta uma proposta com os exercícios do catálogo, considerando seu perfil (objetivo, experiência, restrições e local de treino).
            É uma sugestão consultiva: revise e ajuste com um profissional.
          </p>
          <label htmlFor="ia-pedido" className="text-[14px] font-medium text-ink">Algo a considerar? (opcional)</label>
          <textarea
            id="ia-pedido"
            value={iaPedido}
            onChange={e => setIaPedido(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Ex.: 3 dias por semana, 45 minutos, foco em pernas"
            className="w-full px-3 py-2.5 rounded-[var(--radius-btn)] bg-canvas card-border text-[15px] text-ink focus:bg-surface transition-colors duration-200"
          />
          <Button variant="primary" icon="sparkle" loading={iaCarregando} fullWidth onClick={gerarComIA}>Gerar sugestão</Button>
        </div>
      </Sheet>
    </div>
  );
}

/* ---------------- Editor ---------------- */

export function FichaEditor() {
  const { fichaId } = useParams();
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<FichaModelo[]>(() => repo.getFichas());
  const [picker, setPicker] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const ficha = fichas.find(f => f.id === fichaId);

  if (!ficha) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <PageHeader title="Ficha" back backTo="/fichas" />
        <Card animate><EmptyState title="Ficha não encontrada" /></Card>
      </div>
    );
  }

  const atualizar = (fn: (f: FichaModelo) => FichaModelo) => {
    const lista = fichas.map(f => (f.id === ficha.id ? fn(f) : f));
    repo.salvarFichas(lista);
    setFichas(lista);
  };
  const atualizarItem = (id: string, patch: Partial<FichaModeloItem>) =>
    atualizar(f => ({ ...f, itens: f.itens.map(it => (it.id === id ? { ...it, ...patch } : it)) }));
  const mover = (id: string, dir: -1 | 1) => atualizar(f => {
    const itens = [...f.itens].sort((a, b) => a.ordem - b.ordem);
    const i = itens.findIndex(it => it.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= itens.length) return f;
    [itens[i], itens[j]] = [itens[j], itens[i]];
    return { ...f, itens: itens.map((it, k) => ({ ...it, ordem: k })) };
  });

  const itens = [...ficha.itens].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-3">
      <PageHeader title="Editar ficha" back backTo="/fichas" className="!mb-1"
        right={<IconButton icon="trash" label="Excluir ficha" onClick={() => setExcluir(true)} />} />

      <Card animate padding={16}>
        <label htmlFor="ficha-nome" className="text-[14px] text-ink-body">Nome</label>
        <input
          id="ficha-nome"
          value={ficha.nome}
          maxLength={60}
          onChange={e => atualizar(f => ({ ...f, nome: e.target.value }))}
          className="mt-1 w-full h-[48px] px-3 rounded-[var(--radius-btn)] bg-canvas card-border text-[16px] font-semibold text-ink focus:bg-surface transition-colors duration-200"
        />
        <div className="grid grid-cols-[88px_1fr] gap-3 mt-3 items-end">
          <div>
            <label htmlFor="ficha-sigla" className="text-[14px] text-ink-body">Sigla</label>
            <input
              id="ficha-sigla"
              value={ficha.sigla ?? ''}
              maxLength={2}
              onChange={e => atualizar(f => ({ ...f, sigla: e.target.value.toUpperCase() }))}
              className="mt-1 w-full h-[44px] px-3 text-center rounded-[var(--radius-btn)] bg-canvas card-border text-[16px] font-bold text-ink focus:bg-surface"
            />
          </div>
          <div>
            <p className="text-[14px] text-ink-body mb-1">Dia da semana</p>
            <div className="flex gap-1 flex-wrap">
              {diasCurtos.map((d, i) => (
                <button key={d} type="button" aria-pressed={ficha.diaSemana === i}
                  onClick={() => atualizar(f => ({ ...f, diaSemana: f.diaSemana === i ? null : i }))}
                  className={`pressable focus-ring w-10 h-[40px] rounded-[var(--radius-btn)] text-[12px] font-medium border ${
                    ficha.diaSemana === i ? 'bg-brand-ghost border-brand text-brand' : 'bg-surface border-black/[0.08] text-ink-body'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <h2 className="text-[16px] font-semibold text-ink mt-2 anim-fade">Exercícios ({itens.length})</h2>
      {itens.map((it, i) => {
        const ex = repo.getExercicio(it.exercicioId);
        const esquema = it.esquema ?? (ex?.isometrico ? 'fixo' : 'piramide');
        return (
          <Card key={it.id} animate index={i} padding={14}>
            <div className="flex items-start gap-2">
              <div className="flex flex-col -my-1 -ml-1">
                <IconButton icon="chevron-up" label="Subir" size={18} disabled={i === 0} onClick={() => mover(it.id, -1)} />
                <IconButton icon="chevron-down" label="Descer" size={18} disabled={i === itens.length - 1} onClick={() => mover(it.id, 1)} />
              </div>
              <div className="flex-1 min-w-0">
                <button type="button" onClick={() => navigate(`/exercicio/${it.exercicioId}`)} className="focus-ring text-left text-[15px] font-semibold text-ink hover:text-brand">
                  {ex?.nome ?? 'Exercício removido'}
                </button>
                <p className="text-[13px] text-ink-body tabular">{it.series} × {repsResumo(it.series, it.reps, esquema)}</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <NumberInput id={`s-${it.id}`} label="Séries" min={1} max={10} value={it.series}
                    onChange={v => v && atualizarItem(it.id, { series: Math.round(v) })} />
                  {esquema === 'fixo' ? (
                    <NumberInput id={`r-${it.id}`} label={ex?.isometrico ? 'Segundos' : 'Reps'} min={1} max={300}
                      value={parseInt(it.reps, 10) || 12} onChange={v => v && atualizarItem(it.id, { reps: String(Math.round(v)) })} />
                  ) : (
                    <div className="flex flex-col gap-1"><span className="text-[14px] text-ink-body">Reps</span><span className="h-[44px] flex items-center justify-center text-[15px] font-medium tabular">12/10/8</span></div>
                  )}
                  <NumberInput id={`d-${it.id}`} label="Descanso" unit="s" min={15} max={600} value={it.descansoSeg}
                    onChange={v => v && atualizarItem(it.id, { descansoSeg: Math.round(v) })} />
                </div>
                {!ex?.isometrico && (
                  <div className="flex gap-2 mt-2">
                    <Pill selected={esquema === 'piramide'} onClick={() => atualizarItem(it.id, { esquema: 'piramide', reps: '12/10/8' })}>Pirâmide</Pill>
                    <Pill selected={esquema === 'fixo'} onClick={() => atualizarItem(it.id, { esquema: 'fixo', reps: '12' })}>Fixas</Pill>
                  </div>
                )}
              </div>
              <IconButton icon="x" label={`Remover ${ex?.nome ?? 'exercício'}`} size={18}
                onClick={() => atualizar(f => ({ ...f, itens: f.itens.filter(x => x.id !== it.id).map((x, k) => ({ ...x, ordem: k })) }))} />
            </div>
          </Card>
        );
      })}

      <Button variant="ghost" icon="plus" fullWidth onClick={() => setPicker(true)}>Adicionar exercício</Button>
      <Button variant="primary" icon="check" fullWidth onClick={() => { toast.success('Ficha salva'); navigate('/fichas'); }}>Salvar ficha</Button>
      <p className="text-[13px] text-ink-body text-center">As mudanças valem a partir do próximo treino gerado por esta ficha.</p>

      <ExercicioPicker
        open={picker}
        onClose={() => setPicker(false)}
        excluir={ficha.itens.map(i => i.exercicioId)}
        onPick={exercicioId => {
          const iso = repo.getExercicio(exercicioId)?.isometrico;
          atualizar(f => ({
            ...f,
            itens: [...f.itens, {
              id: novoId(`${f.id}_i`), fichaId: f.id, exercicioId, ordem: f.itens.length, series: 3,
              reps: iso ? '30' : '12/10/8', descansoSeg: 90, notas: '', esquema: iso ? 'fixo' : 'piramide',
            }],
          }));
        }}
      />

      <Sheet open={excluir} onClose={() => setExcluir(false)} title="Excluir ficha?" variant="modal">
        <p className="text-[15px] text-ink-body leading-relaxed mb-5">O histórico de treinos continua salvo.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setExcluir(false)}>Cancelar</Button>
          <Button variant="danger" icon="trash" onClick={() => {
            const lista = fichas.filter(f => f.id !== ficha.id);
            repo.salvarFichas(lista);
            toast.success('Ficha excluída');
            navigate('/fichas', { replace: true });
          }}>Excluir</Button>
        </div>
      </Sheet>
    </div>
  );
}
