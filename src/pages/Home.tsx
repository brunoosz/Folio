import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { AvatarMark } from '../components/ui/AvatarMark';
import { useHomeStore } from '../hooks/useHomeStore';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { repo } from '../data/repository';
import { ExercisingPerson, Sparkle, HeartPulse } from '../components/illustrations';
import type { HomeBlocoConfig, HomeBlocoTipo } from '../data/types';

const blocoLabels: Record<HomeBlocoTipo, string> = {
  treino_do_dia: 'Treino do dia',
  linha_do_tempo: 'Linha do tempo',
  pilula_cientifica: 'Pílula científica',
  atalhos_mapa: 'Atalhos do mapa',
};

function SortableBloco({ bloco, children }: { bloco: HomeBlocoConfig; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: bloco.tipo });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function BlocoTreinoDoDia() {
  const sessao = useTreinoStore(s => s.sessao);
  const fichas = repo.getFichas();
  const ficha = fichas.find(f => f.id === sessao.fichaModeloId);
  const concluidos = sessao.itens.filter(i => i.concluido).length;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <AvatarMark accentColor="var(--color-muscle)" size={44}>
          <ExercisingPerson size={28} />
        </AvatarMark>
        <div>
          <h3 className="text-[15px] font-semibold">{ficha?.nome ?? 'Treino do dia'}</h3>
          <p className="text-[13px] text-ink-body">{concluidos}/{sessao.itens.length} exercícios</p>
        </div>
      </div>
      <div className="w-full bg-canvas rounded-full h-2 mb-3">
        <div
          className="bg-muscle rounded-full h-2 transition-all duration-200"
          style={{ width: `${sessao.itens.length ? (concluidos / sessao.itens.length) * 100 : 0}%` }}
        />
      </div>
      <Link to="/treino">
        <Button variant="primary" className="w-full">
          {sessao.status === 'pendente' ? 'Iniciar treino' : sessao.status === 'em_andamento' ? 'Continuar treino' : 'Ver treino concluído'}
        </Button>
      </Link>
    </Card>
  );
}

function BlocoLinhaDoTempo() {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const fichas = repo.getFichas();
  const hoje = new Date().getDay();

  return (
    <Card>
      <h3 className="text-[15px] font-semibold mb-3">Linha do tempo</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dias.map((d, i) => {
          const ficha = fichas.find(f => f.diaSemana === i);
          const isHoje = i === hoje;
          return (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[44px]">
              <span className={`text-[11px] font-medium ${isHoje ? 'text-brand' : 'text-ink-muted'}`}>{d}</span>
              <div
                className={`w-[36px] h-[36px] rounded-[var(--radius-btn)] flex items-center justify-center text-[11px] font-medium ${
                  isHoje ? 'bg-brand text-white' : ficha ? 'bg-routine/15 text-ink' : 'bg-canvas text-ink-muted'
                }`}
              >
                {ficha ? ficha.nome.charAt(ficha.nome.indexOf('—') + 2) || 'T' : '·'}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BlocoPilulaCientifica() {
  return (
    <Card accent="var(--color-brand-ghost)">
      <div className="flex items-start gap-3">
        <AvatarMark accentColor="var(--color-science)" size={40}>
          <Sparkle size={18} color="var(--color-science)" />
        </AvatarMark>
        <div className="flex-1">
          <Pill color="var(--color-brand-ghost)" className="mb-2">
            <span style={{ color: 'var(--color-science)' }}>Ciência</span>
          </Pill>
          <p className="text-[14px] text-ink-body leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>
            "O agachamento livre e o leg press <strong>não são equivalentes</strong>: o agachamento recruta estabilizadores da coluna e exige controle motor que a máquina elimina."
          </p>
          <p className="text-[12px] text-ink-muted mt-2">
            Consulte sempre um profissional de Educação Física.
          </p>
        </div>
      </div>
    </Card>
  );
}

function BlocoAtalhosMapa() {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <AvatarMark accentColor="var(--color-muscle)" size={40}>
          <HeartPulse size={18} />
        </AvatarMark>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold">Mapa muscular</h3>
          <p className="text-[13px] text-ink-body">Veja quais músculos você está treinando</p>
        </div>
        <Link to="/mapa">
          <Button variant="ghost" className="text-[13px] px-3 py-1.5 min-h-[36px]">Ver</Button>
        </Link>
      </div>
    </Card>
  );
}

const blocoComponents: Record<HomeBlocoTipo, React.FC> = {
  treino_do_dia: BlocoTreinoDoDia,
  linha_do_tempo: BlocoLinhaDoTempo,
  pilula_cientifica: BlocoPilulaCientifica,
  atalhos_mapa: BlocoAtalhosMapa,
};

export function Home() {
  const { blocos, editando, toggleEditar, toggleBloco, reorder, load } = useHomeStore();

  useEffect(() => { load(); }, [load]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIdx = blocos.findIndex(b => b.tipo === active.id);
      const newIdx = blocos.findIndex(b => b.tipo === over.id);
      reorder(arrayMove(blocos, oldIdx, newIdx));
    }
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold tracking-tight-title">Início</h1>
        <button
          onClick={toggleEditar}
          className="text-[13px] font-medium text-brand min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {editando ? 'Pronto' : 'Editar'}
        </button>
      </div>

      {!editando && (
        <div className="flex gap-3">
          <Link to="/assistente" className="flex-1">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-[var(--radius-btn)] bg-brand-ghost flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className="text-[14px] font-medium">Assistente</span>
              </div>
            </Card>
          </Link>
          <Link to="/biblioteca" className="flex-1">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-[var(--radius-btn)] bg-brand-ghost flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-science)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <span className="text-[14px] font-medium">Biblioteca</span>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {editando ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocos.map(b => b.tipo)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {blocos.map(bloco => (
                <SortableBloco key={bloco.tipo} bloco={bloco}>
                  <div className={`card-border rounded-[var(--radius-card)] p-4 flex items-center justify-between bg-surface ${!bloco.visivel ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-ink-muted cursor-grab">☰</span>
                      <span className="text-[14px] font-medium">{blocoLabels[bloco.tipo]}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBloco(bloco.tipo); }}
                      className={`w-[44px] h-[26px] rounded-full transition-colors duration-200 ${bloco.visivel ? 'bg-brand' : 'bg-ink-muted/20'}`}
                    >
                      <div className={`w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform duration-200 ${bloco.visivel ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>
                </SortableBloco>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        blocos.filter(b => b.visivel).map(bloco => {
          const Comp = blocoComponents[bloco.tipo];
          return <Comp key={bloco.tipo} />;
        })
      )}
    </div>
  );
}
