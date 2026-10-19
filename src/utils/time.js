// Times are stored as 24-hour "HH:MM" strings (so they sort and compare correctly)
// and shown to people in 12-hour format.

export function formatTime(value) {
  if (!value) return '';
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return String(value);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}
