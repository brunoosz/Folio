import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { respostasIA, artigos } from '../data/ciencia';

type Mensagem = { tipo: 'user' | 'ia'; texto: string; artigos?: string[] };

const sugestoes = respostasIA.map(r => r.pergunta);

export function Assistente() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');

  function enviar(pergunta: string) {
    const q = pergunta.trim();
    if (!q) return;

    const match = respostasIA.find(r =>
      r.pergunta.toLowerCase().includes(q.toLowerCase()) ||
      q.toLowerCase().includes(r.pergunta.toLowerCase().replace('?', ''))
    );

    setMensagens(prev => [
      ...prev,
      { tipo: 'user', texto: q },
      match
        ? { tipo: 'ia', texto: match.resposta, artigos: match.artigos }
        : { tipo: 'ia', texto: 'Ainda não tenho informações sobre esse tema. Consulte sempre um profissional de Educação Física ou nutricionista para orientações personalizadas.' },
    ]);
    setInput('');
  }

  function getArtigo(id: string) {
    return artigos.find(a => a.id === id);
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Assistente</h1>
      <p className="text-[13px] text-ink-muted -mt-2">
        Respostas baseadas em evidências científicas. Sempre consulte um profissional.
      </p>

      {mensagens.length === 0 && (
        <Card>
          <h3 className="text-[15px] font-semibold mb-3">Perguntas frequentes</h3>
          <div className="flex flex-col gap-2">
            {sugestoes.map(s => (
              <button
                key={s}
                onClick={() => enviar(s)}
                className="text-left text-[14px] text-brand py-2 px-3 rounded-[var(--radius-btn)] hover:bg-brand-ghost transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {mensagens.map((m, i) => (
          <div key={i} className={m.tipo === 'user' ? 'flex justify-end' : ''}>
            {m.tipo === 'user' ? (
              <div className="bg-brand text-white px-4 py-3 rounded-[var(--radius-card)] max-w-[85%] text-[14px]">
                {m.texto}
              </div>
            ) : (
              <Card>
                <p className="text-[14px] text-ink-body leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>
                  {m.texto}
                </p>
                {m.artigos && m.artigos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/5 flex flex-col gap-2">
                    <span className="text-[11px] text-ink-muted font-medium uppercase tracking-wide">Referências</span>
                    {m.artigos.map(id => {
                      const art = getArtigo(id);
                      if (!art) return null;
                      return (
                        <div key={id} className="text-[12px] text-ink-muted">
                          <span className="text-science font-medium">{art.fonte}</span> ({art.ano})
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-[80px] left-0 right-0 px-4 pb-2 bg-canvas">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviar(input)}
            placeholder="Faça uma pergunta..."
            className="flex-1 h-[44px] px-4 rounded-[var(--radius-btn)] card-border bg-surface text-[14px] outline-none focus:border-brand/30"
          />
          <button
            onClick={() => enviar(input)}
            className="h-[44px] w-[44px] rounded-[var(--radius-btn)] bg-brand text-white flex items-center justify-center cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
