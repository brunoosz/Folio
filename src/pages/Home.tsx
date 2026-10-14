import { useEffect, useMemo, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Icon, type IconName } from '../components/ui/Icon';
import { AvatarMark } from '../components/ui/AvatarMark';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useHomeStore } from '../hooks/useHomeStore';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { repo } from '../data/repository';
import { siglaDaFicha } from '../data/seed';
import { artigos } from '../data/ciencia';
import { formatDataLonga, saudacao } from '../data/date';
import { ExercisingPerson, RestingPerson, Sparkle, HeartPulse } from '../components/illustrations';
import type { HomeBlocoConfig, HomeBlocoTipo } from '../data/types';

const blocoLabels: Record<HomeBlocoTipo, string> = {
  treino_do_dia: 'Treino do dia',
  linha_do_tempo: 'Linha do tempo',
  pilula_cientifica: 'Pílula científica',
  atalhos_mapa: 'Atalho do mapa muscular',
};

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/* ---------- Blocos ---------- */

function BlocoTreinoDoDia({ index }: { index: number }) {
  const navigate = useNavigate();
  const sessao = useTreinoStore(s => s.sessao);
  const ficha = useMemo(() => repo.getFichas().find(f => f.id === sessao.fichaModeloId), [sessao.fichaModeloId]);
  const total = sessao.itens.length;
  const concluidos = sessao.itens.filter(i => i.concluido).length;
  const concluida = sessao.status === 'concluida';

  if (!total) {
    return (
      <Card animate index={index}>
        <div className="flex items-center gap-3">
          <AvatarMark accentColor="var(--color-routine)" size={48}><RestingPerson size={30} /></AvatarMark>
          <div>
            <h3 className="text-[15px] font-semibold">Dia livre</h3>
            <p className="text-[14px] text-ink-body">Nenhuma ficha de treino cadastrada.</p>
          </div>
        </div>
      </Card>
    );
  }

  const rotulo = sessao.status === 'pendente' ? 'Iniciar treino' : sessao.status === 'em_andamento' ? 'Continuar treino' : 'Ver treino concluído';

  return (
    <Card animate index={index}>
      <div className="flex items-center gap-3 mb-3">
        <AvatarMark accentColor="var(--color-muscle)" size={48} animate={concluida}>
          <ExercisingPerson size={30} />
        </AvatarMark>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-ink-body tracking-wide">TREINO DE HOJE</p>
          <h3 className="text-[16px] font-semibold leading-snug">{ficha?.nome ?? 'Treino do dia'}</h3>
        </div>
        {concluida && <Pill color="#e0f8e6" textColor="#1a7a3a" icon="check">Feito</Pill>}
      </div>
      <div className="flex items-center justify-between text-[14px] text-ink-body mb-1.5">
        <span>{concluidos} de {total} exercícios</span>
        <span className="tabular">{Math.round((concluidos / total) * 100)}%</span>
      </div>
      <ProgressBar value={concluidos / total} color="var(--color-muscle)" label="Progresso do treino de hoje" className="mb-4" />
      <Button
        variant={concluida ? 'ghost' : 'primary'}
        fullWidth
        icon={sessao.status === 'pendente' ? 'play' : concluida ? 'check' : 'chevron-right'}
        onClick={() => navigate('/treino')}
      >
        {rotulo}
      </Button>
    </Card>
  );
}

