import { useState } from 'react';
import { Button, IconButton } from './ui/Button';
import { Icon, type IconName } from './ui/Icon';
import { Sheet } from './ui/Sheet';
import { toast } from './ui/Toast';
import { useRotinaStore } from '../hooks/useRotinaStore';
import { useMedicamentosStore } from '../hooks/useMedicamentosStore';
import { habitosDefault, type HabitoModelo } from '../data/rotina';

const ICONES: IconName[] = ['check', 'pill', 'cup', 'stretch', 'utensils', 'book', 'heart', 'flame', 'target', 'timer', 'dumbbell', 'note', 'folha', 'maca', 'droplet'];
const CORES = ['var(--color-muscle)', 'var(--color-muscle-secondary)', 'var(--color-routine)', 'var(--color-science)', 'var(--color-mocha)', 'var(--color-saffron)', 'var(--color-ok)'];

function Interruptor({ ligado, onChange, label }: { ligado: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-label={label} onClick={() => onChange(!ligado)}
      className="focus-ring relative w-[52px] h-[44px] shrink-0 flex items-center justify-center cursor-pointer">
      <span className="block w-[44px] h-[26px] rounded-full transition-colors duration-200" style={{ background: ligado ? 'var(--color-brand)' : 'rgba(0,0,0,0.18)' }} />
      <span className="absolute top-1/2 -mt-[11px] w-[22px] h-[22px] rounded-full bg-white transition-transform duration-200"
        style={{ left: 6, transform: `translateX(${ligado ? 18 : 2}px)` }} />
    </button>
  );
}

