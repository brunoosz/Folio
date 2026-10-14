import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { AvatarMark } from '../components/ui/AvatarMark';
import { Pill } from '../components/ui/Pill';
import { Icon, type IconName } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Sheet } from '../components/ui/Sheet';
import { useAuthStore } from '../hooks/useAuthStore';
import { useRotinaStore } from '../hooks/useRotinaStore';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { hojeLocal } from '../data/date';
import { useAguaSonoStore, aguaDoDia, metaAgua, minutosDormidos, historicoAgua, historicoSono } from '../hooks/useAguaSonoStore';
import { LineChart } from './Historico';
import { usePerfilStore, perfilParaTexto } from '../hooks/usePerfilStore';

function iniciais(nome: string | undefined) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase() || '?';
}

function LinkCard({
  icon,
  cor,
  fundo,
  titulo,
  descricao,
  onClick,
  index,
}: {
  icon: IconName;
  cor: string;
  fundo: string;
  titulo: string;
  descricao: string;
  onClick: () => void;
  index: number;
}) {
  return (
    <Card interactive animate index={index} padding={16} onClick={onClick} aria-label={titulo}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-[var(--radius-btn)] flex items-center justify-center shrink-0" style={{ background: fundo }}>
          <Icon name={icon} size={22} color={cor} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-[15px] font-semibold text-ink">{titulo}</span>
          <span className="block text-[13px] text-ink-body truncate">{descricao}</span>
        </div>
        <Icon name="chevron-right" size={20} color="var(--color-ink-body)" />
      </div>
    </Card>
  );
}

