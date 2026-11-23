import publication from '@/lib/publication.json';

type Contact = { email?: string; phone?: string; instagram?: string; instagramUrl?: string };

/** Footer on every page: how to reach us, plus the newsletter and the printed magazine. Empty contact fields are skipped. */
export default function SiteFooter() {
  const c = ((publication as unknown as { contact?: Contact }).contact || {}) as Contact;
  const phoneDigits = (c.phone || '').replace(/\D/g, '');
  const ig = (c.instagram || '').replace(/^@/, '');
  return (
    <footer className="site-footer" id="contato">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <p className="site-footer-logo">The Sunday</p>
          <p className="site-footer-tag">{publication.tagline}</p>
        </div>
        <div className="site-footer-col">
          <p className="site-footer-h">Fale com a gente</p>
          <ul>
            {c.email && <li><a href={`mailto:${c.email}`}>{c.email}</a></li>}
            {c.phone && <li><a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener">{c.phone} <span className="site-footer-small">(WhatsApp)</span></a></li>}
            <li><a href="https://wa.me/5581992300380" target="_blank" rel="noopener">WhatsApp (81) 99230-0380</a></li>
            <li><a href="https://wa.me/5581996025055" target="_blank" rel="noopener">WhatsApp (81) 99602-5055</a></li>
            {ig && <li><a href={c.instagramUrl || `https://instagram.com/${ig}`} target="_blank" rel="noopener">@{ig}</a></li>}
            {!c.email && !c.phone && !ig && <li className="site-footer-small">Contatos em breve.</li>}
          </ul>
        </div>
        <div className="site-footer-col">
          <p className="site-footer-h">The Sunday</p>
          <ul>
            <li><a href={publication.substackUrl}>Newsletter no Substack</a></li>
            <li><a href={publication.printMagazine.url}>Quero a revista física</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
