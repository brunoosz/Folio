import { useState } from 'react';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import { Pill } from './ui/Pill';
import { Icon } from './ui/Icon';
import { toast } from './ui/Toast';
import { ExerciseFigure } from './ExerciseFigure';
import { repo } from '../data/repository';
import { equipLabels, dificLabels, posturaLabels, articulacaoLabels, estresseLabels, papelLabels, papelColors } from '../data/catalogo';
import type {
  Articulacao, Dificuldade, Equipamento, Exercicio, MusculoPapel, NivelEstresse, PadraoMovimento, Postura,
} from '../data/types';

const PADROES: { v: PadraoMovimento; t: string }[] = [
  ['agachamento', 'Agachamento'], ['leg_press', 'Leg press'], ['avanco', 'Avanço / búlgaro'], ['extensao_joelho', 'Extensão de joelho'],
  ['flexao_joelho_deitado', 'Flexão de joelho (deitado)'], ['flexao_joelho_sentado', 'Flexão de joelho (sentado)'], ['hinge', 'Dobradiça de quadril (stiff/terra)'],
  ['elevacao_pelvica', 'Elevação pélvica'], ['panturrilha_em_pe', 'Panturrilha em pé'], ['panturrilha_sentado', 'Panturrilha sentado'],
  ['abducao_quadril', 'Abdução de quadril'], ['aducao_quadril', 'Adução de quadril'], ['coice', 'Coice'],
  ['supino', 'Supino reto'], ['supino_inclinado', 'Supino inclinado'], ['supino_declinado', 'Supino declinado'], ['crucifixo', 'Crucifixo'],
  ['crossover', 'Crossover'], ['peck_deck', 'Voador'], ['flexao_bracos', 'Flexão de braços'], ['mergulho', 'Mergulho'], ['chest_press', 'Supino máquina'],
  ['remada_curvada', 'Remada curvada'], ['remada_sentada', 'Remada sentada'], ['remada_unilateral', 'Remada unilateral'], ['puxada', 'Puxada'],
  ['barra_fixa', 'Barra fixa'], ['pulldown_estendido', 'Pulldown braços estendidos'], ['hiperextensao', 'Hiperextensão'],
  ['desenvolvimento', 'Desenvolvimento'], ['elevacao_lateral', 'Elevação lateral'], ['elevacao_frontal', 'Elevação frontal'],
  ['crucifixo_inverso', 'Crucifixo inverso'], ['face_pull', 'Face pull'], ['encolhimento', 'Encolhimento'], ['rotacao_externa', 'Rotação externa'],
  ['rosca', 'Rosca'], ['rosca_scott', 'Rosca Scott'], ['rosca_inclinada', 'Rosca inclinada'], ['triceps_polia', 'Tríceps na polia'],
  ['triceps_testa', 'Tríceps testa'], ['triceps_frances', 'Tríceps francês'], ['triceps_banco', 'Tríceps no banco'], ['rosca_punho', 'Rosca de punho'],
  ['abdominal', 'Abdominal'], ['elevacao_pernas', 'Elevação de pernas'], ['prancha', 'Prancha'], ['prancha_lateral', 'Prancha lateral'], ['rotacao_tronco', 'Rotação de tronco'],
].map(([v, t]) => ({ v: v as PadraoMovimento, t }));

const PAPEIS: MusculoPapel[] = ['primario', 'secundario', 'estabilizador'];
const campo = 'w-full h-[44px] px-3 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface';

function novoExercicio(): Exercicio {
  return {
    id: `exu_${Date.now().toString(36)}`, nome: '', equipamento: 'maquina', dificuldade: 'basico', notasSeguranca: '', revisado: false,
    padrao: 'supino', postura: 'sentado', execucao: [], estresse: { lombar: 0, joelho: 0, ombro: 0, cotovelo: 0 },
  };
}

