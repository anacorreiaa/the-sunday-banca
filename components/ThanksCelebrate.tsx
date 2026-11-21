'use client';
import { useEffect, useState } from 'react';
import Celebrate from './games/Celebrate';

/** Confetti once the thank-you page opens. */
export default function ThanksCelebrate() {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 300); return () => clearTimeout(t); }, []);
  return <Celebrate on={on} title="Assinatura feita!!!" text="Bem-vinda à The Sunday." />;
}
