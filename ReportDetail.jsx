import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import SeverityBadge from "../components/SeverityBadge";

const STATUS_OPTIONS = ["routed", "in_progress", "resolved", "rejected"];

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [nextStatus, setNextStatus] = useState("in_progress");
  const { user } = useAuth();

  function load() {
    api.getReport(id).then(setReport).catch((e) => setError(e.message));
  }

  useEffect(load, [id]);

  async function handleStatusChange(e) {
    e.preventDefault();
    try {
      await api.updateStatus(id, nextStatus, note);
      setNote("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="max-w-2xl mx-auto px-6 py-16 text-rust">{error}</p>;
  if (!report) return <p className="max-w-2xl mx-auto px-6 py-16 text-ink/60">Loading...</p>;

  const canManage = user?.role === "officer" || user?.role === "admin";

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-ink/40 mb-1">#{report.id.slice(0, 8).toUpperCase()}</p>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-700 text-3xl capitalize">{report.category.replace("_", " ")}</h1>
        <StatusBadge status={report.status} />
      </div>

      {report.image_path && (
        <img src={api.imageUrl(report.image_path)} alt="report" className="w-full h-64 object-cover rounded-xl mb-6" />
      )}

      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div>
          <p className="text-ink/40 mb-1">Severity</p>
          <SeverityBadge severity={report.severity} />
        </div>
        <div>
          <p className="text-ink/40 mb-1">AI confidence</p>
          <p className="font-mono">{(report.ai_confidence * 100).toFixed(0)}% ({report.ai_source})</p>
        </div>
        <div>
          <p className="text-ink/40 mb-1">Location</p>
          <p className="font-mono">{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</p>
        </div>
        <div>
          <p className="text-ink/40 mb-1">Reported</p>
          <p>{new Date(report.created_at).toLocaleString()}</p>
        </div>
      </div>

      {report.description && (
        <div className="mb-8">
          <p className="text-ink/40 text-sm mb-1">Description</p>
          <p>{report.description}</p>
        </div>
      )}

      <h2 className="font-display font-600 text-lg mb-4">Timeline</h2>
      <div className="space-y-4 mb-10">
        {report.updates.map((u) => (
          <div key={u.id} className="flex gap-4 items-start">
            <div className="w-2 h-2 rounded-full bg-teal mt-2 flex-shrink-0" />
            <div>
              <p className="font-medium capitalize">{u.status.replace("_", " ")}</p>
              {u.note && <p className="text-sm text-ink/60">{u.note}</p>}
              <p className="text-xs text-ink/40 font-mono">{new Date(u.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {canManage && (
        <form onSubmit={handleStatusChange} className="ticket rounded-xl p-6 space-y-4">
          <h3 className="font-display font-600">Update status</h3>
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
            className="w-full border border-line rounded-lg px-4 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          <input
            className="w-full border border-line rounded-lg px-4 py-2 text-sm"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="rounded-full bg-teal text-white px-5 py-2.5 text-sm font-medium hover:bg-teal-dark">
            Update
          </button>
        </form>
      )}
    </div>
  );
}
