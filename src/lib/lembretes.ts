/**
 * Lembretes (água, hora de dormir, remédios, treino).
 *
 * - Android (Capacitor): notificações locais agendadas no sistema — chegam com o app fechado.
 * - PC (Electron) e navegador: a API de Notificações, disparada por um agendador interno
 *   enquanto o Folio estiver aberto (no Windows ele continua na bandeja ao fechar a janela).
 */
import { Capacitor } from '@capacitor/core';
import { useLembretesStore, type LembretesConfig } from '../hooks/useLembretesStore';
import { useMedicamentosStore, type Medicamento } from '../hooks/useMedicamentosStore';
import { useAguaSonoStore, aguaDoDia, metaAgua } from '../hooks/useAguaSonoStore';
import { usePerfilStore } from '../hooks/usePerfilStore';
import { hojeLocal } from '../data/date';

export type TipoLembrete = 'agua' | 'dormir' | 'remedio' | 'treino';

export interface Lembrete {
  chave: string;
  tipo: TipoLembrete;
  titulo: string;
  corpo: string;
  hhmm: string;
  /** Dias da semana (0=dom). Vazio = todos. */
  dias: number[];
  medId?: string;
}

const CANAL = 'lembretes';

export const ehNativo = () => Capacitor.isNativePlatform();

const minutos = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const hhmmDe = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Lista de lembretes diários a partir das preferências e dos remédios cadastrados. */
export function montarLembretes(cfg: LembretesConfig, meds: Medicamento[]): Lembrete[] {
  if (!cfg.ativo) return [];
  const out: Lembrete[] = [];
  if (cfg.agua.ativo) {
    const ini = minutos(cfg.agua.inicio), fim = minutos(cfg.agua.fim);
    const passo = Math.max(30, cfg.agua.intervaloMin);
    for (let t = ini, n = 0; t <= fim && n < 16; t += passo, n++) {
      out.push({ chave: `agua-${t}`, tipo: 'agua', titulo: 'Hora de beber água', corpo: 'Um copo agora ajuda a bater a meta de hoje.', hhmm: hhmmDe(t), dias: [] });
    }
  }
  if (cfg.dormir.ativo) {
    out.push({ chave: 'dormir', tipo: 'dormir', titulo: 'Hora de desacelerar', corpo: `Seu horário de dormir (${cfg.dormir.hora}) está chegando. Diminua telas e luzes.`, hhmm: hhmmDe(Math.max(0, minutos(cfg.dormir.hora) - 30)), dias: [] });
  }
  if (cfg.remedios.ativo) {
    for (const m of meds.filter(x => x.ativo)) {
      for (const h of m.horarios) {
        out.push({
          chave: `med-${m.id}-${h}`, tipo: 'remedio', medId: m.id, titulo: `Remédio: ${m.nome}`,
          corpo: [m.dose, m.obs].filter(Boolean).join(' · ') || `Horário das ${h}`, hhmm: h, dias: m.dias,
        });
      }
    }
  }
  if (cfg.treino.ativo && cfg.treino.dias.length) {
    out.push({ chave: 'treino', tipo: 'treino', titulo: 'Hora do treino', corpo: 'Seu treino de hoje está esperando no Folio.', hhmm: cfg.treino.hora, dias: cfg.treino.dias });
  }
  return out;
}

/** ID numérico estável (o Android exige inteiros de 32 bits). */
function idNumerico(chave: string) {
  let h = 7;
  for (let i = 0; i < chave.length; i++) h = (h * 31 + chave.charCodeAt(i)) | 0;
  return Math.abs(h) % 2_000_000_000 + 1;
}

/* ---------------- Permissão ---------------- */

