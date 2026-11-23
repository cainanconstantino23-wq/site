// Funções puras da busca de empresas (sem rede). Testadas em tests/prospectar-extrair.test.mjs.

export type DadosSite = {
  emails: string[];
  ig: string;
  wa: string;
  video: "sim" | "não" | "?";
  titulo: string;
  descricao: string;
  texto: string;
};

const IG_RESERVADOS = new Set([
  "p", "reel", "reels", "explore", "stories", "accounts", "sharer", "tv", "share", "direct", "about", "legal", "developer", "web",
]);
const EMAIL_RUIM = /\.(png|jpe?g|gif|webp|svg|avif)$|@(sentry|wixpress|example|domain|email|seudominio|sentry-next)\b|^(nome|seu|your|user)@/i;

/** Lê o HTML da página inicial e tira contatos, Instagram, WhatsApp e se tem vídeo. */
export function extrairDoSite(html: string): DadosSite {
  const h = String(html || "");
  const emails = new Set<string>();
  for (const m of h.matchAll(/mailto:([^"'?\s>]+)/gi)) emails.add(decodeURIComponent(m[1]).toLowerCase());
  for (const m of h.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) emails.add(m[0].toLowerCase());
  const lista = [...emails].filter((e) => !EMAIL_RUIM.test(e)).sort((a, b) => pesoEmail(a) - pesoEmail(b));

  let ig = "";
  for (const m of h.matchAll(/instagram\.com\/([A-Za-z0-9_.]{2,30})/gi)) {
    const u = m[1].replace(/\.+$/, "").toLowerCase();
    if (!IG_RESERVADOS.has(u)) { ig = u; break; }
  }

  let wa = "";
  const mw = h.match(/(?:wa\.me\/|whatsapp\.com\/send\/?\?(?:[^"'>]*&(?:amp;)?)?phone=)\+?(\d{10,13})/i);
  if (mw) wa = mw[1];

  const temVideo = /<video[\s>]|<iframe[^>]+(youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com|wistia)|\.(mp4|webm|m3u8)\b|vimeo\.com\/\d|data-video|background-video|bg-video/i.test(h);

  const titulo = limpar((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").slice(0, 160);
  const descricao = limpar((h.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i) || h.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)/i) || [])[1] || "").slice(0, 300);
  const texto = limpar(h.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")).slice(0, 1500);

  return { emails: lista, ig, wa, video: h.length > 500 ? (temVideo ? "sim" : "não") : "?", titulo, descricao, texto };
}

function pesoEmail(e: string): number {
  if (/^(reservas?|reservations?|booking|comercial|contato|contact|vendas|sales|hello|ola|oi|info)@/.test(e)) return 0;
  if (/^(no-?reply|noreply|privacidade|privacy|rh|jobs|trabalhe|financeiro)@/.test(e)) return 9;
  return 5;
}

function limpar(s: string): string {
  return s
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

/** Só dígitos com 55 e DDD, se o número parecer celular (WhatsApp). Senão, "". */
export function celularBR(telefone: string): string {
  let d = String(telefone || "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.startsWith("55") && d.length === 13 && d[4] === "9") return d;
  return "";
}

/** 'https://www.Exemplo.com.br/pt/' → 'exemplo.com.br'. */
export function dominio(site: string): string {
  return String(site || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
}

export function nomeChave(s: string): string {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\b(pousada|hotel|boutique|villas?|casa|restaurante|imobiliaria|imoveis|ltda|me|trancoso)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Site que não é da empresa (redes sociais, Booking, agregadores): não vale abrir nem usar como site. */
export function siteDeTerceiro(site: string): boolean {
  return /(^|\.)(instagram|facebook|wa|whatsapp|booking|airbnb|tripadvisor|linktr|linktree|bit|google|goo|wixsite|ifood|hoteis|decolar|expedia)\./.test(dominio(site) + ".")
    || /^(linktr\.ee|bit\.ly|wa\.me)$/.test(dominio(site));
}

export type Previa = { video: string; email: string; wa: string; ig: string; site: string; google_nota?: number | null; google_avaliacoes?: number | null };

/** Nota provisória (antes do Claude), pelas mesmas regras da skill buscar-leads. */
export function notaPrevia(p: Previa): { nota: number; porque: string } {
  let n = 5;
  const motivos: string[] = [];
  if (p.video === "não") { n += 2; motivos.push("sem vídeo no site"); }
  if (p.video === "sim") { n -= 1; motivos.push("já tem vídeo no site"); }
  if (!p.site) motivos.push("sem site próprio");
  if (p.email) { n += 1; motivos.push("tem e-mail"); }
  if (!p.email && !p.wa && !p.ig) { n -= 2; motivos.push("nenhum contato encontrado"); }
  if ((p.google_nota || 0) >= 4.7 && (p.google_avaliacoes || 0) >= 50) { n += 1; motivos.push("muito bem avaliada no Google"); }
  n = Math.max(0, Math.min(10, n));
  const txt = motivos.join(", ");
  return { nota: n, porque: txt ? txt[0].toUpperCase() + txt.slice(1) + "." : "" };
}

export function canalDe(p: { email: string; wa: string }): "email" | "wa" | "ig" {
  return p.email ? "email" : p.wa ? "wa" : "ig";
}
