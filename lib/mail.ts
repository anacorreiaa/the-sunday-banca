// E-mails to subscribers, sent with Resend. Without RESEND_API_KEY nothing is sent (and nothing breaks).
import publication from './publication.json';
import { siteUrl } from './site';

const FROM = 'The Sunday Magazine <ola@thesunday.com.br>';
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

const shell = (body: string) => `<!doctype html><html><body style="margin:0;background:#f6f0e6;font-family:Helvetica,Arial,sans-serif;color:#2b2418">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="text-align:center;font-family:Georgia,serif;font-style:italic;font-size:30px;margin:0 0 24px">The Sunday</p>
<div style="background:#fff;border-radius:16px;padding:28px 24px">${body}</div>
<p style="text-align:center;font-size:12px;color:#8a7a6a;margin:20px 0 0">The Sunday Magazine · <a href="${siteUrl}" style="color:#8a7a6a">thesunday.com.br</a><br>Dúvidas? É só responder este e-mail.</p>
</div></body></html>`;

const btn = (href: string, label: string) => `<p style="text-align:center;margin:24px 0 0"><a href="${href}" style="display:inline-block;background:#1f1a17;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold">${label}</a></p>`;

/** "Thank you for subscribing", sent once, when the order is first marked paid. */
export async function sendPaidEmail(o: { nome: string; email: string; plano: string; total: string }) {
  const first = esc((o.nome || '').trim().split(/\s+/)[0] || '');
  const next = publication.nextEdition;
  const html = shell(`
<p style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#8e2b2b;font-weight:bold;margin:0 0 10px">Assinatura confirmada</p>
<h1 style="font-family:Georgia,serif;font-style:italic;font-weight:normal;font-size:28px;line-height:1.15;margin:0 0 14px">${first ? `${first}, que alegria` : 'Que alegria'} ter você na nossa mesa!</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">Recebemos o seu pagamento e a sua assinatura da The Sunday está feita. A edição de <b>${esc(next.month)}</b> chega na sua casa em breve, com jogos, a surpresa do mês e conteúdos exclusivos para ler sem tela.</p>
<table style="width:100%;font-size:14px;border-top:1px solid #eee;padding-top:12px">
<tr><td style="color:#8a7a6a;padding:4px 0">Plano</td><td style="text-align:right">${esc(o.plano)}</td></tr>
<tr><td style="color:#8a7a6a;padding:4px 0">Total</td><td style="text-align:right"><b>${esc(o.total)}</b></td></tr></table>
${btn(`${siteUrl}/minha-assinatura`, 'Ver minha assinatura')}`);
  return send(o.email, 'Sua assinatura da The Sunday está confirmada ✦', html);
}

/** The sign-in link for the subscriber area. */
export async function sendLoginEmail(email: string, link: string) {
  const html = shell(`
<h1 style="font-family:Georgia,serif;font-style:italic;font-weight:normal;font-size:26px;margin:0 0 12px">Seu acesso à sua assinatura</h1>
<p style="font-size:15px;line-height:1.6;margin:0">Toque no botão para ver o seu plano, o status da sua revista e o seu endereço de entrega. O link vale por 1 hora.</p>
${btn(link, 'Entrar na minha assinatura')}
<p style="font-size:12px;color:#8a7a6a;margin:18px 0 0">Se não foi você que pediu, pode ignorar este e-mail.</p>`);
  return send(email, 'Seu link de acesso · The Sunday', html);
}