function BlocoLinhaDoTempo({ index }: { index: number }) {
  const sessao = useTreinoStore(s => s.sessao);
  const fichas = useMemo(() => repo.getFichas(), []);
  const hoje = new Date().getDay();

  return (
    <Card animate index={index}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold">Semana de treinos</h3>
        <Icon name="calendar" size={20} className="text-ink-body" />
      </div>
      <ul className="grid grid-cols-7 gap-1" aria-label="Fichas por dia da semana">
        {DIAS_CURTOS.map((d, i) => {
          const ficha = fichas.find(f => f.diaSemana === i);
          const isHoje = i === hoje;
          const feitoHoje = isHoje && sessao.status === 'concluida';
          const descricao = `${DIAS_LONGOS[i]}${isHoje ? ' (hoje)' : ''}: ${ficha ? ficha.nome : 'descanso'}${feitoHoje ? ', concluído' : ''}`;
          return (
            <li
              key={d}
              className="flex flex-col items-center gap-1.5 anim-rise"
              style={{ ['--i' as string]: i } as CSSProperties}
              aria-label={descricao}
              title={descricao}
            >
              <span className={`text-[12px] font-medium ${isHoje ? 'text-brand' : 'text-ink-body'}`}>{d}</span>
              <span
                aria-hidden
                className={`w-[38px] h-[38px] rounded-[var(--radius-btn)] flex items-center justify-center text-[14px] font-semibold transition-colors duration-200 ${
                  isHoje
                    ? 'bg-brand text-white'
                    : ficha
                      ? 'bg-[#fff3d6] text-ink'
                      : 'bg-black/[0.04] text-ink-body'
                }`}
              >
                {feitoHoje ? (
                  <Icon name="check" size={18} strokeWidth={2.4} />
                ) : ficha ? (
                  siglaDaFicha(ficha)
                ) : (
                  <Icon name="moon" size={16} />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function BlocoPilulaCientifica({ index }: { index: number }) {
  const navigate = useNavigate();
  const artigo = useMemo(() => {
    if (!artigos.length) return null;
    const d = new Date();
    const inicioAno = new Date(d.getFullYear(), 0, 0);
    const diaDoAno = Math.floor((d.getTime() - inicioAno.getTime()) / 86400000);
    return artigos[diaDoAno % artigos.length];
  }, []);
  if (!artigo) return null;

  return (
    <Card accent="var(--color-brand-ghost)" animate index={index} interactive onClick={() => navigate('/biblioteca')} aria-label={`Pílula científica: ${artigo.titulo}. Abrir biblioteca`}>
      <div className="flex items-start gap-3">
        <AvatarMark accentColor="var(--color-science)" size={40}>
          <Sparkle size={18} color="var(--color-science)" />
        </AvatarMark>
        <div className="flex-1 min-w-0">
          <Pill color="var(--color-surface)" textColor="var(--color-science)" icon="book" className="mb-2">Pílula científica</Pill>
          <h3 className="text-[15px] font-semibold leading-snug mb-1">{artigo.titulo}</h3>
          <p className="text-[14px] text-ink-body leading-relaxed line-clamp-4" style={{ fontFamily: 'var(--font-serif)' }}>
            {artigo.resumo}
          </p>
          <p className="text-[13px] text-ink-body mt-2">
            {artigo.fonte}, {artigo.ano}
          </p>
          <p className="text-[13px] text-ink-body mt-1">Consulte sempre um profissional de Educação Física.</p>
        </div>
      </div>
    </Card>
  );
}

function BlocoAtalhosMapa({ index }: { index: number }) {
  const navigate = useNavigate();
  return (
    <Card animate index={index} interactive onClick={() => navigate('/mapa')} aria-label="Abrir mapa muscular">
      <div className="flex items-center gap-3">
        <AvatarMark accentColor="var(--color-muscle)" size={44}>
          <HeartPulse size={20} />
        </AvatarMark>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold">Mapa muscular</h3>
          <p className="text-[14px] text-ink-body">Veja quais músculos cada exercício trabalha</p>
        </div>
        <Icon name="chevron-right" size={20} className="text-ink-body" />
      </div>
    </Card>
  );
}

const blocoComponents: Record<HomeBlocoTipo, React.FC<{ index: number }>> = {
  treino_do_dia: BlocoTreinoDoDia,
  linha_do_tempo: BlocoLinhaDoTempo,
  pilula_cientifica: BlocoPilulaCientifica,
  atalhos_mapa: BlocoAtalhosMapa,
};

/* ---------- Atalhos ---------- */

const atalhos: { to: string; label: string; icon: IconName; color: string }[] = [
  { to: '/assistente', label: 'Assistente', icon: 'chat', color: 'var(--color-brand)' },
  { to: '/biblioteca', label: 'Biblioteca', icon: 'book', color: 'var(--color-science)' },
  { to: '/historico', label: 'Histórico', icon: 'history', color: 'var(--color-muscle)' },
];

function Atalhos() {
  const navigate = useNavigate();
  return (
    <nav aria-label="Atalhos" className="grid grid-cols-3 gap-3">
      {atalhos.map((a, i) => (
        <Card
          key={a.to}
          interactive
          animate
          index={i + 1}
          padding={14}
          onClick={() => navigate(a.to)}
          aria-label={a.label}
          className="flex flex-col items-center gap-2 text-center min-h-[88px] justify-center"
        >
          <span className="w-[40px] h-[40px] rounded-full bg-brand-ghost flex items-center justify-center" aria-hidden>
            <Icon name={a.icon} size={20} color={a.color} />
          </span>
          <span className="text-[14px] font-medium text-ink">{a.label}</span>
        </Card>
      ))}
    </nav>
  );
}

/* ---------- Modo edição ---------- */

function SortableBloco({ bloco, index, onToggle }: { bloco: HomeBlocoConfig; index: number; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: bloco.tipo });
  const label = blocoLabels[bloco.tipo];
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 10 : undefined }}
    >
      <div
        className={`anim-rise card-border rounded-[var(--radius-card)] pl-1 pr-2 py-1 flex items-center gap-1 bg-surface transition-colors duration-200 ${
          isDragging ? 'border-brand/40' : ''
        }`}
        style={{ ['--i' as string]: index } as CSSProperties}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reordenar ${label}`}
          className="focus-ring w-[44px] h-[44px] shrink-0 flex items-center justify-center rounded-[var(--radius-btn)] text-ink-body cursor-grab active:cursor-grabbing touch-none"
        >
          <Icon name="drag-handle" size={20} />
        </button>
        <span className={`flex-1 text-[15px] font-medium transition-opacity duration-200 ${bloco.visivel ? '' : 'opacity-60'}`}>{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={bloco.visivel}
          aria-label={`Mostrar ${label}`}
          onClick={onToggle}
          className="focus-ring w-[56px] h-[44px] flex items-center justify-center rounded-full cursor-pointer"
        >
          <span
            className={`relative w-[44px] h-[26px] rounded-full transition-colors duration-200 ${bloco.visivel ? 'bg-brand' : 'bg-black/20'}`}
            aria-hidden
          >
            <span
              className="absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full bg-white transition-transform duration-200"
              style={{ transform: bloco.visivel ? 'translateX(18px)' : 'none' }}
            />
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------- Página ---------- */

export function Home() {
  const navigate = useNavigate();
  const { blocos, editando, toggleEditar, setEditando, toggleBloco, reorder, load } = useHomeStore();
  const carregarTreino = useTreinoStore(s => s.load);
  const usuario = useAuthStore(s => s.usuario);

  useEffect(() => { load(); carregarTreino(); }, [load, carregarTreino]);
  // Sai do modo edição ao deixar a página.
  useEffect(() => () => setEditando(false), [setEditando]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIdx = blocos.findIndex(b => b.tipo === active.id);
      const newIdx = blocos.findIndex(b => b.tipo === over.id);
      if (oldIdx >= 0 && newIdx >= 0) reorder(arrayMove(blocos, oldIdx, newIdx));
    }
  };

  const agora = new Date();
  const primeiroNome = usuario?.nome?.trim().split(/\s+/)[0];
  const data = formatDataLonga(agora);
  const dataCap = data.charAt(0).toUpperCase() + data.slice(1);
  const visiveis = blocos.filter(b => b.visivel);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <header className="anim-fade flex items-start justify-between gap-2 min-h-[56px]">
        <div className="min-w-0">
          <p className="text-[14px] text-ink-body">{dataCap}</p>
          <h1 className="text-[24px] font-bold tracking-tight-title leading-tight truncate">
            {saudacao(agora)}{primeiroNome ? `, ${primeiroNome}` : ''}
          </h1>
        </div>
        <div className="flex items-center shrink-0 -mr-2">
          <button
            type="button"
            onClick={toggleEditar}
            aria-pressed={editando}
            className="pressable focus-ring text-[14px] font-medium text-brand min-h-[44px] px-3 rounded-[var(--radius-btn)] flex items-center gap-1.5 hover:bg-brand-ghost"
          >
            <Icon name={editando ? 'check' : 'edit'} size={18} />
            {editando ? 'Pronto' : 'Editar'}
          </button>
          <IconButton icon="settings" label="Configurações" onClick={() => navigate('/configuracoes')} />
        </div>
      </header>

      {editando ? (
        <section className="flex flex-col gap-3" aria-label="Personalizar início">
          <p className="anim-fade text-[14px] text-ink-body">
            Arraste pelo ícone para reordenar e use as chaves para mostrar ou ocultar blocos.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
            <SortableContext items={blocos.map(b => b.tipo)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {blocos.map((bloco, i) => (
                  <SortableBloco key={bloco.tipo} bloco={bloco} index={i} onToggle={() => toggleBloco(bloco.tipo)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      ) : (
        <>
          <Atalhos />
          {visiveis.length === 0 ? (
            <Card animate index={4}>
              <div className="flex flex-col items-center text-center gap-2 py-4">
                <Icon name="eye-off" size={32} className="text-ink-body" />
                <p className="text-[15px] font-semibold">Todos os blocos estão ocultos</p>
                <Button variant="text" onClick={() => setEditando(true)}>Personalizar início</Button>
              </div>
            </Card>
          ) : (
            visiveis.map((bloco, i) => {
              const Comp = blocoComponents[bloco.tipo];
              return <Comp key={bloco.tipo} index={i + 4} />;
            })
          )}
        </>
      )}
    </div>
  );
}

