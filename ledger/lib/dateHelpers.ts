export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

export function niceDate(dateStr: string): string {
  const d = parseDate(dateStr);
  const today = fmtDate(new Date());
  const prefix =
    dateStr === today
      ? 'Today · '
      : dateStr === addDays(today, -1)
      ? 'Yesterday · '
      : dateStr === addDays(today, 1)
      ? 'Tomorrow · '
      : '';
  return prefix + d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function last7Days(fromDate: string): string[] {
  const arr: string[] = [];
  for (let i = 6; i >= 0; i--) arr.push(addDays(fromDate, -i));
  return arr;
}

export function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function weekdayName(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}
