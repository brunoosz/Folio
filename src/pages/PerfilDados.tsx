import { type CSSProperties } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { NumberInput } from '../components/ui/NumberInput';
import { Pill } from '../components/ui/Pill';
import { toast } from '../components/ui/Toast';
import {
  usePerfilStore, sexoLabels, experienciaLabels, objetivoLabels, lesaoLabels, localLabels, imc,
  type Sexo, type Experiencia, type Objetivo, type Lesao, type LocalTreino,
} from '../hooks/usePerfilStore';

function Grupo<T extends string>({
  titulo, opcoes, valor, onChange, index,
}: { titulo: string; opcoes: Record<T, string>; valor: T | null; onChange: (v: T | null) => void; index: number }) {
  return (
    <Card animate index={index} padding={20}>
      <h2 className="text-[15px] font-semibold text-ink mb-3">{titulo}</h2>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={titulo}>
        {(Object.keys(opcoes) as T[]).map(k => (
          <Pill key={k} selected={valor === k} onClick={() => onChange(valor === k ? null : k)}>{opcoes[k]}</Pill>
        ))}
      </div>
    </Card>
  );
}

/** Edição da "base de conhecimento" do usuário (respostas da pesquisa inicial). */
export function PerfilDados() {
  const p = usePerfilStore();
  const valorImc = imc(p);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-3">
      <PageHeader title="Meus dados" subtitle="Usados para sugerir cargas e dar contexto à IA" back className="!mb-1" />

      {!p.consentimentoSaude && (
        <Card animate accent="var(--color-tint-warn)" padding={16}>
          <p className="text-[14px] text-ink-body leading-relaxed">
            Para salvar dados de saúde, autorize o armazenamento neste aparelho.
          </p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => p.setConsentimento(true)}>Autorizar</Button>
        </Card>
      )}

      <Card animate index={0} padding={20}>
        <h2 className="text-[15px] font-semibold text-ink mb-3">Medidas</h2>
        <div className="grid grid-cols-3 gap-3">
          <NumberInput id="pd-idade" label="Idade" unit="anos" min={12} max={100} value={p.idade}
            disabled={!p.consentimentoSaude} onChange={v => p.atualizar({ idade: v === null ? null : Math.round(v) })} />
          <NumberInput id="pd-altura" label="Altura" unit="cm" min={100} max={230} value={p.alturaCm}
            disabled={!p.consentimentoSaude} onChange={v => p.atualizar({ alturaCm: v === null ? null : Math.round(v) })} />
          <NumberInput id="pd-peso" label="Peso" unit="kg" decimal min={30} max={300} value={p.pesoKg}
            disabled={!p.consentimentoSaude} onChange={v => p.atualizar({ pesoKg: v })} />
        </div>
        {valorImc && (
          <p className="text-[13px] text-ink-body mt-3">
            IMC aproximado <strong className="text-ink tabular">{String(valorImc).replace('.', ',')}</strong> · referência geral, não avalia composição corporal.
          </p>
        )}
      </Card>

      <Grupo<Sexo> index={1} titulo="Sexo biológico" opcoes={sexoLabels} valor={p.sexo} onChange={v => p.atualizar({ sexo: v })} />
      <Grupo<Experiencia> index={2} titulo="Experiência" opcoes={experienciaLabels} valor={p.experiencia} onChange={v => p.atualizar({ experiencia: v })} />
      <Grupo<Objetivo> index={3} titulo="Objetivo" opcoes={objetivoLabels} valor={p.objetivo} onChange={v => p.atualizar({ objetivo: v })} />
      <Grupo<LocalTreino> index={4} titulo="Onde treina" opcoes={localLabels} valor={p.local} onChange={v => p.atualizar({ local: v })} />

      <Card animate index={5} padding={20}>
        <h2 className="text-[15px] font-semibold text-ink mb-1">Lesões e restrições</h2>
        <p className="text-[13px] text-ink-body mb-3">Destacamos exercícios com menor estresse nessas regiões na troca de exercício.</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(lesaoLabels) as Lesao[]).map(l => (
            <Pill key={l} selected={p.lesoes.includes(l)}
              onClick={() => p.atualizar({ lesoes: p.lesoes.includes(l) ? p.lesoes.filter(x => x !== l) : [...p.lesoes, l] })}>
              {lesaoLabels[l]}
            </Pill>
          ))}
        </div>
      </Card>

      <div className="anim-fade flex flex-col gap-2 pt-2" style={{ animationDelay: '300ms' } as CSSProperties}>
        <Button variant="primary" fullWidth icon="check" onClick={() => { toast.success('Dados salvos'); history.back(); }}>
          Salvar
        </Button>
        <Button variant="text" fullWidth icon="refresh" onClick={() => p.refazerPesquisa()}>Refazer a pesquisa inicial</Button>
      </div>
    </div>
  );
}
