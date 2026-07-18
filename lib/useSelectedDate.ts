'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { fmtDate } from './dateHelpers';

export function useSelectedDate() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const date = params.get('date') || fmtDate(new Date());

  function setDate(newDate: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set('date', newDate);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return { date, setDate };
}
