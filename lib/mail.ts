// E-mails to subscribers, sent with Resend. Without RESEND_API_KEY nothing is sent (and nothing breaks).
import publication from './publication.json';
import { siteUrl } from './site';

const FROM = 'The Sunday <ola@thesunday.com.br>';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !/^\S+@\S+\.\S+$/.test(to)) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: publication.contact.email, subject, html }),
    signal: AbortSignal.timeout(8000),
  });
  return r.ok;
}

const IMG = `${siteUrl}/assets/email`;
const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const SANS = "'DM Sans',Helvetica,Arial,sans-serif";
const CREAM = '#f6efe4', INK = '#3b2a20', CHERRY = '#8e2b2b', MUTED = '#8a7a6a', SAGE = '#A3A983';

/** The frame of every e-mail: script logo, an optional photo, the white card, and the footer. */
const shell = (body: string, photo = false) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400;1,500&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${CREAM};color:${INK};font-family:${SANS};-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM}"><tr><td align="center" style="padding:28px 14px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">
<tr><td align="center" style="padding:0 0 18px"><a href="${siteUrl}"><img src="${IMG}/logo.png" width="190" alt="The Sunday" style="display:block;width:190px;height:auto;border:0"></a></td></tr>
<tr><td style="background:#ffffff;border-radius:18px;overflow:hidden">
${photo ? `<img src="${IMG}/topo.jpg" width="540" alt="" style="display:block;width:100%;height:auto;border:0;border-radius:18px 18px 0 0">` : ''}
<div style="padding:30px 26px 30px">${body}</div></td></tr>
<tr><td align="center" style="padding:24px 10px 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${MUTED}">
<a href="${publication.contact.instagramUrl}" style="color:${INK};text-decoration:none;font-weight:600">Instagram</a> &nbsp;·&nbsp;
<a href="https://wa.me/5581992300380" style="color:${INK};text-decoration:none;font-weight:600">WhatsApp</a> &nbsp;·&nbsp;
<a href="${siteUrl}/newsletter" style="color:${INK};text-decoration:none;font-weight:600">Newsletter</a><br>
The Sunday Magazine · histórias para mulheres curiosas<br>Dúvidas? É só responder este e-mail.</td></tr>
</table></td></tr></table></body></html>`;

const kicker = (t: string) => `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${CHERRY}">${t}</p>`;
const title = (t: string) => `<h1 style="margin:0 0 14px;font-family:${SERIF};font-style:italic;font-weight:500;font-size:32px;line-height:1.1;color:${INK}">${t}</h1>`;
const para = (t: string) => `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.65;color:#5e4f42">${t}</p>`;
const btn = (href: string, label: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0"><tr><td align="center" style="border-radius:999px;background:#1f1a17"><a href="${href}" style="display:block;padding:15px 22px;font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#ffffff;text-decoration:none">${label}</a></td></tr></table>`;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tags = (list: string[]) => `<p style="margin:4px 0 0;line-height:2.4">${list.map((t) => `<span style="display:inline-block;margin:0 4px 0 0;padding:5px 12px;border-radius:999px;background:${SAGE};font-family:${SANS};font-size:12px;color:#2b2418;line-height:1.4">${t}</span>`).join('')}</p>`;
const rows = (r: [string, string][]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0;border-top:1px solid #efe6da">${r.map(([k, v]) => `<tr><td style="padding:11px 0 0;font-family:${SANS};font-size:14px;color:${MUTED}">${k}</td><td align="right" style="padding:11px 0 0;font-family:${SANS};font-size:14px;color:${INK}">${v}</td></tr>`).join('')}</table>`;

/** "Thank you for subscribing", sent once, when the order is first marked paid. */
export async function sendPaidEmail(o: { nome: string; email: string; plano: string; total: string }, firstEdition?: string) {
  const first = esc((o.nome || '').trim().split(/\s+/)[0] || '');
  const name = first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
  // The month of HER first magazine (e.g. someone who signs up in February gets "fevereiro").
  const month = esc(firstEdition ? new Date(`${firstEdition.slice(0, 10)}T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' }) : publication.nextEdition.month);
  const html = shell(`
${kicker('Assinatura confirmada 🗞️☕️')}
${title(`${name ? `${name}, que alegria` : 'Que alegria'} ter você na nossa mesa!`)}
${para(`Recebemos o seu pagamento e a sua assinatura da The Sunday está feita. A edição de <b style="color:${CHERRY}">${month}</b> chega na sua casa em breve.`)}
${rows([['Plano', esc(o.plano)], ['Total', `<b>${esc(o.total)}</b>`]])}
${btn(`${siteUrl}/minha-assinatura`, 'Ver minha assinatura')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0;border-top:1px solid #efe6da"><tr><td align="center" style="padding:22px 0 0">
<img src="${IMG}/ana-amanda.jpg" width="190" alt="Ana e Amanda" style="display:block;width:190px;height:auto;border:0;border-radius:14px">
<p style="margin:14px 0 2px;font-family:${SANS};font-size:14px;line-height:1.6;color:#5e4f42">Obrigada por fazer parte disso com a gente. Qualquer coisa, é só responder este e-mail que a gente te retorna.</p>
<p style="margin:6px 0 0;font-family:${SERIF};font-style:italic;font-size:20px;color:${INK}">Com carinho, Ana & Amanda</p></td></tr></table>`, true);
  return send(o.email, 'Sua assinatura da The Sunday está confirmada 🗞️☕️', html);
}

/** The sign-in link for the subscriber area. */
export async function sendLoginEmail(email: string, link: string) {
  const html = shell(`
${kicker('Área da assinante')}
${title('Seu acesso à sua assinatura')}
${para('Toque no botão para ver o seu plano, quando chega a sua revista e o seu endereço de entrega. O link vale por 1 hora.')}
${btn(link, 'Entrar na minha assinatura')}
<p style="margin:18px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${MUTED}">Se não foi você que pediu, pode ignorar este e-mail.</p>`);
  return send(email, 'Seu link de acesso · The Sunday', html);
}
