import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button, IconButton } from '../components/ui/Button';
import { Icon, type IconName } from '../components/ui/Icon';
import { NumberInput } from '../components/ui/NumberInput';
import { OptionCard } from '../components/ui/OptionCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AvatarMark } from '../components/ui/AvatarMark';
import { ExercisingPerson, Sparkle } from '../components/illustrations';
import {
  usePerfilStore, sexoLabels, experienciaLabels, objetivoLabels, lesaoLabels, localLabels, imc,
  type Sexo, type Experiencia, type Objetivo, type Lesao, type LocalTreino,
} from '../hooks/usePerfilStore';
import { useAuthStore } from '../hooks/useAuthStore';

const PASSOS = ['intro', 'sexo', 'idade', 'medidas', 'experiencia', 'objetivo', 'lesoes', 'local', 'fim'] as const;
type Passo = (typeof PASSOS)[number];

const iconesExperiencia: Record<Experiencia, IconName> = { nunca: 'sparkle', iniciante: 'play', treina: 'dumbbell', voltando: 'refresh' };
const iconesObjetivo: Record<Objetivo, IconName> = {
  hipertrofia: 'dumbbell', forca: 'trophy', emagrecimento: 'flame', saude: 'heart', condicionamento: 'activity',
};
const iconesLocal: Record<LocalTreino, IconName> = { academia: 'dumbbell', casa_halteres: 'home', peso_corporal: 'body' };

function Pergunta({ titulo, ajuda, children }: { titulo: string; ajuda?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="anim-rise">
        <h1 className="text-[24px] font-bold text-ink tracking-tight-title leading-tight">{titulo}</h1>
        {ajuda && <p className="text-[15px] text-ink-body mt-1.5 leading-relaxed">{ajuda}</p>}
      </div>
      {children}
    </div>
  );
}

