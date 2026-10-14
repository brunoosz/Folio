import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { repo } from '../data/repository';
import { comparativos } from '../data/comparativos';
import type { Equipamento } from '../data/types';

const equipLabels: Record<string, string> = {
  barra_livre: 'Barra livre', maquina: 'Máquina', haltere: 'Halteres', cabo: 'Cabo', peso_corporal: 'Peso corporal',
};

const dificLabels: Record<string, string> = {
  basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado',
};

const equipOptions: { value: Equipamento | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'maquina', label: 'Máquinas' },
  { value: 'haltere', label: 'Halteres' },
  { value: 'cabo', label: 'Cabos' },
  { value: 'barra_livre', label: 'Barra livre' },
  { value: 'peso_corporal', label: 'Peso corporal' },
];

export function Troca() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { sessao, trocarExercicio } = useTreinoStore();
  const [filtroEquip, setFiltroEquip] = useState<Equipamento | 'todos'>('todos');
  const [confirmar, setConfirmar] = useState<{ altId: string } | null>(null);

  const item = sessao.itens.find(i => i.id === itemId);
  if (!item) { navigate('/treino'); return null; }

  const exAtual = repo.getExercicio(item.exercicioId);
  if (!exAtual) { navigate('/treino'); return null; }

  const musculosAtuais = repo.getMusculosDoExercicio(item.exercicioId);
  const primarios = musculosAtuais.filter(m => m.papel === 'primario');
  const primarioIds = primarios.map(m => m.musculoId);

  const todosExercicios = repo.getExercicios();
  const alternativas = todosExercicios.filter(ex => {
    if (ex.id === exAtual.id) return false;
    if (filtroEquip !== 'todos' && ex.equipamento !== filtroEquip) return false;
    const musculosAlt = repo.getMusculosDoExercicio(ex.id);
    const primAlt = musculosAlt.filter(m => m.papel === 'primario').map(m => m.musculoId);
    return primarioIds.some(id => primAlt.includes(id));
  });

  const handleConfirmar = (escopo: 'hoje' | 'padrao') => {
    if (!confirmar) return;
    trocarExercicio(item.id, confirmar.altId, escopo);
    navigate('/treino');
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <button onClick={() => navigate('/treino')} className="text-[14px] text-brand font-medium self-start min-h-[44px] flex items-center gap-1">
        ← Voltar ao treino
      </button>

      <h1 className="text-[20px] font-bold tracking-tight-title">Trocar exercício</h1>

      {/* Exercício atual */}
      <Card>
        <h3 className="text-[13px] text-ink-muted font-medium mb-2">EXERCÍCIO ATUAL</h3>
        <h2 className="text-[17px] font-bold">{exAtual.nome}</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Pill color="#fde2de"><span style={{ color: 'var(--color-muscle)' }}>{primarios.map(m => m.musculo.nome).join(', ')}</span></Pill>
          <Pill color="var(--color-brand-ghost)">{equipLabels[exAtual.equipamento]}</Pill>
        </div>
        {musculosAtuais.filter(m => m.papel === 'secundario').length > 0 && (
          <p className="text-[13px] text-ink-body mt-2">
            Secundários: {musculosAtuais.filter(m => m.papel === 'secundario').map(m => m.musculo.nome).join(', ')}
          </p>
        )}
      </Card>

      {/* Aviso de não-equivalência */}
      <Card accent="#fff8e6">
        <div className="flex gap-3">
          <span className="text-[20px] shrink-0">⚠</span>
          <div>
            <h3 className="text-[14px] font-semibold text-ink mb-1">Atenção: exercícios diferentes não são equivalentes</h3>
            <p className="text-[13px] text-ink-body leading-relaxed">
              Cada exercício tem padrão de movimento, recrutamento muscular e demanda articular próprios. A troca pode alterar o estímulo do treino. Consulte um profissional de Educação Física para ajustes individualizados.
            </p>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <div>
        <h3 className="text-[13px] text-ink-muted font-medium mb-2">FILTRAR POR EQUIPAMENTO</h3>
        <div className="flex gap-2 flex-wrap">
          {equipOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFiltroEquip(opt.value)}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-[var(--radius-pill)] transition-colors duration-200 min-h-[36px] ${
                filtroEquip === opt.value
                  ? 'bg-brand text-white'
                  : 'bg-surface card-border text-ink-body'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alternativas */}
      <h3 className="text-[13px] text-ink-muted font-medium">ALTERNATIVAS ({alternativas.length})</h3>

      {alternativas.length === 0 ? (
        <Card>
          <p className="text-[14px] text-ink-body text-center py-4">
            Nenhuma alternativa encontrada com este filtro.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {alternativas.map(alt => {
            const comp = comparativos.find(c => c.exercicioId === exAtual.id && c.alternativaId === alt.id);
            const musculosAlt = repo.getMusculosDoExercicio(alt.id);
            const primAlt = musculosAlt.filter(m => m.papel === 'primario');

            return (
              <Card key={alt.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-[15px] font-semibold">{alt.nome}</h4>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <Pill color="var(--color-brand-ghost)">{equipLabels[alt.equipamento]}</Pill>
                      <Pill color={alt.dificuldade === 'avancado' ? '#fde2de' : alt.dificuldade === 'intermediario' ? '#fff3d6' : '#e6f3fe'}>
                        {dificLabels[alt.dificuldade]}
                      </Pill>
                    </div>
                    <p className="text-[12px] text-ink-muted mt-1.5">
                      Primários: {primAlt.map(m => m.musculo.nome).join(', ')}
                    </p>
                  </div>
                  <Button variant="ghost" className="text-[13px] px-3 py-1.5 min-h-[36px] shrink-0" onClick={() => setConfirmar({ altId: alt.id })}>
                    Trocar
                  </Button>
                </div>

                {comp && (
                  <div className="mt-3 pt-3 border-t border-black/[0.08]">
                    <p className="text-[13px] text-ink-body leading-relaxed">
                      <span className="font-semibold text-ink">Diferença relevante:</span> {comp.diferencaRelevante}
                    </p>
                  </div>
                )}

                {!comp && (
                  <div className="mt-3 pt-3 border-t border-black/[0.08]">
                    <p className="text-[12px] text-ink-muted italic">
                      Comparativo biomecânico não disponível. Dados a revisar por profissional.
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Espaço reservado para IA */}
      <Card accent="var(--color-brand-ghost)">
        <div className="flex items-center gap-3">
          <span className="text-[18px]">🤖</span>
          <div>
            <h4 className="text-[14px] font-semibold text-ink">Sugestão inteligente</h4>
            <p className="text-[13px] text-ink-body">Em breve, a IA do Folio sugerirá substituições com base em evidências científicas citadas.</p>
          </div>
        </div>
      </Card>

      {/* Modal de confirmação */}
      {confirmar && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center" onClick={() => setConfirmar(null)}>
          <div className="bg-surface w-full max-w-lg rounded-t-[20px] p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-ink-muted/30 rounded-full mx-auto mb-4" />
            <h3 className="text-[17px] font-bold mb-2">Confirmar troca</h3>
            <p className="text-[14px] text-ink-body mb-6">
              Trocar <strong>{exAtual.nome}</strong> por <strong>{repo.getExercicio(confirmar.altId)?.nome}</strong>?
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="primary" onClick={() => handleConfirmar('hoje')} className="w-full">
                Apenas no treino de hoje
              </Button>
              <Button variant="ghost" onClick={() => handleConfirmar('padrao')} className="w-full">
                Atualizar na ficha padrão
              </Button>
              <Button variant="text" onClick={() => setConfirmar(null)} className="w-full">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
