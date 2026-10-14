/**
 * Datas no fuso LOCAL do aparelho.
 * Nunca use `toISOString().slice(0, 10)` para "hoje": ele usa UTC e, no Brasil
 * (UTC-3), vira o dia seguinte a partir das 21h.
 */

/** Data local no formato AAAA-MM-DD. */
export function toLocalISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Hoje (local), AAAA-MM-DD. */
export function hojeLocal(): string {
  return toLocalISODate(new Date());
}

/** Converte AAAA-MM-DD em Date à meia-noite local. */
export function parseLocalISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Soma (ou subtrai) dias a uma data AAAA-MM-DD, retornando AAAA-MM-DD local. */
export function addDiasISO(iso: string, dias: number): string {
  const d = parseLocalISODate(iso);
  d.setDate(d.getDate() + dias);
  return toLocalISODate(d);
}

/** "quarta-feira, 14 de outubro" */
export function formatDataLonga(d: Date = new Date()): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "14 de out." */
export function formatDataCurta(d: Date = new Date()): string {
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

/** Saudação conforme o horário local. */
export function saudacao(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
