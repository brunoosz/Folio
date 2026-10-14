import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { repo } from '../data/repository';
import { artigos } from '../data/ciencia';
import { useAuthStore } from '../hooks/useAuthStore';

type Tab = 'catalogo' | 'ia' | 'pdf';

const equipLabels: Record<string, string> = {
  barra_livre: 'Barra livre',
  maquina: 'Máquina',
  haltere: 'Haltere',
  cabo: 'Cabo',
  peso_corporal: 'Peso corporal',
};

export function Admin() {
  const [tab, setTab] = useState<Tab>('catalogo');
  const { usuario } = useAuthStore();
  const exercicios = repo.getExercicios();

  if (usuario?.role !== 'admin') {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <h1 className="text-[24px] font-bold tracking-tight-title mb-4">Acesso restrito</h1>
        <Card>
          <p className="text-[14px] text-ink-body">Apenas administradores podem acessar este painel.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Admin</h1>

      <div className="flex gap-2">
        {([['catalogo', 'Catálogo'], ['ia', 'IA'], ['pdf', 'PDF']] as const).map(([key, label]) => (
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

      {tab === 'catalogo' && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold">Exercícios cadastrados</h3>
              <Pill color="var(--color-brand-ghost)">
                <span className="text-[12px] text-brand">{exercicios.length}</span>
              </Pill>
            </div>
            <div className="flex flex-col gap-2">
              {exercicios.map(ex => {
                const musculos = repo.getMusculosDoExercicio(ex.id);
                return (
                  <div key={ex.id} className="py-2 border-b border-black/5 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium">{ex.nome}</span>
                      <Pill color={ex.revisado ? '#e6f9e8' : '#fff3e0'}>
                        <span className={`text-[11px] ${ex.revisado ? 'text-green-700' : 'text-saffron'}`}>
                          {ex.revisado ? 'Revisado' : 'A revisar'}
                        </span>
                      </Pill>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] text-ink-muted">{equipLabels[ex.equipamento] ?? ex.equipamento}</span>
                      <span className="text-[12px] text-ink-muted">·</span>
                      <span className="text-[12px] text-ink-muted">{musculos.filter(m => m.papel === 'primario').map(m => m.musculo.nome).join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <p className="text-[11px] text-ink-muted text-center">
            Todos os exercícios marcados "A revisar" precisam de validação por profissional de Educação Física.
          </p>
        </>
      )}

      {tab === 'ia' && (
        <>
          <Card>
            <h3 className="text-[15px] font-semibold mb-3">Status do Assistente IA</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ink-body">Modo</span>
                <Pill color="var(--color-brand-ghost)">
                  <span className="text-[12px] text-brand">Mock (offline)</span>
                </Pill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ink-body">Respostas disponíveis</span>
                <span className="text-[14px] font-semibold">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ink-body">Artigos indexados</span>
                <span className="text-[14px] font-semibold">{artigos.length}</span>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-[15px] font-semibold mb-3">Base de conhecimento</h3>
            <div className="flex flex-col gap-2">
              {artigos.map(art => (
                <div key={art.id} className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
                  <span className="text-[13px] text-ink-body truncate mr-2">{art.titulo}</span>
                  <span className="text-[11px] text-ink-muted whitespace-nowrap">{art.ano}</span>
                </div>
              ))}
            </div>
          </Card>
          <p className="text-[11px] text-ink-muted text-center">
            Quando conectado ao Supabase, o assistente usará embeddings para busca semântica.
          </p>
        </>
      )}

      {tab === 'pdf' && (
        <Card>
          <h3 className="text-[15px] font-semibold mb-3">Fila de PDFs</h3>
          <div className="flex flex-col items-center gap-3 py-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p className="text-[14px] text-ink-muted text-center">Nenhum PDF na fila</p>
            <p className="text-[12px] text-ink-muted text-center max-w-[240px]">
              A geração de fichas em PDF estará disponível após integração com Supabase.
            </p>
            <Button variant="ghost" disabled>Gerar PDF (em breve)</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
