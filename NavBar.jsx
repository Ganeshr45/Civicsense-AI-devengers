import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display font-700 text-lg tracking-tight text-ink flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber inline-block" />
          CivicSense<span className="text-teal">AI</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          {user?.role === "citizen" && (
            <>
              <Link to="/dashboard" className="hover:text-teal transition-colors">My Reports</Link>
              <Link to="/report" className="rounded-full bg-teal text-white px-4 py-2 hover:bg-teal-dark transition-colors">
                Report an Issue
              </Link>
            </>
          )}
          {(user?.role === "officer" || user?.role === "admin") && (
            <Link to="/gov" className="hover:text-teal transition-colors">Gov Dashboard</Link>
          )}
          {user ? (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="text-ink/60 hover:text-rust transition-colors"
            >
              Sign out
            </button>
          ) : (
            <Link to="/login" className="rounded-full border border-ink px-4 py-2 hover:bg-ink hover:text-white transition-colors">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
