// lib/time.ts
export function isNewWithin24h(iso?: string | null) {
  if (!iso) return false;
  const now = Date.now();
  const t = new Date(iso).getTime();
  return now - t < 24 * 60 * 60 * 1000;
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "-";
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
