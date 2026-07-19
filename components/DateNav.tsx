'use client';

import { useSelectedDate } from '@/lib/useSelectedDate';
import { addDays, fmtDate, niceDate } from '@/lib/dateHelpers';

export default function DateNav() {
  const { date, setDate } = useSelectedDate();

  return (
    <div className="date-nav">
      <button className="arrow" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">&larr;</button>
      <div className="current-date mono">{niceDate(date)}</div>
      <button className="arrow" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">&rarr;</button>
      <button className="today-btn" onClick={() => setDate(fmtDate(new Date()))}>Today</button>
    </div>
  );
}
