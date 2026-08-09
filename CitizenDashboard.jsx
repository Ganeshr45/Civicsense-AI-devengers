import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import SeverityBadge from "../components/SeverityBadge";

export default function CitizenDashboard() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listReports({ mine: true })
      .then(setReports)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-700 text-3xl">My reports</h1>
        <Link to="/report" className="rounded-full bg-teal text-white px-5 py-2.5 text-sm font-medium hover:bg-teal-dark">
          + New report
        </Link>
      </div>

      {error && <p className="text-rust">{error}</p>}

      {reports?.length === 0 && (
        <div className="ticket rounded-2xl p-10 text-center">
          <p className="text-ink/60 mb-4">No reports yet. See something that needs fixing?</p>
          <Link to="/report" className="rounded-full bg-teal text-white px-5 py-2.5 text-sm font-medium hover:bg-teal-dark">
            Report your first issue
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {reports?.map((r) => (
          <Link
            key={r.id}
            to={`/reports/${r.id}`}
            className="ticket rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <p className="font-mono text-xs text-ink/40 mb-1">#{r.id.slice(0, 8).toUpperCase()}</p>
              <h3 className="font-display font-600 capitalize">{r.category.replace("_", " ")}</h3>
              <p className="text-sm text-ink/60">{r.description || r.address || "No description"}</p>
            </div>
            <div className="text-right space-y-2">
              <StatusBadge status={r.status} />
              <div>
                <SeverityBadge severity={r.severity} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
