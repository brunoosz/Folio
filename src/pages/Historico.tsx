import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { useHistoricoStore } from '../hooks/useHistoricoStore';
import { repo } from '../data/repository';

type Tab = 'sessoes' | 'exercicios' | 'resumo';

function MiniChart({ dados, cor, label, unidade }: { dados: { x: string; y: number }[]; cor: string; label: string; unidade: string }) {
  if (dados.length < 2) return null;
  const max = Math.max(...dados.map(d => d.y), 1);
  const w = 280;
  const h = 70;
  const step = w / (dados.length - 1 || 1);

  const points = dados.map((d, i) => `${i * step},${h - (d.y / max) * (h - 10)}`).join(' ');
  const areaPoints = `0,${h} ${points} ${(dados.length - 1) * step},${h}`;
  const ultimo = dados[dados.length - 1];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[13px] text-ink-muted font-medium">{label}</h4>
        {ultimo && <span className="text-[13px] font-semibold" style={{ color: cor }}>{ultimo.y}{unidade}</span>}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="overflow-visible">
        <polygon points={areaPoints} fill={cor} opacity="0.1" />
        <polyline points={points} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {dados.map((d, i) => (
          <circle key={i} cx={i * step} cy={h - (d.y / max) * (h - 10)} r="3" fill={cor} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-ink-muted">{dados[0]?.x.slice(5)}</span>
        <span className="text-[10px] text-ink-muted">{ultimo?.x.slice(5)}</span>
      </div>
    </div>
  );
}

function SessoesTab() {
  const sessoes = useHistoricoStore(s => s.getSessoesPorPeriodo(30));
  const exerciciosMap = repo.getExercicios();

  if (sessoes.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
          </svg>
          <p className="text-[14px] text-ink-muted">Nenhum treino registrado</p>
          <p className="text-[12px] text-ink-muted text-center max-w-[220px]">
            Conclua treinos para ver seu histórico aqui.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessoes.map(s => {
        const concluidos = s.itens.filter(i => i.concluido).length;
        const dParts = s.data.split('-');
        const dataFormatada = `${dParts[2]}/${dParts[1]}`;
        return (
          <Card key={`${s.id}-${s.data}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[15px] font-semibold">{s.fichaModeloNome}</h3>
              <span className="text-[12px] text-ink-muted">{dataFormatada}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Pill color={s.status === 'concluida' ? '#e6f9e8' : 'var(--color-brand-ghost)'}>
                <span className={`text-[11px] ${s.status === 'concluida' ? 'text-green-700' : 'text-brand'}`}>
                  {s.status === 'concluida' ? 'Concluído' : 'Parcial'}
                </span>
              </Pill>
              <span className="text-[12px] text-ink-muted">{concluidos}/{s.itens.length} exercícios</span>
            </div>
            <div className="flex flex-col gap-1">
              {s.itens.filter(i => i.concluido).map(item => {
                const ex = exerciciosMap.find(e => e.id === item.exercicioId);
                return (
                  <div key={item.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-body">{ex?.nome ?? item.exercicioId}</span>
                    <span className="text-ink-muted">
                      {item.series}x{item.reps} {item.cargaKg ? `· ${item.cargaKg}kg` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ExerciciosTab() {
  const { getProgressaoExercicio } = useHistoricoStore();
  const exercicios = repo.getExercicios();
  const [selecionado, setSelecionado] = useState(exercicios[0]?.id ?? '');

  const dados = getProgressaoExercicio(selecionado, 60);
  const exNome = exercicios.find(e => e.id === selecionado)?.nome ?? '';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        {exercicios.map(ex => (
          <button
            key={ex.id}
            onClick={() => setSelecionado(ex.id)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-[var(--radius-pill)] cursor-pointer transition-colors ${
              selecionado === ex.id ? 'bg-muscle text-white' : 'bg-brand-ghost text-ink-body'
            }`}
          >
            {ex.nome}
          </button>
        ))}
      </div>

      {dados.length >= 2 ? (
        <Card>
          <h3 className="text-[15px] font-semibold mb-4">{exNome}</h3>
          <div className="flex flex-col gap-6">
            <MiniChart
              dados={dados.map(d => ({ x: d.data, y: d.cargaMax }))}
              cor="var(--color-muscle)"
              label="Carga máxima"
              unidade="kg"
            />
            <MiniChart
              dados={dados.map(d => ({ x: d.data, y: d.volumeTotal }))}
              cor="var(--color-muscle-secondary)"
              label="Volume total (séries × reps × carga)"
              unidade="kg"
            />
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-2 py-4">
            <p className="text-[14px] text-ink-muted">Dados insuficientes para {exNome}</p>
            <p className="text-[12px] text-ink-muted text-center">São necessárias pelo menos 2 sessões com carga registrada.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function ResumoTab() {
  const resumo = useHistoricoStore(s => s.getResumoSemanal());
  const totalSessoes = useHistoricoStore(s => s.sessoes.length);

  if (resumo.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-6">
          <p className="text-[14px] text-ink-muted">Sem dados suficientes</p>
        </div>
      </Card>
    );
  }

  const maxSessoes = Math.max(...resumo.map(r => r.sessoes), 1);

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <h3 className="text-[15px] font-semibold mb-3">Total geral</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-[28px] font-bold text-brand">{totalSessoes}</div>
            <div className="text-[12px] text-ink-muted">Treinos</div>
          </div>
          <div className="text-center">
            <div className="text-[28px] font-bold text-muscle">{resumo.length}</div>
            <div className="text-[12px] text-ink-muted">Semanas ativas</div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-[15px] font-semibold mb-3">Sessões por semana</h3>
        <div className="flex items-end gap-2 h-[80px]">
          {resumo.map(r => {
            const pct = (r.sessoes / maxSessoes) * 100;
            const dParts = r.semana.split('-');
            return (
              <div key={r.semana} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[11px] font-semibold text-brand">{r.sessoes}</span>
                <div className="w-full bg-brand-ghost rounded-t" style={{ height: `${Math.max(pct, 8)}%` }}>
                  <div className="w-full h-full bg-brand rounded-t opacity-80" />
                </div>
                <span className="text-[9px] text-ink-muted">{dParts[2]}/{dParts[1]}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function Historico() {
  const [tab, setTab] = useState<Tab>('sessoes');
  const load = useHistoricoStore(s => s.load);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Histórico</h1>

      <div className="flex gap-2">
        {([['sessoes', 'Sessões'], ['exercicios', 'Exercícios'], ['resumo', 'Resumo']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-[13px] font-medium rounded-[var(--radius-btn)] cursor-pointer transition-colors ${
              tab === key ? 'bg-brand text-white' : 'bg-brand-ghost text-ink-body'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'sessoes' && <SessoesTab />}
      {tab === 'exercicios' && <ExerciciosTab />}
      {tab === 'resumo' && <ResumoTab />}
    </div>
  );
}
