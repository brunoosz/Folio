import { getPerfil, perfilParaTexto, usePerfilStore } from '../hooks/usePerfilStore';
import { useAguaSonoStore, aguaSonoParaTexto, metaAgua } from '../hooks/useAguaSonoStore';
import { useExamesStore } from '../hooks/useExamesStore';
import { statusResultado, valorParaTexto } from './exames';
import { useMinhaRotinaStore, rotinaParaTexto } from '../hooks/useMinhaRotinaStore';

/**
 * Resumo do que o usuário informou (perfil, rotina, sono e água) para dar contexto à IA.
 * Só entra o que existe; nada é enviado se o usuário não autorizou dados de saúde.
 */
export function contextoUsuario(): string {
  const partes: string[] = [];
  if (usePerfilStore.getState().consentimentoSaude) {
    const perfil = getPerfil();
    const p = perfilParaTexto(perfil);
    if (p) partes.push(p);
    const as = useAguaSonoStore.getState();
    partes.push(aguaSonoParaTexto(as, metaAgua(as.metaAguaMl, perfil.pesoKg)));
    // Último exame: só os itens fora da faixa (resumo curto).
    const ultimo = [...useExamesStore.getState().exames].sort((a, b) => b.data.localeCompare(a.data))[0];
    if (ultimo) {
      const fora = ultimo.resultados.filter(r => !['normal', 'sem_ref'].includes(statusResultado(r, perfil.sexo)));
      partes.push(`último exame (${ultimo.data}): ${fora.length ? `fora da faixa — ${fora.slice(0, 8).map(r => `${r.nome} ${valorParaTexto(r)}`).join(', ')}` : 'resultados dentro da faixa'}`);
    }
  }
  const r = useMinhaRotinaStore.getState();
  const rot = rotinaParaTexto(r.atividades, r.sobreMim);
  if (rot) partes.push(rot);
  return partes.filter(Boolean).join('; ');
}
