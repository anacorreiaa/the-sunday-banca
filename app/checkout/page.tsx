import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import Checkout from '@/components/Checkout';
import publication from '@/lib/publication.json';
import { plansNow } from '@/lib/promo';

export const metadata: Metadata = { title: 'Finalizar assinatura', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const plan = plansNow().find((p) => p.id === q.plano);
  if (!plan) redirect('/assinatura#planos');
  return (
    <>
      <SiteNav home={false} />
      <main className="co-page">
        <h1 className="co-h1">Finalizar assinatura</h1>
        <Checkout plan={plan} fixedFrete={publication.shipping.fixed} />
      </main>
      <SiteFooter />
    </>
  );
}
