import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Icon, type IconName } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { RestingPerson } from '../components/illustrations';
import { repo } from '../data/repository';
import { equipLabels } from '../data/catalogo';
import { artigos, respostasIA } from '../data/ciencia';
import type { Equipamento, Dificuldade } from '../data/types';
import { useAuthStore } from '../hooks/useAuthStore';
import { useSettingsStore, getAiStatus, GROQ_MODELS } from '../hooks/useSettingsStore';
import { SegmentedTabs } from './Historico';
import { EditorExercicio } from '../components/EditorExercicio';

type Tab = 'catalogo' | 'ia' | 'pdf' | 'usuarios';
const TABS = [
  { key: 'catalogo', label: 'Catálogo' },
  { key: 'ia', label: 'IA' },
  { key: 'pdf', label: 'PDF' },
  { key: 'usuarios', label: 'Usuários' },
] as const satisfies readonly { key: Tab; label: string }[];


const difLabels: Record<Dificuldade, string> = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

type StatusFiltro = 'todos' | 'revisado' | 'revisar';

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* ---------------- Catálogo ---------------- */

function CatalogoTab() {
  const [versao, setVersao] = useState(0);
  const exercicios = useMemo(() => repo.getExercicios(), [versao]); // eslint-disable-line react-hooks/exhaustive-deps
  const [editor, setEditor] = useState<{ aberto: boolean; id: string | null }>({ aberto: false, id: null });
  const [busca, setBusca] = useState('');
  const [equip, setEquip] = useState<Equipamento | null>(null);
  const [status, setStatus] = useState<StatusFiltro>('todos');

  const equipamentos = useMemo(
    () => (Object.keys(equipLabels) as Equipamento[]).filter(e => exercicios.some(x => x.equipamento === e)),
    [exercicios],
  );
  const pendentes = exercicios.filter(e => !e.revisado).length;

  const filtrados = useMemo(() => {
    const q = norm(busca.trim());
    return exercicios.filter(ex => {
      if (equip && ex.equipamento !== equip) return false;
      if (status === 'revisado' && !ex.revisado) return false;
      if (status === 'revisar' && ex.revisado) return false;
      if (!q) return true;
      const musculos = repo.getMusculosDoExercicio(ex.id).map(m => m.musculo.nome).join(' ');
      return norm(`${ex.nome} ${musculos} ${equipLabels[ex.equipamento]}`).includes(q);
    });
  }, [exercicios, busca, equip, status]);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Card animate index={0} padding={16}>
          <span className="block text-[24px] font-bold text-ink tabular">{exercicios.length}</span>
          <span className="text-[13px] text-ink-body">Exercícios cadastrados</span>
        </Card>
        <Card animate index={1} padding={16} accent={pendentes ? 'var(--color-tint-warn)' : undefined}>
          <span className="block text-[24px] font-bold tabular" style={{ color: pendentes ? 'var(--color-warn-ink)' : 'var(--color-ink)' }}>{pendentes}</span>
          <span className="text-[13px] text-ink-body">A revisar por profissional</span>
        </Card>
      </div>

      <div className="relative anim-rise" style={{ '--i': 2 } as CSSProperties}>
        <label htmlFor="busca-catalogo" className="sr-only">Buscar exercício</label>
        <Icon name="search" size={20} color="var(--color-ink-body)" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="busca-catalogo"
          type="search"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou músculo"
          autoComplete="off"
          className="w-full min-h-[48px] pl-11 pr-12 rounded-[var(--radius-btn)] bg-surface card-border text-[15px] text-ink placeholder:text-ink-body/80 transition-colors duration-200 focus:border-brand/50"
        />
        {busca && (
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 anim-fade">
            <IconButton icon="x" label="Limpar busca" size={18} onClick={() => setBusca('')} />
          </div>
        )}
      </div>

      <div className="anim-rise flex flex-col gap-2" style={{ '--i': 3 } as CSSProperties}>
        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por equipamento">
          <Pill onClick={() => setEquip(null)} selected={!equip} icon="dumbbell" className="shrink-0">Todos</Pill>
          {equipamentos.map(e => (
            <Pill key={e} onClick={() => setEquip(cur => (cur === e ? null : e))} selected={equip === e} className="shrink-0">
              {equipLabels[e]}
            </Pill>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrar por revisão">
          {([['todos', 'Todos'], ['revisar', 'A revisar'], ['revisado', 'Revisados']] as const).map(([k, l]) => (
            <Pill key={k} onClick={() => setStatus(k)} selected={status === k} icon={k === 'revisado' ? 'check' : k === 'revisar' ? 'warning' : undefined}>
              {l}
            </Pill>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-ink-body tabular" aria-live="polite">
          {filtrados.length} de {exercicios.length} exercícios
        </p>
        <Button variant="ghost" size="sm" icon="plus" onClick={() => setEditor({ aberto: true, id: null })}>Novo exercício</Button>
      </div>

      {filtrados.length === 0 ? (
        <Card animate>
          <EmptyState
            compact
            illustration={<RestingPerson size={56} color="var(--color-brand)" />}
            title="Nenhum exercício encontrado"
            description="Ajuste a busca ou os filtros."
            action={
              <Button variant="ghost" icon="refresh" onClick={() => { setBusca(''); setEquip(null); setStatus('todos'); }}>
                Limpar filtros
              </Button>
            }
          />
        </Card>
      ) : (
        <div key={`${busca}|${equip}|${status}`} className="flex flex-col gap-2">
          {filtrados.map((ex, i) => {
            const prim = repo.getMusculosDoExercicio(ex.id).filter(m => m.papel === 'primario').map(m => m.musculo.nome);
            return (
              <Card key={ex.id} animate index={Math.min(i, 10)} padding={16} interactive onClick={() => setEditor({ aberto: true, id: ex.id })} aria-label={`Editar ${ex.nome}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[15px] font-semibold text-ink leading-snug">{ex.nome}</h3>
                  {ex.revisado ? (
                    <Pill color="var(--color-tint-ok)" textColor="var(--color-ok)" icon="check" className="shrink-0 !text-[12px]">Revisado</Pill>
                  ) : (
                    <Pill color="var(--color-tint-warn)" textColor="var(--color-warn-ink)" icon="warning" className="shrink-0 !text-[12px]">A revisar</Pill>
                  )}
                </div>
                <p className="text-[13px] text-ink-body mt-1">
                  {equipLabels[ex.equipamento]} · {difLabels[ex.dificuldade]}
                  {prim.length > 0 && <> · {prim.join(', ')}</>}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <p className="flex gap-2 text-[13px] text-ink-body leading-relaxed px-1">
        <Icon name="info" size={16} className="shrink-0 mt-[2px]" />
        Exercícios marcados “A revisar” precisam de validação por profissional de Educação Física antes de uso real.
      </p>
      <EditorExercicio exercicioId={editor.id} aberto={editor.aberto} onClose={() => setEditor(e => ({ ...e, aberto: false }))} onSalvo={() => setVersao(v => v + 1)} />
    </div>
  );
}

/* ---------------- IA ---------------- */

function Linha({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-black/[0.06] last:border-0">
      <span className="text-[14px] text-ink-body">{label}</span>
      <span className="text-[14px] font-medium text-ink text-right min-w-0 truncate">{children}</span>
    </div>
  );
}

function IaTab() {
  const navigate = useNavigate();
  const groqApiKey = useSettingsStore(s => s.groqApiKey);
  const groqModel = useSettingsStore(s => s.groqModel);
  const aiLastError = useSettingsStore(s => s.aiLastError);
  const status = getAiStatus({ groqApiKey, aiLastError });
  const modelo = GROQ_MODELS.find(m => m.id === groqModel)?.label ?? groqModel;
  const chaveMascarada = groqApiKey ? `${groqApiKey.slice(0, 4)}••••${groqApiKey.slice(-4)}` : '—';

  const info: Record<typeof status, { titulo: string; desc: string; cor: string; fundo: string; icon: IconName }> = {
    ativa: {
      titulo: 'Groq conectada',
      desc: 'O Assistente responde com IA, apoiado na biblioteca científica.',
      cor: 'var(--color-ok)',
      fundo: 'var(--color-tint-ok)',
      icon: 'sparkle',
    },
    nao_configurada: {
      titulo: 'IA não configurada',
      desc: 'Sem chave, o Assistente usa respostas locais (modo offline).',
      cor: 'var(--color-warn-ink)',
      fundo: 'var(--color-tint-warn)',
      icon: 'key',
    },
    erro: {
      titulo: 'Falha na última conexão',
      desc: aiLastError ?? 'Verifique a chave e o modelo.',
      cor: 'var(--color-danger-ink)',
      fundo: 'var(--color-tint-danger)',
      icon: 'warning',
    },
  };
  const st = info[status];

  return (
    <div className="flex flex-col gap-3">
      <Card animate index={0} accent={st.fundo} padding={20}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-surface flex items-center justify-center shrink-0 anim-pop">
            <Icon name={st.icon} size={22} color={st.cor} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold" style={{ color: st.cor }}>{st.titulo}</h3>
            <p className="text-[14px] text-ink-body leading-relaxed mt-0.5 break-words">{st.desc}</p>
          </div>
        </div>
      </Card>

      <Card animate index={1} padding={20}>
        <h3 className="text-[16px] font-semibold text-ink mb-1">Detalhes</h3>
        <Linha label="Provedor">Groq</Linha>
        <Linha label="Modelo">{status === 'nao_configurada' ? '—' : modelo}</Linha>
        <Linha label="Chave">
          <span className="font-mono text-[13px]">{chaveMascarada}</span>
        </Linha>
        <Linha label="Respostas offline">{respostasIA.length}</Linha>
        <Linha label="Artigos na base">{artigos.length}</Linha>
      </Card>

      <div className="anim-rise" style={{ '--i': 2 } as CSSProperties}>
        <Button fullWidth icon="settings" onClick={() => navigate('/configuracoes')}>
          {status === 'nao_configurada' ? 'Configurar IA' : 'Gerenciar IA'}
        </Button>
      </div>

      <Card animate index={3} padding={20}>
        <h3 className="text-[16px] font-semibold text-ink mb-2">Base de conhecimento</h3>
        <ul className="flex flex-col">
          {artigos.map(art => (
            <li key={art.id} className="flex items-center justify-between gap-3 py-2 border-b border-black/[0.06] last:border-0">
              <span className="text-[14px] text-ink truncate">{art.titulo}</span>
              <span className="text-[13px] text-ink-body tabular shrink-0">{art.ano}</span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="flex gap-2 text-[13px] text-ink-body leading-relaxed px-1">
        <Icon name="info" size={16} className="shrink-0 mt-[2px]" />
        A chave fica salva apenas neste aparelho. Com o Supabase, a busca na base passará a usar embeddings.
      </p>
    </div>
  );
}

/* ---------------- PDF / Usuários ---------------- */

function EmBreve({ icon, titulo, desc, itens }: { icon: IconName; titulo: string; desc: string; itens: string[] }) {
  return (
    <Card animate padding={24}>
      <div className="stagger flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-brand-ghost flex items-center justify-center">
          <Icon name={icon} size={28} color="var(--color-brand)" />
        </div>
        <Pill textColor="var(--color-brand-ink)" icon="clock">Em breve</Pill>
        <h3 className="text-[17px] font-semibold text-ink">{titulo}</h3>
        <p className="text-[14px] text-ink-body max-w-[300px] leading-relaxed">{desc}</p>
        <ul className="w-full max-w-[320px] text-left flex flex-col gap-2 mt-1">
          {itens.map(t => (
            <li key={t} className="flex items-start gap-2 text-[14px] text-ink">
              <Icon name="check" size={18} color="var(--color-brand)" className="shrink-0 mt-[1px]" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/* ---------------- Página ---------------- */

export function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('catalogo');
  const usuario = useAuthStore(s => s.usuario);

  if (usuario?.role !== 'admin') {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <PageHeader title="Acesso restrito" back />
        <Card animate>
          <EmptyState
            compact
            illustration={<Icon name="lock" size={56} color="var(--color-ink-body)" strokeWidth={1.4} />}
            title="Somente administradores"
            description="Este painel é exclusivo para o responsável pelo app."
            action={<Button variant="ghost" icon="home" onClick={() => navigate('/')}>Voltar ao início</Button>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Painel Admin" subtitle="Conteúdo, IA e materiais" back className="!mb-0" />
      <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} label="Seções do painel" />

      <div key={tab} className="anim-fade" role="tabpanel" aria-label={TABS.find(t => t.key === tab)?.label}>
        {tab === 'catalogo' && <CatalogoTab />}
        {tab === 'ia' && <IaTab />}
        {tab === 'pdf' && (
          <EmBreve
            icon="download"
            titulo="Fichas em PDF"
            desc="Exportar fichas de treino em PDF para imprimir ou compartilhar."
            itens={['Ficha com séries, repetições e descanso', 'Avisos de segurança incluídos', 'Fila de geração em segundo plano']}
          />
        )}
        {tab === 'usuarios' && (
          <EmBreve
            icon="user"
            titulo="Contas de usuários"
            desc="Hoje o Folio usa um login de demonstração local. Contas reais chegam com a integração ao Supabase."
            itens={['Cadastro e login com e-mail', 'Dados sincronizados entre aparelhos', 'Papéis: administrador e usuário']}
          />
        )}
      </div>
    </div>
  );
}