/** Pesquisa inicial curta: forma a base de conhecimento do usuário. Tudo é opcional. */
export function Onboarding() {
  const perfil = usePerfilStore();
  const nome = useAuthStore(s => s.usuario?.nome?.split(' ')[0]);
  const [i, setI] = useState(0);
  const [consent, setConsent] = useState(perfil.consentimentoSaude);
  const passo: Passo = PASSOS[i];
  const perguntas = PASSOS.length - 2;

  const ir = (n: number) => setI(Math.max(0, Math.min(PASSOS.length - 1, n)));
  const proximo = () => ir(i + 1);
  /** Escolha única: marca e avança sozinho após o feedback visual. */
  const escolher = (fn: () => void) => { fn(); window.setTimeout(proximo, 240); };

  const pularTudo = () => perfil.concluirPesquisa();
  const comecar = () => { perfil.setConsentimento(true); proximo(); };

  const valorImc = imc(perfil);

  return (
    <div className="min-h-dvh bg-canvas flex flex-col">
      <div className="w-full max-w-lg mx-auto px-4 pt-4 flex flex-col flex-1 pb-[calc(24px+env(safe-area-inset-bottom))]">
        {/* Topo: voltar, progresso, pular */}
        {passo !== 'intro' && passo !== 'fim' && (
          <div className="flex items-center gap-2 mb-6 anim-fade">
            <IconButton icon="chevron-left" label="Voltar" onClick={() => ir(i - 1)} className="-ml-2" />
            <div className="flex-1">
              <ProgressBar value={i / perguntas} height={6} label="Progresso da pesquisa" />
              <p className="text-[12px] text-ink-body mt-1 tabular">{i} de {perguntas}</p>
            </div>
            <Button variant="text" size="sm" onClick={proximo}>Pular</Button>
          </div>
        )}

        <div key={passo} className="flex-1 flex flex-col">
          {passo === 'intro' && (
            <div className="flex-1 flex flex-col justify-center gap-6 py-6">
              <div className="flex justify-center anim-scale">
                <div className="relative">
                  <AvatarMark accentColor="var(--color-muscle)" size={104} animate>
                    <span className="illo-float flex"><ExercisingPerson size={64} /></span>
                  </AvatarMark>
                  <span className="absolute -top-1 -right-3 anim-pop" style={{ animationDelay: '300ms' }}><Sparkle size={22} /></span>
                </div>
              </div>
              <div className="text-center anim-rise" style={{ '--i': 2 } as CSSProperties}>
                <h1 className="text-[26px] font-bold tracking-tight-title text-ink">
                  {nome ? `Olá, ${nome}!` : 'Olá!'} Uma breve pesquisa
                </h1>
                <p className="text-[15px] text-ink-body mt-2 leading-relaxed">
                  São 7 perguntas rápidas sobre você e seu treino. Com elas o Folio sugere cargas iniciais, ajusta a progressão e dá
                  contexto para a IA. Pule qualquer uma que não souber.
                </p>
              </div>

              <label
                className="anim-rise flex items-start gap-3 p-4 rounded-[var(--radius-card)] bg-surface card-border cursor-pointer"
                style={{ '--i': 3 } as CSSProperties}
              >
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 w-5 h-5 accent-[var(--color-brand)] shrink-0"
                />
                <span className="text-[14px] text-ink-body leading-relaxed">
                  Concordo em guardar estes dados de saúde <strong className="text-ink">apenas neste aparelho</strong> para personalizar o
                  app. Posso apagá-los ou exportá-los a qualquer momento em Configurações.
                </span>
              </label>

              <div className="flex flex-col gap-2 anim-rise" style={{ '--i': 4 } as CSSProperties}>
                <Button variant="primary" fullWidth iconRight="chevron-right" disabled={!consent} onClick={comecar}>
                  Começar
                </Button>
                <Button variant="text" fullWidth onClick={pularTudo}>Pular pesquisa</Button>
              </div>
            </div>
          )}

          {passo === 'sexo' && (
            <Pergunta titulo="Qual é o seu sexo biológico?" ajuda="Ajuda a estimar cargas iniciais e a projeção de progresso.">
              <div className="flex flex-col gap-2" role="radiogroup">
                {(Object.keys(sexoLabels) as Sexo[]).map((s, k) => (
                  <OptionCard key={s} index={k + 1} selected={perfil.sexo === s} title={sexoLabels[s]}
                    onClick={() => escolher(() => perfil.atualizar({ sexo: s }))} />
                ))}
              </div>
            </Pergunta>
          )}

          {passo === 'idade' && (
            <Pergunta titulo="Quantos anos você tem?">
              <div className="anim-rise" style={{ '--i': 1 } as CSSProperties}>
                <NumberInput id="ob-idade" label="Idade" hideLabel size="lg" unit="anos" min={12} max={100}
                  value={perfil.idade} onChange={v => perfil.atualizar({ idade: v === null ? null : Math.round(v) })} />
              </div>
            </Pergunta>
          )}

          {passo === 'medidas' && (
            <Pergunta titulo="Altura e peso" ajuda="Se não souber agora, pode pular e preencher depois no Perfil.">
              <div className="grid grid-cols-2 gap-3 anim-rise" style={{ '--i': 1 } as CSSProperties}>
                <NumberInput id="ob-altura" label="Altura" size="lg" unit="cm" min={100} max={230}
                  value={perfil.alturaCm} onChange={v => perfil.atualizar({ alturaCm: v === null ? null : Math.round(v) })} />
                <NumberInput id="ob-peso" label="Peso" size="lg" unit="kg" decimal min={30} max={300}
                  value={perfil.pesoKg} onChange={v => perfil.atualizar({ pesoKg: v })} />
              </div>
              {valorImc && (
                <p className="anim-fade text-[13px] text-ink-body">
                  IMC aproximado: <strong className="text-ink tabular">{String(valorImc).replace('.', ',')}</strong>. É só uma referência
                  geral e não avalia composição corporal.
                </p>
              )}
            </Pergunta>
          )}

          {passo === 'experiencia' && (
            <Pergunta titulo="Como está sua experiência com treino?">
              <div className="flex flex-col gap-2" role="radiogroup">
                {(Object.keys(experienciaLabels) as Experiencia[]).map((e, k) => (
                  <OptionCard key={e} index={k + 1} icon={iconesExperiencia[e]} color="var(--color-muscle)"
                    selected={perfil.experiencia === e} title={experienciaLabels[e]}
                    onClick={() => escolher(() => perfil.atualizar({ experiencia: e }))} />
                ))}
              </div>
            </Pergunta>
          )}

          {passo === 'objetivo' && (
            <Pergunta titulo="Qual é o seu principal objetivo?">
              <div className="flex flex-col gap-2" role="radiogroup">
                {(Object.keys(objetivoLabels) as Objetivo[]).map((o, k) => (
                  <OptionCard key={o} index={k + 1} icon={iconesObjetivo[o]} color="var(--color-science)"
                    selected={perfil.objetivo === o} title={objetivoLabels[o]}
                    onClick={() => escolher(() => perfil.atualizar({ objetivo: o }))} />
                ))}
              </div>
            </Pergunta>
          )}

          {passo === 'lesoes' && (
            <Pergunta titulo="Tem alguma lesão ou restrição?" ajuda="Usamos isso para destacar exercícios com menor estresse nessas regiões. Não substitui avaliação profissional.">
              <div className="flex flex-col gap-2">
                <OptionCard index={1} kind="multi" selected={perfil.lesoes.length === 0} title="Nenhuma"
                  onClick={() => perfil.atualizar({ lesoes: [] })} />
                {(Object.keys(lesaoLabels) as Lesao[]).map((l, k) => (
                  <OptionCard key={l} index={k + 2} kind="multi" selected={perfil.lesoes.includes(l)} title={lesaoLabels[l]}
                    onClick={() => perfil.atualizar({
                      lesoes: perfil.lesoes.includes(l) ? perfil.lesoes.filter(x => x !== l) : [...perfil.lesoes, l],
                    })} />
                ))}
              </div>
            </Pergunta>
          )}

          {passo === 'local' && (
            <Pergunta titulo="Onde você costuma treinar?">
              <div className="flex flex-col gap-2" role="radiogroup">
                {(Object.keys(localLabels) as LocalTreino[]).map((l, k) => (
                  <OptionCard key={l} index={k + 1} icon={iconesLocal[l]} color="var(--color-routine)"
                    selected={perfil.local === l} title={localLabels[l]}
                    onClick={() => escolher(() => perfil.atualizar({ local: l }))} />
                ))}
              </div>
            </Pergunta>
          )}

          {passo === 'fim' && (
            <div className="flex-1 flex flex-col justify-center items-center text-center gap-5 py-6">
              <div className="relative anim-scale">
                <AvatarMark accentColor="var(--color-science)" size={96} animate>
                  <Icon name="check" size={44} color="var(--color-science)" strokeWidth={2.4} />
                </AvatarMark>
                <span className="absolute -top-2 -left-3 anim-pop" style={{ animationDelay: '240ms' }}><Sparkle size={20} /></span>
                <span className="absolute bottom-0 -right-4 anim-pop" style={{ animationDelay: '360ms' }}><Sparkle size={16} color="var(--color-muscle)" /></span>
              </div>
              <div className="anim-rise" style={{ '--i': 2 } as CSSProperties}>
                <h1 className="text-[24px] font-bold tracking-tight-title text-ink">Tudo pronto!</h1>
                <p className="text-[15px] text-ink-body mt-2 leading-relaxed max-w-[340px]">
                  Suas respostas ficam no Perfil e podem ser alteradas quando quiser. As sugestões do app são referências:
                  ajustes individuais devem ser feitos com um profissional.
                </p>
              </div>
              <Button variant="primary" fullWidth className="anim-rise max-w-[360px]" style={{ '--i': 3 } as CSSProperties}
                iconRight="chevron-right" onClick={() => perfil.concluirPesquisa()}>
                Ir para o Folio
              </Button>
            </div>
          )}
        </div>

        {['idade', 'medidas', 'lesoes'].includes(passo) && (
          <Button variant="primary" fullWidth iconRight="chevron-right" onClick={proximo} className="mt-6 anim-fade">
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}
