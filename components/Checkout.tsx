'use client';

// The checkout page: order summary on the side; delivery details, then payment, on the same page.
import { useCallback, useEffect, useState } from 'react';
import PayOnSite from '@/components/PayOnSite';
import { totalFor } from '@/components/PrintSubscribe';

type Plan = { id: string; name: string; price: string; per: string; desc: string; checkoutUrl: string; amount: number; cycles: number; billing: string; freeShipping?: boolean; total?: string; payNote?: string; renews?: boolean; was?: string; promo?: string; gifts?: string[] };

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

export default function Checkout({ plan, fixedFrete }: { plan: Plan; fixedFrete: number }) {
  const [f, setF] = useState({ nome: '', email: '', whatsapp: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');
  const [area, setArea] = useState<'ok' | 'out' | 'unknown' | 'loading' | null>(null);
  const [frete, setFrete] = useState<number | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const sum = totalFor(plan, fixedFrete);

  // Shipping price from our server, and the street from ViaCEP (a free public service).
  const lookupCep = async (value = f.cep) => {
    const cep = value.replace(/\D/g, '');
    if (cep.length !== 8) { setArea(null); setFrete(null); return; }
    setArea('loading');
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then((j) => { if (j && !j.erro) setF((x) => ({ ...x, rua: j.logradouro || x.rua, bairro: j.bairro || x.bairro, cidade: j.localidade || x.cidade, uf: j.uf || x.uf })); })
      .catch(() => {});
    try {
      const r = await fetch(`/api/frete?cep=${cep}`);
      const j = await r.json();
      if (j.ok) { setFrete(fixedFrete); setArea('ok'); }
      else { setFrete(null); setArea(j.reason === 'out' ? 'out' : 'unknown'); }
    } catch {
      setFrete(null); setArea('unknown');
    }
  };
  const onCep = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setF((x) => ({ ...x, cep: v }));
    if (v.replace(/\D/g, '').length === 8) lookupCep(v);
    else { setArea(null); setFrete(null); }
  };

  // Test mode: nothing is charged and no order is saved. It shows the step where Mercado Pago
  // would open, then the thank-you page, so the whole path can be tried before payments are live.
  const [testPay, setTestPay] = useState(false);
  // Paying on our own page: on only when both Mercado Pago keys are set in Vercel. Otherwise the plan's link, as before.
  const [mp, setMp] = useState<{ enabled: boolean; publicKey: string }>({ enabled: false, publicKey: '' });
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState('');
  useEffect(() => {
    fetch('/api/pagamento/config').then((r) => r.json()).then((j) => { if (j?.enabled && j.publicKey) setMp({ enabled: true, publicKey: j.publicKey }); }).catch(() => {});
  }, []);
  const toThanks = useCallback(() => {
    if (!plan) return;
    const q = new URLSearchParams({ plano: plan.name, total: totalFor(plan, fixedFrete).total });
    window.location.href = `/assinatura/obrigada?${q}`;
  }, [plan, fixedFrete]);
  const toLink = useCallback(() => { if (plan) window.location.href = plan.checkoutUrl; }, [plan]);
  const closePay = useCallback(() => { setPaying(false); setState('idle'); }, []);
  // With a Mercado Pago link for the plan: save the order, then go and pay.
  // Without one (still being set up): a test step that charges nothing.
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (area !== 'ok' || frete === null) return;
    if (!plan.checkoutUrl) { setTestPay(true); return; }
    setState('sending');
    try {
      const res = await fetch('/api/assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id, ...f, website: (e.currentTarget as HTMLFormElement).website?.value || '' }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error();
      if (mp.enabled) { setOrder(String(j.order || '')); setPaying(true); setState('idle'); requestAnimationFrame(() => document.getElementById('pagamento')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); return; }
      window.location.href = plan.checkoutUrl;
    } catch {
      setState('error');
    }
  };
  const finishTest = () => {
    if (!plan || frete === null) return;
    const q = new URLSearchParams({ plano: plan.name, total: totalFor(plan, fixedFrete).total, teste: '1' });
    window.location.href = `/assinatura/obrigada?${q}`;
  };


  return (
    <div className="co-grid">
      <aside className="co-sum" aria-label="Resumo do pedido">
        <p className="co-k">Seu pedido</p>
        <div className="co-plan">
          <img src={`/assets/plans/${plan.id}.webp`} alt="" />
          <div>
            <h2>Assinatura {plan.name}</h2>
            <p>{plan.cycles === 1 ? 'Uma revista por mês' : `${plan.cycles} edições`} · {plan.price} {plan.billing === 'monthly' ? '/edição' : '/edição'}</p>
            {plan.promo && <span className="store-badge store-badge--bf co-badge">{plan.promo}</span>}
          </div>
        </div>
        <dl className="co-lines">
          <div><dt>{plan.billing === 'monthly' ? 'Revista' : `${plan.cycles} edições`}</dt><dd>{plan.was && <s>{plan.was}</s>} {plan.billing === 'monthly' ? brl(plan.amount) : brl(plan.amount * plan.cycles)}</dd></div>
          <div><dt>Frete</dt><dd>{plan.freeShipping ? 'Grátis' : area === 'ok' ? brl(fixedFrete) : 'calculado pelo CEP'}</dd></div>
          <div className="co-total"><dt>Total</dt><dd>{plan.freeShipping || area === 'ok' ? sum.total : plan.billing === 'monthly' ? `${brl(plan.amount)} + frete` : sum.total}</dd></div>
        </dl>
        {plan.billing !== 'monthly' && <p className="co-note">À vista no Pix ou em até 12x no cartão.</p>}
        {plan.renews && <p className="co-note">Renova todo mês. Cancele quando quiser.</p>}
        {plan.gifts && <p className="store-gifts"><b>Black Friday:</b> vem com {plan.gifts.join(', ').replace(/, ([^,]*)$/, ' e $1').toLowerCase()}</p>}
        <p className="co-note">A próxima edição é a de <strong>Natal</strong>, em dezembro.</p>
        <a className="co-change" href="/assinatura#planos">Trocar de plano</a>
      </aside>

      <section className="co-main">
        <form className={`co-step${paying ? ' is-done' : ''}`} onSubmit={submit} aria-labelledby="co-1">
          <h2 id="co-1"><span>1</span> Seus dados e entrega</h2>
          <fieldset disabled={paying} className="co-fs">
            <div className="pf-grid">
            <label className="pf-full">Nome completo<input required autoComplete="name" value={f.nome} onChange={set('nome')} /></label>
            <label>E-mail<input required type="email" autoComplete="email" value={f.email} onChange={set('email')} /></label>
            <label>WhatsApp<input required type="tel" autoComplete="tel" inputMode="tel" placeholder="(11) 00000-0000" value={f.whatsapp} onChange={set('whatsapp')} /></label>
            <label>CEP<input required inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={f.cep} onChange={onCep} onBlur={() => lookupCep()} aria-describedby="cep-msg" /></label>
            {area === 'loading' && <p className="pf-full ps-calc" aria-live="polite">Conferindo o seu CEP…</p>}
            {area === 'ok' && frete !== null && (
              <div className="pf-full ps-quote" aria-live="polite">
                <p className="ps-quote-frete">{plan.freeShipping ? <>Entregamos no seu CEP, com <strong>frete grátis</strong>.</> : <>Entregamos no seu CEP. Frete: <strong>{brl(fixedFrete)}</strong> por mês.</>}</p>
                <p className="ps-quote-line">{totalFor(plan, fixedFrete).line}</p>
                <p className="ps-quote-total">Total: <strong>{totalFor(plan, fixedFrete).total}</strong></p>
              </div>
            )}
            {area === 'unknown' && (
              <div className="pf-full ps-out" role="alert">
                <span className="ps-tape" />
                <strong>Não conseguimos encontrar esse CEP.</strong>
                <span>Confira o número ou fale com a gente pelo Instagram.</span>
              </div>
            )}
            {area === 'out' && (
              <div className="pf-full ps-out" id="cep-msg" role="alert">
                <span className="ps-tape" />
                <strong>Infelizmente, ainda não entregamos nesse endereço.</strong>
                <span>Mas fique tranquila: logo logo vamos começar a entregar em todo o Brasil.</span>
              </div>
            )}
            <label className="pf-wide">Rua<input required autoComplete="address-line1" value={f.rua} onChange={set('rua')} /></label>
            <label>Número<input required value={f.numero} onChange={set('numero')} /></label>
            <label className="pf-wide">Complemento <span className="pf-opt">(opcional)</span><input autoComplete="address-line2" value={f.complemento} onChange={set('complemento')} /></label>
            <label>Bairro<input required value={f.bairro} onChange={set('bairro')} /></label>
            <label>Cidade<input required autoComplete="address-level2" value={f.cidade} onChange={set('cidade')} /></label>
            <label>Estado
              <select required value={f.uf} onChange={set('uf')}>
                <option value="">—</option>
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
          </div>
          </fieldset>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
          {!paying && (
            <button type="submit" className="ps-pay" disabled={state === 'sending' || area !== 'ok'}>
              {state === 'sending' ? 'Salvando…' : 'Ir para o pagamento →'}
            </button>
          )}
          {paying && <button type="button" className="co-edit" onClick={closePay}>Editar dados</button>}
          {state === 'error' && <p className="ps-err" role="alert">Não conseguimos salvar agora. Tente de novo em instantes ou fale com a gente pelo WhatsApp.</p>}
          {testPay && frete !== null && (
            <div className="ps-mp" role="dialog" aria-modal="true" aria-labelledby="mp-h">
              <div className="ps-mp-card">
                <p className="ps-mp-badge">Modo de teste</p>
                <h3 id="mp-h">Aqui abriria o pagamento</h3>
                <p className="ps-mp-total">{sum.total}</p>
                <button type="button" className="ps-pay" onClick={finishTest}>Simular pagamento aprovado</button>
                <button type="button" className="ps-mp-back" onClick={() => setTestPay(false)}>Voltar</button>
              </div>
            </div>
          )}
        </form>

        <div className={`co-step${paying ? '' : ' is-off'}`} id="pagamento" aria-labelledby="co-2">
          <h2 id="co-2"><span>2</span> Pagamento</h2>
          {!paying && <p className="co-wait">Preencha seus dados para liberar o pagamento.</p>}
          {paying && (
            <PayOnSite
              inline
              publicKey={mp.publicKey}
              plan={plan}
              total={Math.round((plan.billing === 'monthly' ? plan.amount + fixedFrete : plan.amount * plan.cycles) * 100) / 100}
              email={f.email}
              order={order}
              buyer={f}
              onDone={toThanks}
              onFallback={toLink}
              onClose={closePay}
            />
          )}
          {plan.billing === 'monthly' && <p className="co-note">No cartão, a assinatura renova sozinha todo mês. No Pix, você paga este mês e a gente te avisa quando for a hora do próximo.</p>}
          <p className="co-safe">🔒 Pagamento seguro processado pelo Mercado Pago. Os dados do cartão não passam pelo nosso site.</p>
        </div>
      </section>
    </div>
  );
}
