import "./BoardControls.css";

const SORT_OPTIONS = [
  { value: "recent", label: "Recently saved" },
  { value: "rank", label: "Global rank" },
  { value: "rating", label: "Contest rating" },
  { value: "solved", label: "Problems solved" }
];

export default function BoardControls({ sort, onSortChange, onExport, compareCount, onCompare }) {
  return (
    <div className="board-controls">
      <label className="board-sort">
        <span>Sort by</span>
        <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="board-controls-actions">
        <button className="board-action-btn" onClick={onCompare} disabled={compareCount !== 2}>
          Compare {compareCount > 0 ? `(${compareCount}/2)` : ""}
        </button>
        <button className="board-action-btn" onClick={onExport}>
          Export CSV
        </button>
      </div>
    </div>
  );
}