export type Permissao = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function verificarPermissao(): Promise<Permissao> {
  if (ehNativo()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const r = await LocalNotifications.checkPermissions();
    return r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'prompt';
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission === 'default' ? 'prompt' : Notification.permission;
}

export async function pedirPermissao(): Promise<Permissao> {
  if (ehNativo()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const r = await LocalNotifications.requestPermissions();
    return r.display === 'granted' ? 'granted' : 'denied';
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  const r = await Notification.requestPermission();
  return r === 'default' ? 'prompt' : r;
}

/* ---------------- Exibir ---------------- */

export async function mostrarNotificacao(titulo: string, corpo: string, tag?: string) {
  if (ehNativo()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({ notifications: [{ id: idNumerico(`teste-${Date.now()}`), title: titulo, body: corpo, channelId: CANAL, schedule: { at: new Date(Date.now() + 1500), allowWhileIdle: true } }] });
    return;
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') throw new Error('sem permissão');
  const opcoes: NotificationOptions = { body: corpo, icon: './icon-192.png', badge: './icon-192.png', tag };
  const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration().catch(() => undefined) : undefined;
  if (reg) { await reg.showNotification(titulo, opcoes); return; }
  const n = new Notification(titulo, opcoes);
  n.onclick = () => { window.focus(); n.close(); };
}

/* ---------------- Android: agendamento no sistema ---------------- */

let ultimaAssinatura = '';

export async function sincronizarNativo(forcar = false) {
  if (!ehNativo()) return;
  const lista = montarLembretes(useLembretesStore.getState(), useMedicamentosStore.getState().medicamentos);
  const assinatura = JSON.stringify(lista);
  if (!forcar && assinatura === ultimaAssinatura) return;
  ultimaAssinatura = assinatura;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.createChannel({ id: CANAL, name: 'Lembretes', description: 'Água, sono, remédios e treino', importance: 4, vibration: true }).catch(() => undefined);
  const pendentes = await LocalNotifications.getPending();
  if (pendentes.notifications.length) await LocalNotifications.cancel({ notifications: pendentes.notifications.map(n => ({ id: n.id })) });
  if (!lista.length) return;
  if ((await verificarPermissao()) !== 'granted') return;
  const notificacoes = lista.flatMap(l => {
    const [hour, minute] = l.hhmm.split(':').map(Number);
    const base = { title: l.titulo, body: l.corpo, channelId: CANAL, extra: { tipo: l.tipo } };
    if (!l.dias.length) return [{ ...base, id: idNumerico(l.chave), schedule: { on: { hour, minute }, allowWhileIdle: true } }];
    // weekday do Capacitor: 1 = domingo … 7 = sábado.
    return l.dias.map(d => ({ ...base, id: idNumerico(`${l.chave}-${d}`), schedule: { on: { weekday: d + 1, hour, minute }, allowWhileIdle: true } }));
  });
  await LocalNotifications.schedule({ notifications: notificacoes.slice(0, 60) });
}

/* ---------------- PC/Web: agendador interno ---------------- */

const LS_LOG = 'folio_lembretes_log';

function jaDisparou(chave: string): boolean {
  try { return (JSON.parse(localStorage.getItem(LS_LOG) ?? '[]') as string[]).includes(chave); } catch { return false; }
}
function registrarDisparo(chave: string) {
  try {
    const log = (JSON.parse(localStorage.getItem(LS_LOG) ?? '[]') as string[]).slice(-150);
    localStorage.setItem(LS_LOG, JSON.stringify([...log, chave]));
  } catch { /* ignore */ }
}

/** Evita lembrar do que já foi feito (meta de água batida, remédio marcado). */
function jaResolvido(l: Lembrete, hoje: string): boolean {
  if (l.tipo === 'agua') {
    const s = useAguaSonoStore.getState();
    return aguaDoDia(s.agua, hoje) >= metaAgua(s.metaAguaMl, usePerfilStore.getState().pesoKg);
  }
  if (l.tipo === 'remedio' && l.medId) {
    return useMedicamentosStore.getState().tomadas.some(t => t.medId === l.medId && t.data === hoje && t.hora === l.hhmm);
  }
  return false;
}

export function verificarAgora(onSemPermissao?: (l: Lembrete) => void) {
  if (ehNativo()) return;
  const agora = new Date();
  const hoje = hojeLocal();
  const minAgora = agora.getHours() * 60 + agora.getMinutes();
  const lista = montarLembretes(useLembretesStore.getState(), useMedicamentosStore.getState().medicamentos);
  for (const l of lista) {
    if (l.dias.length && !l.dias.includes(agora.getDay())) continue;
    const atraso = minAgora - minutos(l.hhmm);
    // Tolerância de 3 min (abas em segundo plano podem atrasar os timers).
    if (atraso < 0 || atraso > 3) continue;
    const chave = `${hoje} ${l.chave}`;
    if (jaDisparou(chave)) continue;
    registrarDisparo(chave);
    if (jaResolvido(l, hoje)) continue;
    mostrarNotificacao(l.titulo, l.corpo, l.chave).catch(() => onSemPermissao?.(l));
  }
}
