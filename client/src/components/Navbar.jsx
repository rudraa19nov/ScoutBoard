import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="nav">
      <div className="nav-brand">
        {/* <span className="nav-brand-mark">SCOUTBOARD</span> */}
        <span className="nav-brand-name">SCOUTBOARD</span>
      </div>

      <div className="nav-account">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="nav-avatar" referrerPolicy="no-referrer" />
        ) : (
          <div className="nav-avatar nav-avatar--fallback">{user.name?.[0]?.toUpperCase() || "U"}</div>
        )}
        <div className="nav-account-info">
          <span className="nav-name">{user.name}</span>
          <span className="nav-email">{user.email}</span>
        </div>
        <button className="nav-signout" onClick={logout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
