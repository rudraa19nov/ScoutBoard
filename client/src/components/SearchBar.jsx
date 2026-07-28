import { useState } from "react";
import "./SearchBar.css";

export default function SearchBar({ onSearch, isLoading }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="scanner">
      <span className="scanner-prompt" aria-hidden="true">
        &gt;
      </span>
      <input
        className="scanner-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="scan a leetcode username_"
        aria-label="LeetCode username"
        autoComplete="off"
        spellCheck="false"
      />
      <button className="scanner-button" type="submit" disabled={isLoading}>
        {isLoading ? "scanning…" : "scan"}
      </button>
    </form>
  );
}
