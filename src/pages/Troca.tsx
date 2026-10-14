import { useMemo, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { repo } from '../data/repository';
import { comparativos } from '../data/comparativos';
import { equipLabels, dificLabels, articulacaoLabels, estresseLabels } from '../data/catalogo';
import { usePerfilStore, type Lesao } from '../hooks/usePerfilStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { sugerirTrocaIA, GroqError } from '../lib/groq';
import { contextoUsuario } from '../lib/contexto';
import type { Articulacao, Equipamento, Exercicio } from '../data/types';

const LESAO_ARTICULACAO: Partial<Record<Lesao, Articulacao>> = { lombar: 'lombar', joelho: 'joelho', ombro: 'ombro', cotovelo: 'cotovelo', quadril: 'lombar' };
const ARTICULACOES: Articulacao[] = ['lombar', 'joelho', 'ombro', 'cotovelo'];
const corEstresse = ['var(--color-ok)', 'var(--color-warn-ink)', 'var(--color-vermillion)'];

const dificColors: Record<string, string> = {
  basico: '#e6f3fe', intermediario: 'var(--color-tint-warn)', avancado: 'var(--color-tint-danger)',
};

const equipOptions: { value: Equipamento | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'maquina', label: 'Máquinas' },
  { value: 'haltere', label: 'Halteres' },
  { value: 'cabo', label: 'Cabos' },
  { value: 'barra_livre', label: 'Barra livre' },
  { value: 'peso_corporal', label: 'Peso corporal' },
];

type Escopo = 'hoje' | 'padrao';

