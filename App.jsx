import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import CitizenDashboard from "./pages/CitizenDashboard";
import ReportForm from "./pages/ReportForm";
import ReportDetail from "./pages/ReportDetail";
import GovDashboard from "./pages/GovDashboard";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="max-w-2xl mx-auto px-6 py-16 text-ink/60">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <CitizenDashboard />
            </Protected>
          }
        />
        <Route
          path="/report"
          element={
            <Protected>
              <ReportForm />
            </Protected>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <Protected>
              <ReportDetail />
            </Protected>
          }
        />
        <Route
          path="/gov"
          element={
            <Protected>
              <GovDashboard />
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
