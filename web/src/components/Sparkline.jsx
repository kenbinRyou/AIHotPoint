/**
 * Sparkline 迷你趋势图（纯 SVG，无依赖）
 * points: [{ ts, heat }]，降序/升序均可（内部按 ts 排序）
 */
export default function Sparkline({ points = [], width = 72, height = 24, title }) {
  const sorted = [...points].sort((a, b) => a.ts - b.ts);
  if (sorted.length < 2) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }
  const values = sorted.map((p) => p.heat);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (sorted.length - 1);
  const y = (v) => 2 + (height - 4) * (1 - (v - min) / span);

  const path = sorted
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${y(p.heat).toFixed(1)}`)
    .join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  const rising = values[values.length - 1] >= values[0];
  const color = rising ? 'var(--chip-low-fg)' : 'var(--chip-high-fg)';

  return (
    <svg
      width={width}
      height={height}
      className="shrink-0"
      role="img"
      aria-label={title || `近 24 小时热度趋势，${rising ? '整体上升' : '整体下降'}，${sorted.length} 个采样点`}
    >
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
