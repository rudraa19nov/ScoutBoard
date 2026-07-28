import { useState } from "react";
import DifficultyBar from "./DifficultyBar";
import "./ScoutCard.css";

const TAG_LABELS = {
  none: "No tag",
  watching: "Watching",
  target: "Target",
  rival: "Rival",
  mentor: "Mentor"
};

export default function ScoutCard({
  profile,
  entry, // present only for saved board entries: { id, tag, note, fetchedAt }
  onSave,
  onRemove,
  onTagChange,
  onNoteChange,
  onRefresh,
  isRefreshing,
  compareSelected,
  onToggleCompare
}) {
  const [noteDraft, setNoteDraft] = useState(entry?.note ?? "");
  const [noteDirty, setNoteDirty] = useState(false);

  const { username, realName, avatar, ranking, aboutMe, school, country, company, badges, solved, contest } = profile;
  const isSaved = Boolean(entry);

  function commitNote() {
    if (!noteDirty) return;
    onNoteChange(entry.id, noteDraft);
    setNoteDirty(false);
  }

  return (
    <article className={`card ${isSaved ? "card--saved" : ""}`}>
      <div className="card-punch" aria-hidden="true" />

      <header className="card-head">
        <div className="card-avatar-wrap">
          {avatar ? (
            <img src={avatar} alt="" className="card-avatar" referrerPolicy="no-referrer" />
          ) : (
            <div className="card-avatar card-avatar--fallback">{username[0]?.toUpperCase()}</div>
          )}
        </div>
        <div className="card-identity">
          <h2 className="card-name">{realName || username}</h2>
          <p className="card-handle">@{username}</p>
          {(school || company || country) && (
            <p className="card-meta">{[company, school, country].filter(Boolean).join(" · ")}</p>
          )}
        </div>
        <div className="card-rank-seal" title="Global ranking">
          <span className="card-rank-label">RANK</span>
          <span className="card-rank-value">{ranking ? `#${ranking.toLocaleString()}` : "—"}</span>
        </div>
      </header>

      {aboutMe && <p className="card-about">&ldquo;{aboutMe}&rdquo;</p>}

      <section className="card-stats">
        <DifficultyBar label="Easy" solved={solved.easy.solved} total={solved.easy.total} />
        <DifficultyBar label="Medium" solved={solved.medium.solved} total={solved.medium.total} />
        <DifficultyBar label="Hard" solved={solved.hard.solved} total={solved.hard.total} />
      </section>

      <footer className="card-foot">
        <div className="card-chip">
          <span className="card-chip-label">Solved</span>
          <span className="card-chip-value mono">{solved.all.solved}</span>
        </div>
        <div className="card-chip">
          <span className="card-chip-label">Contest rating</span>
          <span className="card-chip-value mono">{contest ? Math.round(contest.rating) : "—"}</span>
        </div>
        <div className="card-chip">
          <span className="card-chip-label">Contests</span>
          <span className="card-chip-value mono">{contest ? contest.attended : "—"}</span>
        </div>

        <div className="card-actions">
          {isSaved && onToggleCompare && (
            <label className="card-compare">
              <input
                type="checkbox"
                checked={Boolean(compareSelected)}
                onChange={() => onToggleCompare(entry.id)}
              />
              compare
            </label>
          )}

          {isSaved ? (
            <>
              {onRefresh && (
                <button className="card-btn" onClick={() => onRefresh(entry.id)} disabled={isRefreshing}>
                  {isRefreshing ? "refreshing…" : "refresh"}
                </button>
              )}
              <button className="card-btn card-btn--remove" onClick={() => onRemove(entry.id)}>
                remove
              </button>
            </>
          ) : (
            <button className="card-btn" onClick={() => onSave(profile)}>
              + save to board
            </button>
          )}
        </div>
      </footer>

      {isSaved && (onTagChange || onNoteChange) && (
        <div className="card-annotations">
          {onTagChange && (
            <label className="card-tag-select">
              <span>Tag</span>
              <select value={entry.tag} onChange={(e) => onTagChange(entry.id, e.target.value)}>
                {Object.entries(TAG_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {onNoteChange && (
            <label className="card-note">
              <span>Scouting note</span>
              <textarea
                value={noteDraft}
                onChange={(e) => {
                  setNoteDraft(e.target.value);
                  setNoteDirty(true);
                }}
                onBlur={commitNote}
                placeholder="Add a private note about this profile…"
                maxLength={500}
                rows={2}
              />
            </label>
          )}
        </div>
      )}

      {badges?.length > 0 && (
        <div className="card-badges">
          {badges.slice(0, 6).map((b, i) => (
            <span key={i} className="card-badge" title={b.name}>
              {b.name}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
