import { useEffect, useState, type CSSProperties } from 'react';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { NumberInput } from '../components/ui/NumberInput';
import { toast } from '../components/ui/Toast';
import { InsightSono } from '../components/InsightSono';
import { usePerfilStore } from '../hooks/usePerfilStore';
import {
  useAguaSonoStore, aguaDoDia, metaAgua, garrafaDoDia, historicoAgua, historicoSono, minutosDormidos, fmtHoras, type SonoRegistro,
} from '../hooks/useAguaSonoStore';
import {
  useMinhaRotinaStore, atividadesDoDia, tipoAtividade, diasCurtos, type AtividadeRotina, type TipoAtividade,
} from '../hooks/useMinhaRotinaStore';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { RestingPerson } from '../components/illustrations';
import { useRotinaStore } from '../hooks/useRotinaStore';
import { formatDataLonga, hojeLocal, parseLocalISODate } from '../data/date';

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Anel de progresso animado com o ícone do hábito no centro. */
function ProgressRing({ value, color, size = 52, children }: { value: number; color: string; size?: number; children: React.ReactNode }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  // Começa vazio e anima até o valor na montagem.
  const [mostrado, setMostrado] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMostrado(v));
    return () => cancelAnimationFrame(raf);
  }, [v]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - mostrado)}
          style={{ transition: 'stroke-dashoffset 480ms var(--ease-out)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function MiniBarChart({ dados, cor, meta, nome }: { dados: { data: string; valor: number }[]; cor: string; meta: number; nome: string }) {
  const max = Math.max(meta, ...dados.map(d => d.valor), 1);
  const cumpridos = dados.filter(d => d.valor >= meta).length;
  return (
    <div className="flex items-end gap-[6px] h-[48px]" role="img" aria-label={`${nome}: meta cumprida em ${cumpridos} dos últimos ${dados.length} dias`}>
      {dados.map((d, i) => {
        const dia = parseLocalISODate(d.data).getDay();
        return (
          <div key={d.data} className="flex flex-col items-center gap-1" title={`${DIAS[dia]}: ${d.valor}`}>
            <div
              className="w-[10px] rounded-full anim-scale"
              style={{
                height: `${Math.max(4, (d.valor / max) * 28)}px`,
                background: d.valor > 0 ? cor : 'rgba(0,0,0,0.12)',
                opacity: d.valor > 0 && d.valor < meta ? 0.45 : 1,
                transformOrigin: 'bottom',
                transition: 'height 200ms ease, background-color 200ms ease, opacity 200ms ease',
                ['--i' as string]: i,
              } as CSSProperties}
            />
            <span className={`text-[12px] leading-none ${i === dados.length - 1 ? 'text-ink font-semibold' : 'text-ink-body'}`} aria-hidden>
              {LETRAS[dia]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Água ---------------- */

function CartaoAgua({ index }: { index: number }) {
  const s = useAguaSonoStore();
  const pesoKg = usePerfilStore(p => p.pesoKg);
  const [ajustes, setAjustes] = useState(false);
  const [outro, setOutro] = useState(false);
  const [valorOutro, setValorOutro] = useState<number | null>(300);
  const [verLista, setVerLista] = useState(false);
  const hoje = hojeLocal();
  const total = aguaDoDia(s.agua, hoje);
  const meta = metaAgua(s.metaAguaMl, pesoKg);
  const garrafa = garrafaDoDia(s, hoje);
  const registrosHoje = s.agua.filter(a => a.data === hoje).sort((a, b) => b.hora.localeCompare(a.hora));
  const hist = historicoAgua(s.agua, 7).map(d => ({ data: d.x, valor: d.y }));
  const completo = total >= meta;
  const fmtMl = (ml: number) => ml >= 1000 ? `${String(Math.round(ml / 100) / 10).replace('.', ',')} L` : `${ml} ml`;

  const beber = (ml: number) => {
    s.beber(ml);
    if (total < meta && total + ml >= meta) toast.success('Meta de água batida!');
  };

  return (
    <Card animate index={index} padding={20}>
      <div className="flex items-center gap-3">
        <ProgressRing value={total / meta} color="var(--color-muscle-secondary)" size={60}>
          <span key={completo ? 'ok' : 'no'} className={completo ? 'anim-pop inline-flex' : 'inline-flex'}>
            <Icon name="droplet" size={24} color="var(--color-ink)" />
          </span>
        </ProgressRing>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[16px] font-semibold">Água</h3>
            {completo && <span className="anim-pop"><Pill color="var(--color-tint-ok)" textColor="var(--color-ok)" icon="check">Meta batida</Pill></span>}
          </div>
          <p className="text-[15px] text-ink-body tabular">
            <span key={total} className="num-tick font-semibold text-ink">{fmtMl(total)}</span> de {fmtMl(meta)}
          </p>
          <button type="button" onClick={() => setAjustes(true)} className="focus-ring text-[13px] text-brand font-medium min-h-[32px]">
            Garrafa de {garrafa} ml{s.garrafaHoje?.data === hoje ? ' (só hoje)' : ''} · ajustar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2 mt-4">
        <Button variant="primary" icon="droplet" onClick={() => beber(garrafa)}>+ Garrafa ({garrafa} ml)</Button>
        <Button variant="ghost" onClick={() => beber(250)} aria-label="Adicionar um copo de 250 ml">+ Copo</Button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <Button variant="text" size="sm" icon="plus" onClick={() => setOutro(true)}>Outra quantidade</Button>
        {registrosHoje.length > 0 && (
          <Button variant="text" size="sm" iconRight={verLista ? 'chevron-up' : 'chevron-down'} onClick={() => setVerLista(v => !v)}>
            {registrosHoje.length} {registrosHoje.length === 1 ? 'registro' : 'registros'}
          </Button>
        )}
      </div>
      {verLista && (
        <ul className="anim-fade mt-1 flex flex-col divide-y divide-black/[0.06]">
          {registrosHoje.map(r => (
            <li key={r.id} className="flex items-center justify-between min-h-[44px] text-[14px]">
              <span className="text-ink-body tabular">{r.hora}</span>
              <span className="font-medium tabular flex-1 ml-4">{r.ml} ml</span>
              <IconButton icon="x" label={`Desfazer ${r.ml} ml das ${r.hora}`} size={16} onClick={() => s.removerAgua(r.id)} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <MiniBarChart dados={hist} cor="var(--color-muscle-secondary)" meta={meta} nome="Água" />
      </div>

      <Sheet open={outro} onClose={() => setOutro(false)} title="Registrar água" variant="modal">
        <div className="flex flex-col gap-4">
          <NumberInput id="agua-outro" label="Quantidade" unit="ml" size="lg" min={10} max={3000} value={valorOutro} onChange={setValorOutro} />
          <div className="flex gap-2 flex-wrap">
            {[150, 300, 600, 1000].map(v => <Pill key={v} onClick={() => setValorOutro(v)} selected={valorOutro === v}>{v} ml</Pill>)}
          </div>
          <Button variant="primary" icon="check" fullWidth disabled={!valorOutro} onClick={() => { if (valorOutro) beber(valorOutro); setOutro(false); }}>Adicionar</Button>
        </div>
      </Sheet>

      <Sheet open={ajustes} onClose={() => setAjustes(false)} title="Garrafa e meta">
        <div className="flex flex-col gap-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput id="garrafa-padrao" label="Garrafa padrão" unit="ml" min={50} max={5000} value={s.garrafaMl}
              onChange={v => v && s.setGarrafa(v)} />
            <NumberInput id="garrafa-hoje" label="Só hoje (opcional)" unit="ml" min={50} max={5000} placeholder="—"
              value={s.garrafaHoje?.data === hoje ? s.garrafaHoje.ml : null} onChange={v => s.setGarrafaHoje(v)} />
          </div>
          <p className="text-[13px] text-ink-body -mt-2">Usou outra garrafa hoje? Preencha "Só hoje": amanhã volta para a padrão.</p>
          <NumberInput id="meta-agua" label="Meta diária" unit="ml" min={500} max={8000} placeholder={String(metaAgua(null, pesoKg))}
            value={s.metaAguaMl} onChange={v => s.setMetaAgua(v)} />
          <p className="text-[13px] text-ink-body -mt-2">
            {pesoKg ? `Em branco: automática, cerca de 35 ml por kg (${String(pesoKg).replace('.', ',')} kg).` : 'Em branco: 2 L. Informe seu peso em Perfil → Meus dados para calcular.'}
            {' '}Necessidades variam com clima, treino e saúde.
          </p>
          <Button variant="primary" fullWidth onClick={() => { setAjustes(false); toast.success('Ajustes salvos'); }}>Pronto</Button>
        </div>
      </Sheet>
    </Card>
  );
}

/* ---------------- Sono ---------------- */

const QUALIDADES = ['Muito ruim', 'Ruim', 'Regular', 'Boa', 'Ótima'];

function FormSono({ inicial, onSalvar }: { inicial: SonoRegistro; onSalvar: (r: SonoRegistro) => void }) {
  const [r, setR] = useState<SonoRegistro>(inicial);
  const [novoDesp, setNovoDesp] = useState<{ hora: string; minutos: number | null }>({ hora: '03:00', minutos: 10 });
  const min = minutosDormidos(r);
  const campo = 'w-full h-[48px] px-3 text-[17px] font-semibold tabular bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface';
  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">Dormi às
          <input type="time" value={r.dormiu} onChange={e => setR({ ...r, dormiu: e.target.value || r.dormiu })} className={campo} />
        </label>
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">Acordei às
          <input type="time" value={r.acordou} onChange={e => setR({ ...r, acordou: e.target.value || r.acordou })} className={campo} />
        </label>
      </div>
      <p className="text-[15px] text-ink">Sono estimado: <strong className="tabular">{fmtHoras(min)}</strong>
        {r.despertares.length > 0 && <span className="text-ink-body"> (descontando {r.despertares.reduce((a, d) => a + d.minutos, 0)} min acordado)</span>}
      </p>

      <div>
        <p className="text-[14px] font-medium text-ink mb-2">Acordou durante a noite?</p>
        {r.despertares.map((d, i) => (
          <div key={i} className="flex items-center gap-2 min-h-[44px] text-[14px]">
            <Icon name="moon" size={16} color="var(--color-science)" />
            <span className="flex-1">às <strong className="tabular">{d.hora}</strong>, por {d.minutos} min</span>
            <IconButton icon="x" label="Remover despertar" size={16} onClick={() => setR({ ...r, despertares: r.despertares.filter((_, k) => k !== i) })} />
          </div>
        ))}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <label className="flex flex-col gap-1 text-[13px] text-ink-body">Horário
            <input type="time" value={novoDesp.hora} onChange={e => setNovoDesp({ ...novoDesp, hora: e.target.value })}
              className="h-[44px] px-2 text-[15px] tabular bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
          </label>
          <NumberInput id="desp-min" label="Minutos" min={1} max={300} value={novoDesp.minutos} onChange={v => setNovoDesp({ ...novoDesp, minutos: v })} />
          <Button variant="ghost" icon="plus" aria-label="Adicionar despertar" disabled={!novoDesp.hora || !novoDesp.minutos}
            onClick={() => setR({ ...r, despertares: [...r.despertares, { hora: novoDesp.hora, minutos: novoDesp.minutos ?? 0 }].sort((a, b) => a.hora.localeCompare(b.hora)) })} />
        </div>
      </div>

      <div>
        <p className="text-[14px] font-medium text-ink mb-2">Como foi a noite?</p>
        <div role="radiogroup" aria-label="Qualidade do sono" className="grid grid-cols-5 gap-1.5">
          {QUALIDADES.map((q, i) => (
            <button key={q} type="button" role="radio" aria-checked={r.qualidade === i + 1} onClick={() => setR({ ...r, qualidade: i + 1 })}
              className={`pressable focus-ring min-h-[52px] rounded-[var(--radius-btn)] border text-[12px] font-medium flex flex-col items-center justify-center gap-0.5 ${
                r.qualidade === i + 1 ? 'bg-brand-ghost border-brand text-brand' : 'bg-surface border-black/[0.08] text-ink-body'
              }`}>
              <span className="text-[16px] font-bold tabular">{i + 1}</span>{q}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-[14px] text-ink-body">Observações (opcional)
        <input value={r.notas} onChange={e => setR({ ...r, notas: e.target.value.slice(0, 200) })} placeholder="Ex.: calor, barulho, café à noite"
          className="h-[44px] px-3 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
      </label>
      <Button variant="primary" icon="check" fullWidth onClick={() => onSalvar(r)}>Salvar noite</Button>
    </div>
  );
}

function CartaoSono({ index }: { index: number }) {
  const s = useAguaSonoStore();
  const [aberto, setAberto] = useState(false);
  const hoje = hojeLocal();
  const reg = s.sono.find(x => x.data === hoje);
  const ultimo = [...s.sono].sort((a, b) => b.data.localeCompare(a.data))[0];
  const inicial: SonoRegistro = reg ?? {
    data: hoje, dormiu: ultimo?.dormiu ?? '23:00', acordou: ultimo?.acordou ?? '07:00', despertares: [], qualidade: null, notas: '',
  };
  const min = reg ? minutosDormidos(reg) : 0;
  const hist = historicoSono(s.sono, 7).map(d => ({ data: d.x, valor: d.y }));
  const completo = !!reg && min >= s.metaSonoH * 60 - 15;

  return (
    <Card animate index={index} padding={20}>
      <div className="flex items-center gap-3">
        <ProgressRing value={reg ? min / (s.metaSonoH * 60) : 0} color="var(--color-science)" size={60}>
          <Icon name="moon" size={24} color="var(--color-ink)" />
        </ProgressRing>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[16px] font-semibold">Sono</h3>
            {completo && <span className="anim-pop"><Pill color="var(--color-tint-ok)" textColor="var(--color-ok)" icon="check">Meta batida</Pill></span>}
          </div>
          {reg ? (
            <p className="text-[15px] text-ink-body tabular">
              <span className="font-semibold text-ink">{fmtHoras(min)}</span> de {s.metaSonoH}h · {reg.dormiu} → {reg.acordou}
            </p>
          ) : (
            <p className="text-[15px] text-ink-body">Como foi a noite passada?</p>
          )}
          {reg && (
            <p className="text-[13px] text-ink-body">
              {reg.despertares.length ? `${reg.despertares.length} ${reg.despertares.length === 1 ? 'despertar' : 'despertares'}` : 'Sem despertares'}
              {reg.qualidade ? ` · qualidade ${QUALIDADES[reg.qualidade - 1].toLowerCase()}` : ''}
            </p>
          )}
        </div>
      </div>

      {reg && <div className="mt-3"><InsightSono /></div>}

      <Button variant="ghost" icon={reg ? 'edit' : 'plus'} fullWidth className="mt-3" onClick={() => setAberto(true)}>
        {reg ? 'Editar noite' : 'Registrar a noite'}
      </Button>

      <div className="flex items-end justify-between mt-3 gap-3">
        <MiniBarChart dados={hist} cor="var(--color-science)" meta={s.metaSonoH} nome="Sono" />
        <div className="flex items-center gap-1" aria-label="Meta de sono">
          <IconButton icon="minus" label="Diminuir meta de sono" size={16} onClick={() => s.setMetaSono(s.metaSonoH - 0.5)} />
          <span className="text-[13px] text-ink-body tabular w-14 text-center">meta {String(s.metaSonoH).replace('.', ',')}h</span>
          <IconButton icon="plus" label="Aumentar meta de sono" size={16} onClick={() => s.setMetaSono(s.metaSonoH + 0.5)} />
        </div>
      </div>

      <Sheet open={aberto} onClose={() => setAberto(false)} title="Noite passada">
        {aberto && (
          <FormSono inicial={inicial} onSalvar={r => { s.salvarSono(r); setAberto(false); toast.success('Sono registrado'); }} />
        )}
      </Sheet>
    </Card>
  );
}

/* ---------------- Minha rotina ---------------- */

function FormAtividade({ inicial, onSalvar, onRemover }: { inicial: AtividadeRotina; onSalvar: (a: AtividadeRotina) => void; onRemover?: () => void }) {
  const [a, setA] = useState(inicial);
  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">Horário
          <input type="time" value={a.hora} onChange={e => setA({ ...a, hora: e.target.value || a.hora })}
            className="h-[48px] px-2 text-[16px] font-semibold tabular bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
        </label>
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">O que você faz
          <input value={a.titulo} maxLength={60} onChange={e => setA({ ...a, titulo: e.target.value })} placeholder="Ex.: Almoço, faculdade, treino"
            className="h-[48px] px-3 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
        </label>
      </div>
      <div>
        <p className="text-[14px] text-ink-body mb-2">Tipo</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(tipoAtividade) as TipoAtividade[]).map(t => (
            <Pill key={t} icon={tipoAtividade[t].icone} selected={a.tipo === t}
              onClick={() => setA({ ...a, tipo: t, titulo: a.titulo || tipoAtividade[t].label })}>{tipoAtividade[t].label}</Pill>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[14px] text-ink-body mb-2">Dias {a.dias.length === 0 && <span className="text-ink">(todos)</span>}</p>
        <div className="flex gap-1.5 flex-wrap">
          {diasCurtos.map((d, i) => (
            <button key={d} type="button" aria-pressed={a.dias.includes(i)}
              onClick={() => setA({ ...a, dias: a.dias.includes(i) ? a.dias.filter(x => x !== i) : [...a.dias, i].sort() })}
              className={`pressable focus-ring w-11 h-[40px] rounded-[var(--radius-btn)] text-[13px] font-medium border ${
                a.dias.includes(i) ? 'bg-brand-ghost border-brand text-brand' : 'bg-surface border-black/[0.08] text-ink-body'
              }`}>{d}</button>
          ))}
        </div>
      </div>
      <Button variant="primary" icon="check" fullWidth disabled={!a.titulo.trim()} onClick={() => onSalvar({ ...a, titulo: a.titulo.trim() })}>Salvar</Button>
      {onRemover && <Button variant="text" icon="trash" fullWidth className="!text-vermillion" onClick={onRemover}>Remover</Button>}
    </div>
  );
}

function MinhaRotina() {
  const r = useMinhaRotinaStore();
  const [editando, setEditando] = useState<AtividadeRotina | null>(null);
  const hoje = hojeLocal();
  const doDia = atividadesDoDia(r.atividades);
  const outras = r.atividades.filter(a => !doDia.includes(a));
  const agora = new Date();
  const agoraHHMM = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
  const proxima = doDia.find(a => a.hora >= agoraHHMM);

  const nova = (): AtividadeRotina => ({ id: `r${Date.now().toString(36)}`, hora: '12:00', titulo: '', tipo: 'outro', dias: [] });

  return (
    <div className="flex flex-col gap-4">
      <Card animate accent="var(--color-brand-ghost)" padding={16}>
        <p className="text-[14px] text-ink-body leading-relaxed flex gap-2">
          <Icon name="sparkle" size={18} color="var(--color-science)" className="mt-0.5" />
          Conte como é o seu dia. A rotina aparece na tela inicial e dá contexto para o Assistente e a Nutrição ajudarem com treino e alimentação.
        </p>
      </Card>

      {r.atividades.length === 0 ? (
        <Card animate>
          <EmptyState compact illustration={<RestingPerson size={56} />} title="Sua rotina está vazia"
            description="Comece com um modelo e ajuste os horários, ou adicione suas atividades."
            action={<div className="flex flex-col gap-2 w-full">
              <Button variant="primary" icon="plus" onClick={() => setEditando(nova())}>Adicionar atividade</Button>
              <Button variant="ghost" icon="copy" onClick={() => { r.usarModelo(); toast.success('Modelo aplicado: ajuste os horários'); }}>Usar um modelo</Button>
            </div>} />
        </Card>
      ) : (
        <Card animate padding={16}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] font-semibold">Hoje</h3>
            <span className="text-[13px] text-ink-body tabular">{doDia.filter(a => r.feitas.includes(`${hoje}|${a.id}`)).length}/{doDia.length} feitas</span>
          </div>
          {doDia.length === 0 && <p className="text-[14px] text-ink-body">Nada programado para hoje.</p>}
          <ol className="relative">
            {doDia.map((a, i) => {
              const t = tipoAtividade[a.tipo];
              const feita = r.feitas.includes(`${hoje}|${a.id}`);
              const ehProxima = proxima?.id === a.id;
              return (
                <li key={a.id} className="anim-rise relative flex items-center gap-3 min-h-[56px]" style={{ '--i': i } as CSSProperties}>
                  {i < doDia.length - 1 && <span className="absolute left-[21px] top-[40px] bottom-[-12px] w-[2px] bg-black/[0.08]" aria-hidden />}
                  <button type="button" role="checkbox" aria-checked={feita} aria-label={`${a.titulo}: marcar como feita`}
                    onClick={() => r.alternarFeita(a.id)}
                    className="pressable focus-ring relative z-[1] w-[44px] h-[44px] shrink-0 rounded-full border-2 flex items-center justify-center bg-surface transition-colors duration-200"
                    style={{ borderColor: feita ? t.cor : 'rgba(0,0,0,0.15)', background: feita ? `color-mix(in srgb, ${t.cor} 18%, var(--color-surface))` : undefined }}>
                    {feita ? <span className="anim-pop flex"><Icon name="check" size={20} color="var(--color-ink)" strokeWidth={2.4} /></span> : <Icon name={t.icone} size={20} color={t.cor} />}
                  </button>
                  <button type="button" onClick={() => setEditando(a)} className="focus-ring flex-1 min-w-0 min-h-[44px] text-left rounded-[var(--radius-btn)]">
                    <span className={`block text-[15px] font-medium ${feita ? 'text-ink-body line-through' : 'text-ink'}`}>{a.titulo}</span>
                    <span className="block text-[13px] text-ink-body tabular">{a.hora}{ehProxima ? ' · próxima' : ''}</span>
                  </button>
                  {ehProxima && <span className="w-2.5 h-2.5 rounded-full bg-brand pulse shrink-0" aria-hidden />}
                </li>
              );
            })}
          </ol>
          {outras.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[14px] text-brand font-medium min-h-[40px] flex items-center">Outros dias ({outras.length})</summary>
              <ul className="flex flex-col">
                {outras.map(a => (
                  <li key={a.id}>
                    <button type="button" onClick={() => setEditando(a)} className="focus-ring w-full text-left min-h-[44px] flex items-center gap-3 text-[14px]">
                      <span className="tabular text-ink-body w-12">{a.hora}</span>
                      <span className="flex-1">{a.titulo}</span>
                      <span className="text-[12px] text-ink-body">{a.dias.map(d => diasCurtos[d]).join(', ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <Button variant="ghost" icon="plus" fullWidth className="mt-3" onClick={() => setEditando(nova())}>Adicionar atividade</Button>
        </Card>
      )}

      <Card animate padding={16}>
        <label htmlFor="sobre-mim" className="text-[16px] font-semibold text-ink">Sobre o meu dia a dia</label>
        <p className="text-[13px] text-ink-body mt-0.5 mb-2">Trabalho em pé? Treina cansado? Come fora? Quanto mais contexto, melhores as sugestões.</p>
        <textarea id="sobre-mim" rows={4} value={r.sobreMim} maxLength={1200} onChange={e => r.setSobreMim(e.target.value)}
          placeholder="Ex.: trabalho sentado das 8h às 17h, treino à noite e costumo pular o café da manhã."
          className="w-full px-3 py-2.5 rounded-[var(--radius-btn)] bg-canvas card-border text-[15px] text-ink focus:bg-surface transition-colors duration-200" />
        <p className="text-[12px] text-ink-body text-right tabular">{r.sobreMim.length}/1200</p>
      </Card>

      <Sheet open={!!editando} onClose={() => setEditando(null)} title={editando && r.atividades.some(a => a.id === editando.id) ? 'Editar atividade' : 'Nova atividade'}>
        {editando && (
          <FormAtividade
            key={editando.id}
            inicial={editando}
            onSalvar={a => { r.salvarAtividade(a); setEditando(null); toast.success('Rotina atualizada'); }}
            onRemover={r.atividades.some(a => a.id === editando.id) ? () => { r.removerAtividade(editando.id); setEditando(null); } : undefined}
          />
        )}
      </Sheet>
    </div>
  );
}

/* ---------------- Página ---------------- */

type Aba = 'hoje' | 'minha';

export function Rotina() {
  const { habitos, load, incrementar, decrementar, getRegistroHoje, getHistorico, getSequencia } = useRotinaStore();
  const [aba, setAba] = useState<Aba>(() => (sessionStorage.getItem('folio_rotina_aba') === 'minha' ? 'minha' : 'hoje'));
  const [, setTick] = useState(0);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') { load(); setTick(t => t + 1); } };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);
  useEffect(() => { try { sessionStorage.setItem('folio_rotina_aba', aba); } catch { /* ignore */ } }, [aba]);

  const hoje = hojeLocal();
  const titulo = formatDataLonga(parseLocalISODate(hoje));
  const subtitulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  // Água e sono têm cartões próprios (em ml e horas).
  const outros = habitos.filter(h => h.tipo !== 'agua' && h.tipo !== 'sono');

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Rotina" subtitle={subtitulo} className="!mb-0" />

      <div role="tablist" aria-label="Seções da rotina" className="anim-fade grid grid-cols-2 p-1 rounded-[var(--radius-btn)] bg-black/[0.05] gap-1">
        {([['hoje', 'Hoje'], ['minha', 'Minha rotina']] as const).map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={aba === k} onClick={() => setAba(k)}
            className={`pressable focus-ring min-h-[40px] rounded-[6px] text-[14px] font-medium transition-colors duration-200 ${aba === k ? 'bg-surface text-ink card-border' : 'text-ink-body'}`}>
            {t}
          </button>
        ))}
      </div>

      {aba === 'minha' ? <MinhaRotina /> : (
        <>
          <CartaoAgua index={0} />
          <CartaoSono index={1} />

          <h2 className="text-[16px] font-semibold text-ink mt-1 anim-fade">Hábitos</h2>
          {outros.map((habito, idx) => {
            const reg = getRegistroHoje(habito.id);
            const meta = Math.max(1, habito.meta ?? 1);
            const hist = getHistorico(habito.id, 7);
            const completo = reg.valor >= meta;
            const seq = getSequencia(habito.id);
            return (
              <Card key={habito.id} animate index={idx + 2} padding={20}>
                <div className="flex items-center gap-3">
                  <ProgressRing value={reg.valor / meta} color={habito.cor}>
                    <span key={completo ? 'ok' : 'no'} className={completo ? 'anim-pop inline-flex' : 'inline-flex'}>
                      <Icon name={habito.icone} size={22} color="var(--color-ink)" />
                    </span>
                  </ProgressRing>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-semibold">{habito.nome}</h3>
                      {completo && <span className="anim-pop"><Pill color="var(--color-tint-ok)" textColor="var(--color-ok)" icon="check">Meta batida</Pill></span>}
                    </div>
                    <p className="text-[14px] text-ink-body tabular">
                      <span key={reg.valor} className="num-tick font-semibold text-ink">{reg.valor}</span>/{meta} {habito.unidade}
                      {seq > 0 && <span className="ml-2 inline-flex items-center gap-0.5 align-middle"><Icon name="flame" size={14} color="var(--color-saffron)" />{seq}d</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <MiniBarChart dados={hist} cor={habito.cor} meta={meta} nome={habito.nome} />
                  <div className="flex items-center gap-1.5" role="group" aria-label={`Ajustar ${habito.nome}`}>
                    <button type="button" onClick={() => decrementar(habito.id)} disabled={reg.valor <= 0} aria-label={`Diminuir ${habito.nome}`}
                      className="pressable focus-ring w-[44px] h-[44px] rounded-[var(--radius-btn)] bg-surface card-border flex items-center justify-center text-ink disabled:opacity-40 disabled:cursor-not-allowed">
                      <Icon name="minus" size={20} />
                    </button>
                    <button type="button" onClick={() => incrementar(habito.id)} aria-label={`Aumentar ${habito.nome}`}
                      className="pressable focus-ring w-[44px] h-[44px] rounded-[var(--radius-btn)] card-border flex items-center justify-center text-ink"
                      style={{ background: `color-mix(in srgb, ${habito.cor} 16%, var(--color-surface))` }}>
                      <Icon name="plus" size={20} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </>
      )}

      <p className="text-[13px] text-ink-body text-center">Acompanhamento de hábitos não substitui orientação profissional.</p>
    </div>
  );
}