export function Troca() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const sessao = useTreinoStore(s => s.sessao);
  const trocarExercicio = useTreinoStore(s => s.trocarExercicio);
  const [filtroEquip, setFiltroEquip] = useState<Equipamento | 'todos'>('todos');
  const [altId, setAltId] = useState<string | null>(null);
  const [escopo, setEscopo] = useState<Escopo>('hoje');
  const lesoes = usePerfilStore(s => s.lesoes);
  const [protecao, setProtecao] = useState<Articulacao[]>(() =>
    [...new Set(lesoes.map(l => LESAO_ARTICULACAO[l]).filter((a): a is Articulacao => !!a))]);
  const { groqApiKey, groqModel } = useSettingsStore();
  const [ia, setIa] = useState<{ estado: 'idle' | 'carregando' | 'ok' | 'erro'; texto: string }>({ estado: 'idle', texto: '' });

  const item = sessao.itens.find(i => i.id === itemId);
  const exAtual = item ? repo.getExercicio(item.exercicioId) : undefined;

  const dados = useMemo(() => {
    if (!exAtual) return null;
    const musculosAtuais = repo.getMusculosDoExercicio(exAtual.id);
    const primarios = musculosAtuais.filter(m => m.papel === 'primario');
    const secundarios = musculosAtuais.filter(m => m.papel === 'secundario');
    const primarioIds = new Set(primarios.map(m => m.musculoId));
    const gruposPrim = new Set(primarios.map(m => m.musculo.grupo));
    // Mesmo grupo muscular primário; mais sub-regiões em comum = mais parecido.
    const candidatas = repo.getExercicios()
      .filter(ex => ex.id !== exAtual.id)
      .map(ex => {
        const prim = repo.getMusculosDoExercicio(ex.id).filter(m => m.papel === 'primario');
        const subs = prim.filter(m => primarioIds.has(m.musculoId)).length;
        const grupos = new Set(prim.filter(m => gruposPrim.has(m.musculo.grupo)).map(m => m.musculo.grupo)).size;
        return { ex, score: subs * 3 + grupos * 2 };
      })
      .filter(x => x.score >= 2)
      .sort((a, b) => b.score - a.score || a.ex.nome.localeCompare(b.ex.nome, 'pt-BR'))
      .map(x => x.ex);
    return { primarios, secundarios, candidatas };
  }, [exAtual]);

  // Item inexistente (sessão virou o dia, link antigo) ou treino já concluído.
  if (!item || !exAtual || !dados) return <Navigate to="/treino" replace />;
  if (sessao.status === 'concluida') return <Navigate to="/treino" replace />;

  const { primarios, secundarios, candidatas } = dados;
  const protege = (ex: Exercicio) => protecao.every(a => ex.estresse[a] === 0 || ex.estresse[a] < exAtual.estresse[a]);
  const alternativas = candidatas
    .filter(ex => filtroEquip === 'todos' || ex.equipamento === filtroEquip)
    .filter(protege);

  const pedirIA = async () => {
    setIa({ estado: 'carregando', texto: '' });
    try {
      const contexto = [contextoUsuario(), protecao.length ? `quer poupar: ${protecao.map(a => articulacaoLabels[a].toLowerCase()).join(', ')}` : ''].filter(Boolean).join('; ');
      const texto = await sugerirTrocaIA(groqApiKey, groqModel, exAtual, alternativas.length ? alternativas : candidatas, contexto);
      setIa({ estado: 'ok', texto });
    } catch (e) {
      setIa({ estado: 'erro', texto: e instanceof GroqError ? e.message : 'Não foi possível consultar a IA agora.' });
    }
  };
  const noTreino = new Set(sessao.itens.map(i => i.exercicioId));
  const altSelecionada = altId ? repo.getExercicio(altId) : undefined;

  const abrirConfirmacao = (id: string) => {
    setEscopo('hoje');
    setAltId(id);
  };

  const handleConfirmar = () => {
    if (!altId) return;
    trocarExercicio(item.id, altId, escopo);
    toast.success(escopo === 'padrao' ? 'Exercício trocado e ficha padrão atualizada' : 'Exercício trocado no treino de hoje');
    setAltId(null);
    navigate('/treino', { replace: true });
  };

  const escopoOpcoes: { value: Escopo; titulo: string; desc: string }[] = [
    { value: 'hoje', titulo: 'Apenas no treino de hoje', desc: 'A ficha padrão continua igual nas próximas semanas.' },
    { value: 'padrao', titulo: 'Atualizar na ficha padrão', desc: 'Hoje e nos próximos treinos desta ficha.' },
  ];

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Trocar exercício" subtitle="Escolha uma alternativa para hoje" back backTo="/treino" className="!mb-0" />

      {/* Exercício atual */}
      <Card animate index={0}>
        <p className="text-[13px] text-ink-body font-semibold tracking-wide mb-2">EXERCÍCIO ATUAL</p>
        <h2 className="text-[17px] font-bold">{exAtual.nome}</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          {primarios.length > 0 && (
            <Pill color="var(--color-tint-danger)" icon="target">{primarios.map(m => m.musculo.nome).join(', ')}</Pill>
          )}
          <Pill color="var(--color-brand-ghost)" icon="dumbbell">{equipLabels[exAtual.equipamento]}</Pill>
        </div>
        {secundarios.length > 0 && (
          <p className="text-[14px] text-ink-body mt-2">
            Secundários: {secundarios.map(m => m.musculo.nome).join(', ')}
          </p>
        )}
      </Card>

      {/* Aviso de não-equivalência */}
      <Card accent="var(--color-tint-warn)" animate index={1} role="note">
        <div className="flex gap-3">
          <Icon name="warning" size={22} color="var(--color-saffron)" className="mt-0.5" />
          <div>
            <h3 className="text-[14px] font-semibold text-ink mb-1">Exercícios diferentes não são equivalentes</h3>
            <p className="text-[14px] text-ink-body leading-relaxed">
              Cada exercício tem padrão de movimento, recrutamento muscular e demanda articular próprios. A troca pode alterar o estímulo do treino. Consulte um profissional de Educação Física para ajustes individualizados.
            </p>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <section className="anim-rise" style={{ '--i': 2 } as CSSProperties} aria-labelledby="troca-filtro">
        <h3 id="troca-filtro" className="text-[13px] text-ink-body font-semibold tracking-wide mb-2 flex items-center gap-1.5">
          <Icon name="filter" size={16} /> FILTRAR POR EQUIPAMENTO
        </h3>
        <div className="flex gap-2 flex-wrap">
          {equipOptions.map(opt => (
            <Pill
              key={opt.value}
              selected={filtroEquip === opt.value}
              color={filtroEquip === opt.value ? undefined : 'var(--color-surface)'}
              onClick={() => setFiltroEquip(opt.value)}
              className={filtroEquip === opt.value ? '' : 'card-border'}
            >
              {opt.label}
            </Pill>
          ))}
        </div>
      </section>

      <section className="anim-rise" style={{ '--i': 3 } as CSSProperties} aria-labelledby="troca-protecao">
        <h3 id="troca-protecao" className="text-[13px] text-ink-body font-semibold tracking-wide mb-2 flex items-center gap-1.5">
          <Icon name="shield" size={16} /> PROTEÇÃO ARTICULAR
        </h3>
        <div className="flex gap-2 flex-wrap">
          {ARTICULACOES.map(a => (
            <Pill key={a} icon={protecao.includes(a) ? 'check' : undefined} selected={protecao.includes(a)}
              onClick={() => setProtecao(cur => (cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a]))}>
              Menos {articulacaoLabels[a].toLowerCase()}
            </Pill>
          ))}
        </div>
        {lesoes.length > 0 && (
          <p className="text-[13px] text-ink-body mt-2">Pré-selecionado pelas restrições do seu perfil.</p>
        )}
      </section>

      {/* Alternativas */}
      <h3 className="text-[13px] text-ink-body font-semibold tracking-wide" aria-live="polite">
        ALTERNATIVAS ({alternativas.length})
      </h3>

      {alternativas.length === 0 ? (
        <Card animate>
          <EmptyState
            compact
            illustration={<Icon name="search" size={40} color="var(--color-ink-body)" />}
            title="Nenhuma alternativa com este filtro"
            description="Tente outro equipamento ou volte para “Todos”."
            action={<Button variant="ghost" size="sm" onClick={() => { setFiltroEquip('todos'); setProtecao([]); }}>Limpar filtros</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3" key={filtroEquip}>
          {alternativas.map((alt, i) => {
            const comp = comparativos.find(c => c.exercicioId === exAtual.id && c.alternativaId === alt.id);
            const primAlt = repo.getMusculosDoExercicio(alt.id).filter(m => m.papel === 'primario');
            const jaNoTreino = noTreino.has(alt.id);

            return (
              <Card key={alt.id} animate index={i}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <button type="button" onClick={() => navigate(`/exercicio/${alt.id}`)} className="focus-ring text-left text-[15px] font-semibold text-ink hover:text-brand">
                      {alt.nome}
                    </button>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <Pill color="var(--color-brand-ghost)">{equipLabels[alt.equipamento]}</Pill>
                      <Pill color={dificColors[alt.dificuldade]}>{dificLabels[alt.dificuldade]}</Pill>
                      {jaNoTreino && <Pill color="var(--color-canvas)" icon="info">Já está no treino</Pill>}
                    </div>
                    <p className="text-[14px] text-ink-body mt-1.5">
                      Primários: {primAlt.map(m => m.musculo.nome).join(', ')}
                    </p>
                    {protecao.length > 0 && (
                      <p className="text-[13px] mt-1 flex flex-wrap gap-x-3">
                        {protecao.map(a => (
                          <span key={a} style={{ color: corEstresse[alt.estresse[a]] }}>
                            {articulacaoLabels[a]}: {estresseLabels[alt.estresse[a]].toLowerCase()}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" icon="swap" className="shrink-0" onClick={() => abrirConfirmacao(alt.id)} aria-label={`Trocar por ${alt.nome}`}>
                    Trocar
                  </Button>
                </div>

                <div className="mt-3 pt-3 border-t border-black/[0.08]">
                  {comp ? (
                    <p className="text-[14px] text-ink-body leading-relaxed">
                      <span className="font-semibold text-ink">Diferença relevante:</span> {comp.diferencaRelevante}
                    </p>
                  ) : (
                    <p className="text-[13px] text-ink-body italic">
                      Comparativo biomecânico não disponível. Dados a revisar por profissional.
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sugestão da IA (consultiva) */}
      <Card accent="var(--color-brand-ghost)" animate>
        <div className="flex items-start gap-3">
          <Icon name="sparkle" size={22} color="var(--color-science)" className="mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-semibold text-ink">Sugestão da IA</h4>
            {ia.estado === 'idle' && (
              <p className="text-[14px] text-ink-body mt-0.5">
                {groqApiKey
                  ? 'A IA compara as alternativas filtradas com seu perfil e explica os prós e contras. A decisão é sua.'
                  : 'A IA ainda não está ativa. O dono do app pode ativá-la em Configurações.'}
              </p>
            )}
            {ia.estado === 'carregando' && <p className="text-[14px] text-ink-body mt-1 pulse">Analisando as alternativas…</p>}
            {ia.estado === 'ok' && (
              <p className="anim-fade text-[15px] text-ink leading-relaxed mt-1 whitespace-pre-line" style={{ fontFamily: 'var(--font-serif)' }}>{ia.texto}</p>
            )}
            {ia.estado === 'erro' && <p className="text-[14px] text-vermillion mt-1">{ia.texto}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {groqApiKey && (
                <Button variant="ghost" size="sm" icon={ia.estado === 'ok' ? 'refresh' : 'sparkle'} loading={ia.estado === 'carregando'} onClick={pedirIA}>
                  {ia.estado === 'ok' ? 'Pedir de novo' : 'Pedir sugestão'}
                </Button>
              )}
              <Button variant="text" size="sm" iconRight="chevron-right" onClick={() => navigate('/assistente')}>Perguntar ao Assistente</Button>
            </div>
            {ia.estado === 'ok' && <p className="text-[12px] text-ink-body mt-2">Sugestão consultiva. Confirme com um profissional de Educação Física.</p>}
          </div>
        </div>
      </Card>

      {/* Confirmação */}
      <Sheet open={!!altId} onClose={() => setAltId(null)} title="Confirmar troca">
        <div className="flex flex-col gap-4 pt-1">
          <div className="flex items-center gap-2 text-[14px] text-ink-body flex-wrap">
            <span className="font-semibold text-ink">{exAtual.nome}</span>
            <Icon name="chevron-right" size={16} />
            <span className="font-semibold text-ink">{altSelecionada?.nome}</span>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[14px] font-semibold text-ink mb-2">Onde aplicar a troca?</legend>
            {escopoOpcoes.map(op => {
              const ativo = escopo === op.value;
              return (
                <label
                  key={op.value}
                  className={`pressable-soft flex items-start gap-3 p-3 rounded-[var(--radius-btn)] border cursor-pointer transition-colors duration-200 ${
                    ativo ? 'border-brand bg-brand-ghost' : 'border-black/[0.08] bg-surface hover:border-black/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="escopo-troca"
                    value={op.value}
                    checked={ativo}
                    onChange={() => setEscopo(op.value)}
                    className="sr-only peer"
                  />
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand ${
                      ativo ? 'border-brand' : 'border-black/25'
                    }`}
                    aria-hidden
                  >
                    {ativo && <span className="w-2.5 h-2.5 rounded-full bg-brand anim-pop" />}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[15px] font-medium text-ink">{op.titulo}</span>
                    <span className="text-[14px] text-ink-body">{op.desc}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <div className="flex flex-col gap-2">
            <Button variant="primary" icon="swap" fullWidth onClick={handleConfirmar}>Confirmar troca</Button>
            <Button variant="text" fullWidth onClick={() => setAltId(null)}>Cancelar</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
