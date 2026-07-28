import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import SearchBar from "../components/SearchBar";
import ScoutCard from "../components/ScoutCard";
import BoardControls from "../components/BoardControls";
import CompareModal from "../components/CompareModal";
import "./Dashboard.css";

export default function Dashboard() {
  const [current, setCurrent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBoardLoading, setIsBoardLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("recent");
  const [refreshingId, setRefreshingId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const loadBoard = useCallback(async (sortKey) => {
    setIsBoardLoading(true);
    try {
      const data = await api.get(`/board?sort=${sortKey}`);
      setEntries(data.entries);
    } catch {
      // Board failing to load doesn't block search; show an inline message instead.
    } finally {
      setIsBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard(sort);
  }, [sort, loadBoard]);

  async function handleSearch(username) {
    setIsSearching(true);
    setError(null);
    setCurrent(null);
    try {
      const data = await api.get(`/leetcode/${encodeURIComponent(username)}`);
      setCurrent(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSave(profile) {
    try {
      await api.post("/board", { username: profile.username });
      await loadBoard(sort);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setCompareIds((prev) => prev.filter((cid) => cid !== id));
    try {
      await api.delete(`/board/${id}`);
    } catch (err) {
      setError(err.message);
      loadBoard(sort);
    }
  }

  async function handleTagChange(id, tag) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, tag } : e)));
    try {
      await api.patch(`/board/${id}`, { tag });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleNoteChange(id, note) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, note } : e)));
    try {
      await api.patch(`/board/${id}`, { note });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRefresh(id) {
    setRefreshingId(id);
    try {
      const data = await api.post(`/board/${id}/refresh`);
      setEntries((prev) => prev.map((e) => (e.id === id ? data.entry : e)));
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshingId(null);
    }
  }

  function handleToggleCompare(id) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((cid) => cid !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  function handleExport() {
    window.open(api.downloadUrl("/board/export/csv"), "_blank");
  }

  const alreadySavedEntry = current ? entries.find((e) => e.username === current.username) : null;
  const compareEntries = entries.filter((e) => compareIds.includes(e.id));

  return (
    <main className="dash-page">
      <div className="dash-wrap">
        <header className="dash-masthead">
          <p className="dash-eyebrow">scoutboard</p>
          <h1 className="dash-title">Pull up anyone&rsquo;s LeetCode scout card.</h1>
          <p className="dash-sub">
            Search a username to see rank, rating, and solved breakdown — then pin the ones you want to
            keep an eye on to your board below.
          </p>
        </header>

        <SearchBar onSearch={handleSearch} isLoading={isSearching} />

        {error && <p className="dash-error">{error}</p>}

        {current && (
          <section className="dash-current" aria-label="Search result">
            <ScoutCard
              profile={current}
              entry={alreadySavedEntry ?? null}
              onSave={handleSave}
              onRemove={handleRemove}
            />
          </section>
        )}

        <section className="dash-board">
          <div className="dash-board-head">
            <h2>Your board</h2>
            <span className="dash-board-count">{entries.length}</span>
          </div>

          {entries.length > 0 && (
            <BoardControls
              sort={sort}
              onSortChange={setSort}
              onExport={handleExport}
              compareCount={compareIds.length}
              onCompare={() => setShowCompare(true)}
            />
          )}

          {isBoardLoading ? (
            <p className="dash-empty">Loading your board…</p>
          ) : entries.length === 0 ? (
            <p className="dash-empty">
              Nothing pinned yet. Scan a username above and save the card to start building your board.
            </p>
          ) : (
            <div className="dash-grid">
              {entries.map((e) => (
                <ScoutCard
                  key={e.id}
                  profile={e.profile}
                  entry={e}
                  onRemove={handleRemove}
                  onTagChange={handleTagChange}
                  onNoteChange={handleNoteChange}
                  onRefresh={handleRefresh}
                  isRefreshing={refreshingId === e.id}
                  compareSelected={compareIds.includes(e.id)}
                  onToggleCompare={handleToggleCompare}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showCompare && compareEntries.length === 2 && (
        <CompareModal entries={compareEntries} onClose={() => setShowCompare(false)} />
      )}
    </main>
  );
}