export function Perfil() {
  const navigate = useNavigate();
  const usuario = useAuthStore(s => s.usuario);
  const logout = useAuthStore(s => s.logout);
  const habitos = useRotinaStore(s => s.habitos);
  const registros = useRotinaStore(s => s.registros);
  const sessao = useTreinoStore(s => s.sessao);
  const perfil = usePerfilStore();
  const resumoPerfil = perfilParaTexto(perfil);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const fecharConfirmacao = useCallback(() => setConfirmarSaida(false), []);

  const isAdmin = usuario?.role === 'admin';
  const hoje = hojeLocal();
  const concluidos = sessao.itens.filter(i => i.concluido).length;
  const total = sessao.itens.length;

  const agua = useAguaSonoStore(s => s.agua);
  const sono = useAguaSonoStore(s => s.sono);
  const metaAguaMl = useAguaSonoStore(s => s.metaAguaMl);
  const metaSonoH = useAguaSonoStore(s => s.metaSonoH);
  const metaAguaDia = metaAgua(metaAguaMl, perfil.pesoKg);
  const regSono = sono.find(r => r.data === hoje);

  // Derivado de forma reativa a partir de `registros` (atualiza ao registrar hábitos).
  const habitosHoje = useMemo(() => {
    const extras = habitos
      .filter(h => h.tipo !== 'agua' && h.tipo !== 'sono')
      .slice(0, 2)
      .map(h => {
        const valor = registros.find(r => r.habitoId === h.id && r.data === hoje)?.valor ?? 0;
        const meta = Math.max(1, h.meta ?? 1);
        return { id: h.id, nome: h.nome, icone: h.icone, cor: h.cor, unidade: h.unidade, valor, meta };
      });
    return [
      { id: 'agua', nome: 'Água', icone: 'droplet' as const, cor: 'var(--color-muscle-secondary)', unidade: 'ml', valor: aguaDoDia(agua, hoje), meta: metaAguaDia },
      {
        id: 'sono', nome: 'Sono', icone: 'moon' as const, cor: 'var(--color-science)', unidade: 'h',
        valor: regSono ? Math.round((minutosDormidos(regSono) / 60) * 10) / 10 : 0, meta: metaSonoH,
      },
      ...extras,
    ];
  }, [habitos, registros, hoje, agua, metaAguaDia, regSono, metaSonoH]);

  const aguaHist = useMemo(() => historicoAgua(agua, 14), [agua]);
  const sonoHist = useMemo(() => historicoSono(sono, 14), [sono]);
  const temDados = aguaHist.some(d => d.y > 0) || sonoHist.some(d => d.y > 0);

  const sair = () => {
    setConfirmarSaida(false);
    logout();
    navigate('/', { replace: true });
  };

  let idx = 0;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-3">
      <PageHeader
        title="Perfil"
        className="!mb-1"
        right={<IconButton icon="settings" label="Configurações" onClick={() => navigate('/configuracoes')} />}
      />

      {/* Usuário */}
      <Card animate index={idx++} padding={20}>
        <div className="flex items-center gap-4">
          <AvatarMark accentColor="var(--color-brand)" size={60} initials={iniciais(usuario?.nome)} animate />
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-ink truncate">{usuario?.nome ?? 'Usuário'}</h2>
            {usuario?.email && <p className="text-[14px] text-ink-body truncate">{usuario.email}</p>}
            <div className="mt-1.5">
              <Pill icon={isAdmin ? 'shield' : 'user'} textColor="var(--color-brand-ink)">
                {isAdmin ? 'Administrador' : 'Usuário'}
              </Pill>
            </div>
          </div>
        </div>
      </Card>

      {/* Resumo de hoje */}
      <Card animate index={idx++} padding={20}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-ink">Resumo de hoje</h3>
          <span className="text-[13px] text-ink-body">
            {(d => d.charAt(0).toUpperCase() + d.slice(1))(new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }))}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-2 text-[14px] text-ink">
                <Icon name="dumbbell" size={18} color="var(--color-muscle)" />
                Treino
              </span>
              <span className="text-[14px] font-semibold tabular text-ink">
                {total === 0 ? 'Descanso' : `${concluidos}/${total}`}
              </span>
            </div>
            <ProgressBar
              value={total ? concluidos / total : 0}
              color="var(--color-muscle)"
              label={`Treino: ${concluidos} de ${total} exercícios`}
            />
          </div>
          {habitosHoje.map(h => (
            <div key={h.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-2 text-[14px] text-ink">
                  <Icon name={h.icone} size={18} color={h.cor} />
                  {h.nome}
                </span>
                <span className="text-[14px] font-semibold tabular text-ink">
                  {String(h.valor).replace('.', ',')}/{String(h.meta).replace('.', ',')}
                  {h.unidade && <span className="font-normal text-ink-body"> {h.unidade}</span>}
                </span>
              </div>
              <ProgressBar value={h.valor / h.meta} color={h.cor} label={`${h.nome}: ${h.valor} de ${h.meta}`} />
            </div>
          ))}
        </div>
      </Card>

      {/* Links */}
      <LinkCard
        index={idx++}
        icon="scale"
        cor="var(--color-brand)"
        fundo="var(--color-brand-ghost)"
        titulo="Meus dados"
        descricao={resumoPerfil || 'Altura, peso, experiência e objetivo'}
        onClick={() => navigate('/perfil/dados')}
      />
      <LinkCard
        index={idx++}
        icon="history"
        cor="var(--color-muscle)"
        fundo="var(--color-tint-danger)"
        titulo="Histórico de treinos"
        descricao="Sessões, carga e volume"
        onClick={() => navigate('/historico')}
      />
      <LinkCard
        index={idx++}
        icon="book"
        cor="var(--color-science)"
        fundo="var(--color-brand-ghost)"
        titulo="Biblioteca científica"
        descricao="Artigos sobre treino e saúde"
        onClick={() => navigate('/biblioteca')}
      />
      <LinkCard
        index={idx++}
        icon="settings"
        cor="var(--color-ink)"
        fundo="rgba(0,0,0,0.05)"
        titulo="Configurações"
        descricao="Assistente IA, animações e dados"
        onClick={() => navigate('/configuracoes')}
      />
      {isAdmin && (
        <LinkCard
          index={idx++}
          icon="shield"
          cor="var(--color-warn-ink)"
          fundo="var(--color-tint-warn)"
          titulo="Painel Admin"
          descricao="Catálogo, IA e materiais"
          onClick={() => navigate('/admin')}
        />
      )}

      {/* Progressão */}
      <Card animate index={idx++} padding={20}>
        <h3 className="text-[16px] font-semibold text-ink mb-1">Rotina — últimos 14 dias</h3>
        <p className="text-[13px] text-ink-body mb-4">
          {temDados ? 'Registros diários de água e sono.' : 'Registre água e sono na Rotina para ver a evolução.'}
        </p>
        <div className="flex flex-col gap-6">
          <LineChart dados={aguaHist} cor="var(--color-muscle-secondary)" label="Água" unidade="ml" />
          <LineChart dados={sonoHist} cor="var(--color-science)" label="Sono" unidade="h" />
        </div>
      </Card>

      <div className="anim-fade flex justify-center pt-2" style={{ animationDelay: '320ms' }}>
        <Button variant="text" icon="logout" onClick={() => setConfirmarSaida(true)} className="!text-vermillion">
          Sair da conta
        </Button>
      </div>

      <Sheet open={confirmarSaida} onClose={fecharConfirmacao} title="Sair da conta?" variant="modal">
        <div className="px-5">
          <p className="text-[15px] text-ink-body leading-relaxed mb-5">
            Seus treinos e registros continuam salvos neste aparelho. Para entrar de novo, use seu usuário e senha.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={fecharConfirmacao}>Cancelar</Button>
            <Button variant="danger" icon="logout" onClick={sair}>Sair</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