function Linha({ icone, cor, titulo, descricao, children, onClick }: { icone: IconName; cor: string; titulo: string; descricao?: string; children?: React.ReactNode; onClick?: () => void }) {
  const corpo = (
    <>
      <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${cor} 16%, var(--color-surface))` }}>
        <Icon name={icone} size={18} color="var(--color-ink)" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-medium text-ink truncate">{titulo}</span>
        {descricao && <span className="block text-[13px] text-ink-body truncate">{descricao}</span>}
      </span>
    </>
  );
  return (
    <li className="flex items-center gap-2 min-h-[56px] border-b border-black/[0.06] last:border-b-0">
      {onClick ? (
        <button type="button" onClick={onClick} className="pressable-soft focus-ring flex-1 min-w-0 flex items-center gap-3 py-1.5 text-left rounded-[var(--radius-btn)]">{corpo}</button>
      ) : <div className="flex-1 min-w-0 flex items-center gap-3 py-1.5">{corpo}</div>}
      {children}
    </li>
  );
}

/** Ajusta o que aparece em Rotina → Hoje: liga/desliga cartões, remove e cria hábitos. */
export function PersonalizarRotinaSheet({ open, onClose, onGerenciarRemedios }: { open: boolean; onClose: () => void; onGerenciarRemedios: () => void }) {
  const habitos = useRotinaStore(s => s.habitos);
  const { salvarHabito, removerHabito, restaurarPadrao } = useRotinaStore.getState();
  const mostrarRemedios = useMedicamentosStore(s => s.mostrarNaRotina);
  const setMostrarRemedios = useMedicamentosStore(s => s.setMostrarNaRotina);
  const nMeds = useMedicamentosStore(s => s.medicamentos.length);
  const [editando, setEditando] = useState<HabitoModelo | null>(null);

  const temTipo = (tipo: 'agua' | 'sono') => habitos.some(h => h.tipo === tipo);
  const alternarFixo = (tipo: 'agua' | 'sono', v: boolean) => {
    const padrao = habitosDefault.find(h => h.tipo === tipo)!;
    if (v) salvarHabito(padrao);
    else habitos.filter(h => h.tipo === tipo).forEach(h => removerHabito(h.id));
  };
  const outros = habitos.filter(h => h.tipo !== 'agua' && h.tipo !== 'sono');
  const fechar = () => { setEditando(null); onClose(); };

  return (
    <Sheet open={open} onClose={fechar} title={editando ? (habitos.some(h => h.id === editando.id) ? 'Editar hábito' : 'Novo hábito') : 'Personalizar rotina'}>
      {editando ? (
        <FormHabito key={editando.id} inicial={editando} onPronto={() => setEditando(null)} />
      ) : (
        <div className="flex flex-col gap-4 pb-2">
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-body mb-1">Cartões</h3>
            <ul>
              <Linha icone="droplet" cor="var(--color-muscle-secondary)" titulo="Água" descricao="Garrafa, meta em ml e histórico">
                <Interruptor ligado={temTipo('agua')} onChange={v => alternarFixo('agua', v)} label="Mostrar água" />
              </Linha>
              <Linha icone="moon" cor="var(--color-science)" titulo="Sono" descricao="Horários, despertares e qualidade">
                <Interruptor ligado={temTipo('sono')} onChange={v => alternarFixo('sono', v)} label="Mostrar sono" />
              </Linha>
              <Linha icone="pill" cor="var(--color-routine)" titulo="Remédios" descricao={nMeds ? `${nMeds} cadastrado${nMeds > 1 ? 's' : ''} · toque para gerenciar` : 'Toque para cadastrar'}
                onClick={onGerenciarRemedios}>
                <Interruptor ligado={mostrarRemedios} onChange={setMostrarRemedios} label="Mostrar remédios" />
              </Linha>
            </ul>
          </section>
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-body mb-1">Hábitos</h3>
            {outros.length ? (
              <ul>
                {outros.map(h => (
                  <Linha key={h.id} icone={h.icone} cor={h.cor} titulo={h.nome} descricao={`Meta: ${h.meta ?? 1} ${h.unidade ?? ''}`} onClick={() => setEditando(h)}>
                    <IconButton icon="trash" label={`Remover ${h.nome}`} size={20}
                      onClick={() => { removerHabito(h.id); toast.success(`${h.nome} removido da rotina`); }} />
                  </Linha>
                ))}
              </ul>
            ) : <p className="text-[14px] text-ink-body py-2">Nenhum hábito. Adicione os que fazem sentido para você.</p>}
          </section>
          <Button fullWidth icon="plus"
            onClick={() => setEditando({ id: `hab_${Date.now().toString(36)}`, nome: '', tipo: 'custom', meta: 1, unidade: 'vez', icone: 'check', cor: CORES[0] })}>
            Adicionar hábito
          </Button>
          <Button variant="text" size="sm" icon="refresh" className="self-center" onClick={() => { restaurarPadrao(); toast.success('Itens padrão restaurados'); }}>
            Restaurar itens padrão
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function FormHabito({ inicial, onPronto }: { inicial: HabitoModelo; onPronto: () => void }) {
  const salvarHabito = useRotinaStore(s => s.salvarHabito);
  const [nome, setNome] = useState(inicial.nome);
  const [meta, setMeta] = useState(String(inicial.meta ?? 1));
  const [unidade, setUnidade] = useState(inicial.unidade ?? '');
  const [icone, setIcone] = useState<IconName>(inicial.icone);
  const [cor, setCor] = useState(inicial.cor);
  const metaNum = Math.min(99, Math.max(1, Math.round(Number(meta.replace(',', '.')) || 1)));

  return (
    <div className="flex flex-col gap-4 pb-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">Nome</span>
        <input className="input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Meditar" maxLength={30} autoFocus={!inicial.nome} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] text-ink-body">Meta por dia</span>
          <input className="input tabular" inputMode="numeric" value={meta} onChange={e => setMeta(e.target.value.replace(/[^\d]/g, ''))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] text-ink-body">Unidade</span>
          <input className="input" value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="vez, min, dose…" maxLength={14} />
        </label>
      </div>
      <fieldset>
        <legend className="text-[14px] text-ink-body mb-1.5">Ícone</legend>
        <div className="grid grid-cols-8 gap-1">
          {ICONES.map(i => (
            <button key={i} type="button" aria-label={i} aria-pressed={icone === i} onClick={() => setIcone(i)}
              className="pressable focus-ring h-[44px] rounded-[var(--radius-btn)] flex items-center justify-center border transition-colors duration-200"
              style={{ borderColor: icone === i ? 'var(--color-brand)' : 'transparent', background: icone === i ? 'var(--color-brand-ghost)' : 'transparent' }}>
              <Icon name={i} size={20} color="var(--color-ink)" />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-[14px] text-ink-body mb-1.5">Cor</legend>
        <div className="flex gap-2 flex-wrap">
          {CORES.map(c => (
            <button key={c} type="button" aria-label={`Cor ${c.replace(/var\(--color-|\)/g, '')}`} aria-pressed={cor === c} onClick={() => setCor(c)}
              className="pressable focus-ring w-[44px] h-[44px] rounded-full flex items-center justify-center border-2 transition-colors duration-200"
              style={{ borderColor: cor === c ? 'var(--color-ink)' : 'transparent' }}>
              <span className="w-7 h-7 rounded-full" style={{ background: c }} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onPronto}>Voltar</Button>
        <Button className="flex-1" icon="check" disabled={!nome.trim()}
          onClick={() => { salvarHabito({ ...inicial, nome: nome.trim(), meta: metaNum, unidade: unidade.trim(), icone, cor }); toast.success('Hábito salvo'); onPronto(); }}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
