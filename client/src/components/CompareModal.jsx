import "./CompareModal.css";

function Row({ label, left, right, highlightHigher = true }) {
  const leftWins = highlightHigher && typeof left === "number" && typeof right === "number" && left > right;
  const rightWins = highlightHigher && typeof left === "number" && typeof right === "number" && right > left;

  return (
    <div className="compare-row">
      <span className={`compare-value ${leftWins ? "compare-value--win" : ""}`}>{left ?? "—"}</span>
      <span className="compare-label">{label}</span>
      <span className={`compare-value ${rightWins ? "compare-value--win" : ""}`}>{right ?? "—"}</span>
    </div>
  );
}

export default function CompareModal({ entries, onClose }) {
  if (!entries || entries.length !== 2) return null;
  const [a, b] = entries.map((e) => e.profile);

  return (
    <div className="compare-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <header className="compare-head">
          <h2>Head to head</h2>
          <button className="compare-close" onClick={onClose} aria-label="Close comparison">
            ×
          </button>
        </header>

        <div className="compare-names">
          <span className="compare-name">{a.realName || a.username}</span>
          <span className="compare-vs">vs</span>
          <span className="compare-name">{b.realName || b.username}</span>
        </div>

        <div className="compare-body">
          <Row label="Global rank" left={a.ranking} right={b.ranking} highlightHigher={false} />
          <Row label="Contest rating" left={a.contest?.rating ?? null} right={b.contest?.rating ?? null} />
          <Row label="Contests attended" left={a.contest?.attended ?? null} right={b.contest?.attended ?? null} />
          <Row label="Total solved" left={a.solved.all.solved} right={b.solved.all.solved} />
          <Row label="Easy solved" left={a.solved.easy.solved} right={b.solved.easy.solved} />
          <Row label="Medium solved" left={a.solved.medium.solved} right={b.solved.medium.solved} />
          <Row label="Hard solved" left={a.solved.hard.solved} right={b.solved.hard.solved} />
          <Row label="Badges" left={a.badges?.length ?? 0} right={b.badges?.length ?? 0} />
        </div>
      </div>
    </div>
  );
}
