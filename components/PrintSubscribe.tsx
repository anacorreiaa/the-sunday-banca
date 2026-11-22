'use client';

// Plans for the printed magazine, then the delivery details, then Mercado Pago's own payment page.
import { useEffect, useState } from 'react';

type Plan = { id: string; name: string; price: string; per: string; desc: string; checkoutUrl: string; featured?: boolean; amount: number; cycles: number; billing: string; freeShipping?: boolean; perk?: string; total?: string; payNote?: string; renews?: boolean };

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** What the customer pays for a plan. Long plans ship free; the monthly plan pays a fixed delivery fee. */
export function totalFor(p: Plan, fixedFrete: number) {
  const frete = p.freeShipping ? 0 : fixedFrete;
  if (p.billing === 'monthly') return { frete, line: `${brl(p.amount)} + ${brl(frete)} de frete`, total: `${brl(p.amount + frete)} por mês` };
  return { frete, line: `${p.cycles} × ${brl(p.amount)}, frete grátis`, total: brl(p.amount * p.cycles) };
}

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

export default function PrintSubscribe({ plans, fixedFrete, children }: { plans: Plan[]; fixedFrete: number; children?: React.ReactNode }) {
  const [planId, setPlanId] = useState<string | null>(null);
  const [f, setF] = useState({ nome: '', email: '', whatsapp: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');
  const [area, setArea] = useState<'ok' | 'out' | 'unknown' | 'loading' | null>(null);
  const [frete, setFrete] = useState<number | null>(null);
  const plan = plans.find((p) => p.id === planId) || null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  // Coming from the home page with ?plano=…: that plan is already chosen.
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get('plano');
    if (want && plans.some((p) => p.id === want)) {
      setPlanId(want);
      setTimeout(() => document.getElementById('entrega')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    }
  }, [plans]);

  const pick = (id: string) => {
    setPlanId(id);
    requestAnimationFrame(() => document.getElementById('entrega')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

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
  // With a Mercado Pago link for the plan: save the order, then go and pay.
  // Without one (still being set up): a test step that charges nothing.
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || area !== 'ok' || frete === null) return;
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
    <>
    <div className="ps-table">
      <section className="ps-plans" id="planos" aria-labelledby="planos-h">
        <h2 id="planos-h" className="ps-h2 ps-h2--light">Escolha o seu plano</h2>
        <div className="ps-tags">
          {plans.map((p, i) => (
            <article key={p.id} className={`ps-tag ps-tag--${i}${p.featured ? ' is-featured' : ''}${planId === p.id ? ' is-picked' : ''}`}>
              <div className="ps-tag-paper">
                <span className="ps-tag-hole" aria-hidden="true" />
                {p.featured && <span className="ps-stamp" aria-label="Melhor preço">melhor<br />preço</span>}
                <h3>{p.name}</h3>
                <p className="ps-price">{p.price}</p>
                <p className="ps-per">{p.per}</p>
                {p.total && <p className="ps-total">{p.total}</p>}
                {p.perk && <p className="ps-perk">{p.perk}</p>}
                <p className="ps-desc">{p.desc}</p>
                <button type="button" className="ps-pick" onClick={() => pick(p.id)} aria-pressed={planId === p.id}>
                  {planId === p.id ? 'Escolhido ✓' : 'Escolher'}
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className="ps-plans-note">Semestral e anual: pagamento único, à vista no Pix ou parcelado no cartão (com juros), frete incluso e sem renovação automática. Mensal: renova todo mês e você cancela quando quiser.</p>
      </section>

      </div>
      {children}
      <div className="ps-table">
      {plan && (
        <section className="ps-form-wrap" id="entrega" aria-labelledby="entrega-h">
          <form className="ps-envelope" onSubmit={submit}>
            <img className="ps-carta" src="/assets/drawn/carta.png" alt="" aria-hidden="true" />
            <h2 id="entrega-h">Para onde mandamos a sua revista?</h2>
            <p className="ps-form-plan">Plano <strong>{plan.name}</strong> · {plan.price} {plan.per}</p>
            {plan.payNote && <p className="ps-form-pay">Pagamento: {plan.payNote.charAt(0).toLowerCase() + plan.payNote.slice(1)}.</p>}
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
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <p className="ps-next-ed">A próxima edição é a de <strong>Natal</strong>, em dezembro. Assinando agora, é a primeira que chega na sua casa.</p>
            <button type="submit" className="ps-pay" disabled={state === 'sending' || area !== 'ok'}>
              {state === 'sending' ? 'Enviando…' : 'Continuar para o pagamento →'}
            </button>
            <p className="ps-safe">Você será levada para o Mercado Pago para pagar com segurança.{plan.renews ? ' A assinatura renova automaticamente ao fim de cada período, e você pode cancelar quando quiser.' : ' Pagamento único: à vista no Pix ou parcelado no cartão.'}</p>
            {testPay && plan && frete !== null && (
              <div className="ps-mp" role="dialog" aria-modal="true" aria-labelledby="mp-h">
                <div className="ps-mp-card">
                  <p className="ps-mp-badge">Modo de teste</p>
                  <h3 id="mp-h">Aqui abriria o Mercado Pago</h3>
                  <p>No site de verdade, você iria para a página segura do Mercado Pago para pagar:</p>
                  <p className="ps-mp-total">{totalFor(plan, fixedFrete).total}</p>
                  <p className="ps-mp-small">Plano {plan.name} · {totalFor(plan, fixedFrete).line}</p>
                  <button type="button" className="ps-pay" onClick={finishTest}>Simular pagamento aprovado</button>
                  <button type="button" className="ps-mp-back" onClick={() => setTestPay(false)}>Voltar</button>
                </div>
              </div>
            )}
            {state === 'error' && <p className="ps-err" role="alert">Não conseguimos enviar agora. Tente de novo em instantes ou fale com a gente pelo Instagram.</p>}
          </form>
        </section>
      )}
    </div>
    </>
  );
}
