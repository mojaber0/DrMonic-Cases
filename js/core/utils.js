// ════════════════════════════════════════════════
//  SHARED SMALL UTILITIES: relative time + generic CSV parser
// ════════════════════════════════════════════════
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const then = new Date(dateStr);
  if (isNaN(then)) return '';
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'آخر مراجعة: اليوم';
  if (days === 1) return 'آخر مراجعة: منذ يوم';
  if (days < 7) return `آخر مراجعة: منذ ${days} أيام`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `آخر مراجعة: منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
  const months = Math.floor(days / 30);
  return `آخر مراجعة: منذ ${months} ${months === 1 ? 'شهر' : 'أشهر'}`;
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).filter(r => r.some(v => v && v.trim())).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
    return obj;
  });
}

