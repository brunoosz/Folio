import { useMemo, useState } from 'react';
import { Card } from './ui/Card';
import { Button, IconButton } from './ui/Button';
import { Icon } from './ui/Icon';
import { Sheet } from './ui/Sheet';
import { toast } from './ui/Toast';
import {
  useMedicamentosStore, dosesDoDia, diasSemanaCurto, type Medicamento,
} from '../hooks/useMedicamentosStore';
import { hojeLocal } from '../data/date';

function agoraHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Cartão "Remédios de hoje": um botão por horário para marcar se tomou. */
export function CartaoRemedios({ index, onGerenciar }: { index: number; onGerenciar: () => void }) {
  const medicamentos = useMedicamentosStore(s => s.medicamentos);
  const tomadas = useMedicamentosStore(s => s.tomadas);
  const alternar = useMedicamentosStore(s => s.alternarTomada);
  const hoje = hojeLocal();
  const doses = useMemo(() => dosesDoDia(medicamentos, tomadas, hoje), [medicamentos, tomadas, hoje]);
  const feitas = doses.filter(d => d.tomada).length;
  const agora = agoraHHMM();

  return (
    <Card animate index={index} padding={20}>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-tint-warn)' }}>
          <Icon name="pill" size={24} color="var(--color-warn-ink)" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-semibold">Remédios</h3>
          <p className="text-[14px] text-ink-body tabular">
            {doses.length ? <><span className="font-semibold text-ink">{feitas}</span> de {doses.length} {doses.length === 1 ? 'dose' : 'doses'} hoje</> : 'Nenhuma dose para hoje'}
          </p>
        </div>
        <IconButton icon="edit" label="Gerenciar remédios" onClick={onGerenciar} />
      </div>
      {doses.length > 0 && (
        <ul className="flex flex-col mt-2">
          {doses.map(d => {
            const atrasada = !d.tomada && d.hora < agora;
            return (
              <li key={`${d.med.id}-${d.hora}`}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={d.tomada}
                  onClick={() => { alternar(d.med.id, hoje, d.hora); if (!d.tomada) toast.success(`${d.med.nome} marcado como tomado`); }}
                  className="pressable-soft focus-ring w-full flex items-center gap-3 min-h-[52px] py-1.5 text-left rounded-[var(--radius-btn)]"
                >
                  <span className="text-[14px] font-semibold tabular w-[46px] shrink-0" style={{ color: atrasada ? 'var(--color-warn-ink)' : 'var(--color-ink-body)' }}>{d.hora}</span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[15px] font-medium truncate ${d.tomada ? 'text-ink-body line-through decoration-1' : 'text-ink'}`}>{d.med.nome}</span>
                    {(d.med.dose || atrasada) && (
                      <span className="block text-[13px] truncate" style={{ color: atrasada ? 'var(--color-warn-ink)' : 'var(--color-ink-body)' }}>
                        {atrasada ? 'Horário passou' : ''}{atrasada && d.med.dose ? ' · ' : ''}{d.med.dose}
                      </span>
                    )}
                  </span>
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-200"
                    style={{
                      background: d.tomada ? 'var(--color-ok)' : 'var(--color-surface)',
                      borderColor: d.tomada ? 'var(--color-ok)' : atrasada ? 'var(--color-routine)' : 'rgba(0,0,0,0.15)',
                    }}
                  >
                    {d.tomada ? <span className="anim-pop inline-flex"><Icon name="check" size={18} color="#fff" strokeWidth={2.4} /></span> : <Icon name="pill" size={16} color="var(--color-ink-body)" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!medicamentos.length && (
        <Button variant="text" size="sm" icon="plus" className="!px-0 mt-1" onClick={onGerenciar}>Adicionar remédio</Button>
      )}
    </Card>
  );
}

/* ---------------- Gerenciar ---------------- */

export function MedicamentosSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const medicamentos = useMedicamentosStore(s => s.medicamentos);
  const [editando, setEditando] = useState<Medicamento | null>(null);
  const fechar = () => { setEditando(null); onClose(); };
  return (
    <Sheet open={open} onClose={fechar} title={editando ? (editando.nome ? 'Editar remédio' : 'Novo remédio') : 'Meus remédios'}>
      {editando ? (
        <FormMedicamento key={editando.id} inicial={editando} onPronto={() => setEditando(null)} />
      ) : (
        <div className="flex flex-col gap-2 pb-2">
          {!medicamentos.length && (
            <p className="text-[14px] text-ink-body leading-relaxed mb-1">
              Cadastre os remédios que você já usa, com os horários da receita. O Folio só lembra — não indica, não ajusta dose.
            </p>
          )}
          {medicamentos.map(m => (
            <button key={m.id} type="button" onClick={() => setEditando(m)}
              className="pressable-soft focus-ring card-border rounded-[var(--radius-card)] p-3 flex items-center gap-3 text-left">
              <Icon name="pill" size={20} color={m.ativo ? 'var(--color-warn-ink)' : 'var(--color-ink-body)'} />
              <span className="flex-1 min-w-0">
                <span className={`block text-[15px] font-semibold truncate ${m.ativo ? 'text-ink' : 'text-ink-body'}`}>{m.nome}{!m.ativo && ' (pausado)'}</span>
                <span className="block text-[13px] text-ink-body truncate">
                  {m.horarios.join(', ') || 'sem horário'} · {m.dias.length ? m.dias.map(d => diasSemanaCurto[d]).join(', ') : 'todos os dias'}
                </span>
              </span>
              <Icon name="chevron-right" size={18} color="var(--color-ink-body)" />
            </button>
          ))}
          <Button fullWidth icon="plus" className="mt-2"
            onClick={() => setEditando({ id: `m${Date.now().toString(36)}`, nome: '', dose: '', horarios: ['08:00'], dias: [], obs: '', ativo: true })}>
            Adicionar remédio
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function FormMedicamento({ inicial, onPronto }: { inicial: Medicamento; onPronto: () => void }) {
  const { salvar, remover } = useMedicamentosStore.getState();
  const existe = useMedicamentosStore(s => s.medicamentos.some(m => m.id === inicial.id));
  const [nome, setNome] = useState(inicial.nome);
  const [dose, setDose] = useState(inicial.dose);
  const [horarios, setHorarios] = useState<string[]>(inicial.horarios.length ? inicial.horarios : ['08:00']);
  const [dias, setDias] = useState<number[]>(inicial.dias);
  const [obs, setObs] = useState(inicial.obs);
  const [ativo, setAtivo] = useState(inicial.ativo);

  const ok = nome.trim() && horarios.some(h => /^\d{2}:\d{2}$/.test(h));
  const alternarDia = (d: number) => setDias(ds => (ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d].sort()));

  return (
    <div className="flex flex-col gap-4 pb-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">Nome</span>
        <input className="input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Losartana" maxLength={50} autoFocus={!inicial.nome} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">Dose (como na receita)</span>
        <input className="input" value={dose} onChange={e => setDose(e.target.value)} placeholder="Ex.: 1 comprimido de 50 mg" maxLength={60} />
      </label>
      <fieldset>
        <legend className="text-[14px] text-ink-body mb-1.5">Horários</legend>
        <div className="flex flex-wrap gap-2">
          {horarios.map((h, i) => (
            <div key={i} className="flex items-center gap-1">
              <input type="time" className="input !w-[120px] tabular font-semibold" value={h} aria-label={`Horário ${i + 1}`}
                onChange={e => setHorarios(hs => hs.map((x, j) => (j === i ? e.target.value : x)))} />
              {horarios.length > 1 && <IconButton icon="x" label={`Remover horário ${h}`} size={18} onClick={() => setHorarios(hs => hs.filter((_, j) => j !== i))} />}
            </div>
          ))}
          {horarios.length < 6 && (
            <Button variant="ghost" size="sm" icon="plus" onClick={() => setHorarios(hs => [...hs, hs.length ? addHoras(hs[hs.length - 1], 8) : '08:00'])}>Horário</Button>
          )}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-[14px] text-ink-body mb-1.5">Dias {dias.length ? '' : '(todos)'}</legend>
        <div className="grid grid-cols-7 gap-1">
          {diasSemanaCurto.map((d, i) => (
            <button key={d} type="button" aria-pressed={dias.includes(i)} onClick={() => alternarDia(i)}
              className="pressable focus-ring min-h-[44px] rounded-[var(--radius-btn)] text-[13px] font-medium border transition-colors duration-200"
              style={{
                background: dias.includes(i) ? 'var(--color-brand-ghost)' : 'var(--color-surface)',
                borderColor: dias.includes(i) ? 'var(--color-brand)' : 'rgba(0,0,0,0.08)',
                color: dias.includes(i) ? 'var(--color-brand)' : 'var(--color-ink-body)',
              }}>
              {d}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">Observações</span>
        <input className="input" value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex.: tomar em jejum" maxLength={100} />
      </label>
      <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
        <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-5 h-5 accent-[var(--color-brand)]" />
        <span className="text-[15px] text-ink">Em uso (mostrar e lembrar)</span>
      </label>
      <div className="flex gap-2">
        {existe ? (
          <Button variant="danger" icon="trash" onClick={() => { remover(inicial.id); onPronto(); }}>Remover</Button>
        ) : (
          <Button variant="ghost" onClick={onPronto}>Voltar</Button>
        )}
        <Button className="flex-1" icon="check" disabled={!ok}
          onClick={() => { salvar({ ...inicial, nome: nome.trim(), dose: dose.trim(), horarios, dias, obs: obs.trim(), ativo }); toast.success('Remédio salvo'); onPronto(); }}>
          Salvar
        </Button>
      </div>
      <p className="text-[12px] text-ink-body text-center">Siga sempre a receita. Dúvidas sobre dose ou horário: fale com seu médico ou farmacêutico.</p>
    </div>
  );
}

function addHoras(hhmm: string, h: number) {
  const [a, b] = hhmm.split(':').map(Number);
  return `${String(((a || 0) + h) % 24).padStart(2, '0')}:${String(b || 0).padStart(2, '0')}`;
}
