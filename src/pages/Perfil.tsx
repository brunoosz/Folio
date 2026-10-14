import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AvatarMark } from '../components/ui/AvatarMark';
import { Pill } from '../components/ui/Pill';
import { useAuthStore } from '../hooks/useAuthStore';
import { useRotinaStore } from '../hooks/useRotinaStore';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { RestingPerson } from '../components/illustrations';

function ProgressoChart({ dados, cor, label }: { dados: { data: string; valor: number }[]; cor: string; label: string }) {
  const max = Math.max(...dados.map(d => d.valor), 1);
  const w = 280;
  const h = 80;
  const step = w / (dados.length - 1 || 1);

  const points = dados.map((d, i) => `${i * step},${h - (d.valor / max) * (h - 10)}`).join(' ');
  const areaPoints = `0,${h} ${points} ${(dados.length - 1) * step},${h}`;

  return (
    <div>
      <h4 className="text-[13px] text-ink-muted font-medium mb-2">{label}</h4>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="overflow-visible">
        <polygon points={areaPoints} fill={cor} opacity="0.1" />
        <polyline points={points} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {dados.map((d, i) => (
          <circle key={i} cx={i * step} cy={h - (d.valor / max) * (h - 10)} r="3" fill={cor} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-ink-muted">{dados[0]?.data.slice(5)}</span>
        <span className="text-[10px] text-ink-muted">{dados[dados.length - 1]?.data.slice(5)}</span>
      </div>
    </div>
  );
}

export function Perfil() {
  const { usuario, logout } = useAuthStore();
  const { habitos, getHistorico } = useRotinaStore();
  const { sessao } = useTreinoStore();

  const concluidos = sessao.itens.filter(i => i.concluido).length;
  const total = sessao.itens.length;

  const aguaHist = getHistorico('hab_agua', 14);
  const sonoHist = getHistorico('hab_sono', 14);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Perfil</h1>

      {/* User card */}
      <Card>
        <div className="flex items-center gap-4">
          <AvatarMark accentColor="var(--color-brand)" size={56}>
            <RestingPerson size={32} color="var(--color-brand)" />
          </AvatarMark>
          <div className="flex-1">
            <h2 className="text-[17px] font-bold">{usuario?.nome ?? 'Usuário'}</h2>
            <p className="text-[13px] text-ink-body">{usuario?.email}</p>
            <Pill color="var(--color-brand-ghost)" className="mt-1">
              <span className="text-[11px] text-brand">{usuario?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
            </Pill>
          </div>
        </div>
      </Card>

      {/* Today summary */}
      <Card>
        <h3 className="text-[15px] font-semibold mb-3">Resumo de hoje</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-[24px] font-bold text-muscle">{concluidos}/{total}</div>
            <div className="text-[11px] text-ink-muted">Exercícios</div>
          </div>
          {habitos.slice(0, 2).map(h => {
            const reg = useRotinaStore.getState().getRegistroHoje(h.id);
            return (
              <div key={h.id} className="text-center">
                <div className="text-[24px] font-bold" style={{ color: h.cor }}>{reg.valor}/{h.meta}</div>
                <div className="text-[11px] text-ink-muted">{h.nome}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Progress charts */}
      <Card>
        <h3 className="text-[15px] font-semibold mb-4">Progressão — 14 dias</h3>
        <div className="flex flex-col gap-6">
          <ProgressoChart dados={aguaHist} cor="var(--color-muscle-secondary)" label="Água (copos/dia)" />
          <ProgressoChart dados={sonoHist} cor="var(--color-science)" label="Sono (horas/dia)" />
        </div>
      </Card>

      <Button variant="ghost" onClick={logout} className="w-full">Sair da conta</Button>
    </div>
  );
}
