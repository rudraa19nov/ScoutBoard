import "./DifficultyBar.css";

const COLORS = {
  easy: "var(--leaf)",
  medium: "var(--brass)",
  hard: "var(--coral)"
};

export default function DifficultyBar({ label, solved, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  const color = COLORS[label.toLowerCase()] || "var(--cyan)";

  return (
    <div className="diff-row">
      <span className="diff-label">{label}</span>
      <div className="diff-track">
        <div className="diff-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="diff-count">
        {solved}
        <span className="diff-of"> / {total}</span>
      </span>
    </div>
  );
}