/** Criação/edição de exercício do catálogo (admin). */
export function EditorExercicio({ exercicioId, aberto, onClose, onSalvo }: {
  exercicioId: string | null; aberto: boolean; onClose: () => void; onSalvo: () => void;
}) {
  return (
    <Sheet open={aberto} onClose={onClose} title={exercicioId ? 'Editar exercício' : 'Novo exercício'}>
      {aberto && <Form key={exercicioId ?? 'novo'} exercicioId={exercicioId} onClose={onClose} onSalvo={onSalvo} />}
    </Sheet>
  );
}

function Form({ exercicioId, onClose, onSalvo }: { exercicioId: string | null; onClose: () => void; onSalvo: () => void }) {
  const original = exercicioId ? repo.getExercicio(exercicioId) : undefined;
  const [ex, setEx] = useState<Exercicio>(() => original ? { ...original, estresse: { ...original.estresse } } : novoExercicio());
  const [passos, setPassos] = useState(() => (original?.execucao ?? []).join('\n'));
  const [seguranca, setSeguranca] = useState(() => (original?.notasSeguranca ?? '').replace(/\s*A revisar por profissional\.?$/, ''));
  const [rel, setRel] = useState<Record<string, MusculoPapel>>(() =>
    Object.fromEntries(exercicioId ? repo.getMusculosDoExercicio(exercicioId).map(m => [m.musculoId, m.papel]) : []));
  const ehBase = exercicioId ? repo.ehExercicioBase(exercicioId) : false;
  const editadoBase = exercicioId ? repo.exercicioFoiEditado(exercicioId) : false;

  const alternarMusculo = (id: string) => setRel(r => {
    const atual = r[id];
    const copia = { ...r };
    if (!atual) copia[id] = 'primario';
    else {
      const prox = PAPEIS[PAPEIS.indexOf(atual) + 1];
      if (prox) copia[id] = prox; else delete copia[id];
    }
    return copia;
  });

  const salvar = () => {
    const nome = ex.nome.trim();
    if (!nome) { toast.error('Dê um nome ao exercício.'); return; }
    if (!Object.values(rel).includes('primario')) { toast.error('Marque pelo menos um músculo primário.'); return; }
    const final: Exercicio = {
      ...ex,
      nome,
      execucao: passos.split('\n').map(s => s.trim()).filter(Boolean),
      notasSeguranca: `${seguranca.trim()}${ex.revisado ? '' : ' A revisar por profissional.'}`.trim(),
    };
    repo.salvarExercicio(final, Object.entries(rel).map(([musculoId, papel]) => ({ musculoId, papel })));
    toast.success(exercicioId ? 'Exercício atualizado' : 'Exercício criado');
    onSalvo();
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex justify-center rounded-[var(--radius-card)] bg-canvas">
        <ExerciseFigure padrao={ex.padrao} postura={ex.postura} equipamento={ex.equipamento} size={150} />
      </div>

      <label className="flex flex-col gap-1 text-[14px] text-ink-body">Nome
        <input value={ex.nome} maxLength={60} onChange={e => setEx({ ...ex, nome: e.target.value })} className={campo} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">Equipamento
          <select value={ex.equipamento} onChange={e => setEx({ ...ex, equipamento: e.target.value as Equipamento })} className={campo}>
            {(Object.keys(equipLabels) as Equipamento[]).map(k => <option key={k} value={k}>{equipLabels[k]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">Dificuldade
          <select value={ex.dificuldade} onChange={e => setEx({ ...ex, dificuldade: e.target.value as Dificuldade })} className={campo}>
            {(Object.keys(dificLabels) as Dificuldade[]).map(k => <option key={k} value={k}>{dificLabels[k]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">Movimento (animação)
          <select value={ex.padrao} onChange={e => setEx({ ...ex, padrao: e.target.value as PadraoMovimento })} className={campo}>
            {PADROES.map(p => <option key={p.v} value={p.v}>{p.t}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">Postura
          <select value={ex.postura} onChange={e => setEx({ ...ex, postura: e.target.value as Postura })} className={campo}>
            {(Object.keys(posturaLabels) as Postura[]).map(k => <option key={k} value={k}>{posturaLabels[k]}</option>)}
          </select>
        </label>
      </div>

      <div>
        <p className="text-[14px] font-medium text-ink">Músculos</p>
        <p className="text-[13px] text-ink-body mb-2">Toque para alternar: primário → secundário → estabilizador → nenhum.</p>
        {repo.getGrupos().map(g => (
          <div key={g.id} className="mb-2">
            <p className="text-[12px] font-semibold text-ink-body uppercase tracking-wide mb-1">{g.nome}</p>
            <div className="flex flex-wrap gap-1.5">
              {repo.getMusculosDoGrupo(g.id).map(m => {
                const papel = rel[m.id];
                return (
                  <button key={m.id} type="button" onClick={() => alternarMusculo(m.id)} aria-pressed={!!papel}
                    className="pressable focus-ring min-h-[36px] px-3 rounded-[var(--radius-pill)] border text-[13px] font-medium inline-flex items-center gap-1.5"
                    style={{ borderColor: papel ? papelColors[papel] : 'rgba(0,0,0,0.1)', background: papel ? `color-mix(in srgb, ${papelColors[papel]} 14%, var(--color-surface))` : 'var(--color-surface)' }}>
                    {papel && <span className="w-2 h-2 rounded-full" style={{ background: papelColors[papel] }} />}
                    {m.nome.replace(`${g.nome} — `, '')}
                    {papel && <span className="text-ink-body font-normal">· {papelLabels[papel].toLowerCase()}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[14px] font-medium text-ink mb-2">Exigência articular</p>
        {(Object.keys(articulacaoLabels) as Articulacao[]).map(a => (
          <div key={a} className="flex items-center justify-between gap-2 min-h-[44px]">
            <span className="text-[14px]">{articulacaoLabels[a]}</span>
            <div className="flex gap-1">
              {([0, 1, 2] as NivelEstresse[]).map(n => (
                <Pill key={n} selected={ex.estresse[a] === n} onClick={() => setEx({ ...ex, estresse: { ...ex.estresse, [a]: n } })}>{estresseLabels[n]}</Pill>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-[14px] text-ink-body">Como executar (um passo por linha)
        <textarea rows={4} value={passos} onChange={e => setPassos(e.target.value)} className="px-3 py-2.5 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
      </label>
      <label className="flex flex-col gap-1 text-[14px] text-ink-body">Cuidados
        <textarea rows={3} value={seguranca} onChange={e => setSeguranca(e.target.value)} className="px-3 py-2.5 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
      </label>

      <label className="flex items-start gap-3 p-3 rounded-[var(--radius-btn)] bg-canvas cursor-pointer">
        <input type="checkbox" checked={ex.revisado} onChange={e => setEx({ ...ex, revisado: e.target.checked })} className="mt-0.5 w-5 h-5 accent-[var(--color-brand)]" />
        <span className="text-[14px] text-ink-body"><strong className="text-ink">Revisado por profissional</strong> de Educação Física ou fisioterapia.</span>
      </label>

      <Button variant="primary" icon="check" fullWidth onClick={salvar}>Salvar exercício</Button>
      {exercicioId && (!ehBase || editadoBase) && (
        <Button variant="text" icon={ehBase ? 'refresh' : 'trash'} fullWidth className="!text-vermillion" onClick={() => {
          repo.removerOuRestaurarExercicio(exercicioId);
          toast.success(ehBase ? 'Exercício restaurado ao original' : 'Exercício removido');
          onSalvo();
          onClose();
        }}>
          {ehBase ? 'Desfazer minhas edições' : 'Excluir exercício'}
        </Button>
      )}
      <p className="text-[12px] text-ink-body flex gap-1.5"><Icon name="info" size={14} className="mt-0.5" />Alterações ficam neste aparelho até a integração com o banco de dados.</p>
    </div>
  );
}
