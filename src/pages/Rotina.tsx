import { useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { useRotinaStore } from '../hooks/useRotinaStore';

function MiniBarChart({ dados, cor, meta }: { dados: { data: string; valor: number }[]; cor: string; meta: number }) {
  const max = Math.max(meta, ...dados.map(d => d.valor), 1);
  return (
    <div className="flex items-end gap-[3px] h-[40px]">
      {dados.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div
            className="w-[6px] rounded-full transition-all duration-200"
            style={{
              height: `${Math.max(4, (d.valor / max) * 36)}px`,
              background: d.valor >= meta ? cor : 'rgba(0,0,0,0.1)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function Rotina() {
  const { habitos, load, incrementar, decrementar, getRegistroHoje, getHistorico } = useRotinaStore();

  useEffect(() => { load(); }, [load]);

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hoje = new Date().getDay();

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Rotina</h1>

      {/* Week header */}
      <div className="flex justify-between px-2">
        {diasSemana.map((d, i) => (
          <span key={i} className={`text-[12px] font-medium ${i === hoje ? 'text-brand' : 'text-ink-muted'}`}>{d}</span>
        ))}
      </div>

      {/* Habit cards */}
      <div className="flex flex-col gap-3">
        {habitos.map(habito => {
          const reg = getRegistroHoje(habito.id);
          const hist = getHistorico(habito.id, 7);
          const progresso = habito.meta ? Math.min(100, (reg.valor / habito.meta) * 100) : 0;
          const completo = habito.meta ? reg.valor >= habito.meta : false;

          return (
            <Card key={habito.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-[24px]">{habito.icone}</span>
                  <div>
                    <h3 className="text-[15px] font-semibold">{habito.nome}</h3>
                    <p className="text-[13px] text-ink-body">
                      {reg.valor}/{habito.meta} {habito.unidade}
                    </p>
                  </div>
                </div>
                {completo && (
                  <Pill color="#e0f8e6">
                    <span className="text-[12px]" style={{ color: '#1a8a3f' }}>Completo</span>
                  </Pill>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-canvas rounded-full h-2 mb-3">
                <div
                  className="rounded-full h-2 transition-all duration-200"
                  style={{ width: `${progresso}%`, background: habito.cor }}
                />
              </div>

              <div className="flex items-center justify-between">
                {/* Mini chart */}
                <MiniBarChart dados={hist} cor={habito.cor} meta={habito.meta ?? 1} />

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decrementar(habito.id)}
                    className="w-[40px] h-[40px] rounded-[var(--radius-btn)] bg-canvas card-border flex items-center justify-center text-[18px] text-ink-muted"
                  >
                    −
                  </button>
                  <span className="text-[18px] font-bold min-w-[28px] text-center">{reg.valor}</span>
                  <button
                    onClick={() => incrementar(habito.id)}
                    className="w-[40px] h-[40px] rounded-[var(--radius-btn)] flex items-center justify-center text-[18px] text-white"
                    style={{ background: habito.cor }}
                  >
                    +
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-[12px] text-ink-muted text-center">
        Acompanhamento de hábitos não substitui orientação profissional.
      </p>
    </div>
  );
}
