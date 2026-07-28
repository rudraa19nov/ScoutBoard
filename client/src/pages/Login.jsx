import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoogleButton } from "../hooks/useGoogleButton";
import "./Login.css";

export default function Login() {
  const { loginWithGoogleCredential } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleCredential = useCallback(
    async (credential) => {
      setError(null);
      try {
        await loginWithGoogleCredential(credential);
        navigate("/board", { replace: true });
      } catch {
        setError("Sign-in failed. Please try again.");
      }
    },
    [loginWithGoogleCredential, navigate]
  );

  const buttonRef = useGoogleButton(handleCredential);

  return (
    <main className="login-page">
      <div className="login-panel">
        <p className="login-eyebrow">scoutboard</p>
        <h1 className="login-title">Pull up anyone&rsquo;s LeetCode scout card.</h1>
        <p className="login-sub">
          Search a username to see rank, contest rating, and a solved-problem breakdown — then pin the
          accounts you want to keep an eye on to your own board. Every board is private to your Google
          account.
        </p>

        <div className="login-google" ref={buttonRef} />

        {error && <p className="login-error">{error}</p>}

        <ul className="login-points">
          <li>Sign in with Google — no separate password to manage.</li>
          <li>Your saved profiles, tags, and notes are visible only to you.</li>
          <li>Refresh any pinned profile to pull the latest LeetCode stats.</li>
        </ul>
      </div>
    </main>
  );
}
