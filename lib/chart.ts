export function buildSparkline(values: number[], width: number, height: number, topPad = 20, bottomPad = 0) {
  const max = Math.max(...values, 1);
  const usable = height - topPad - bottomPad;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((v, i) => ({
    x: Math.round(i * step),
    y: Math.round(height - bottomPad - (v / max) * usable),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L0,${height} Z`;

  return { points, linePath, areaPath };
}
