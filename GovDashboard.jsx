import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import SeverityBadge from "../components/SeverityBadge";

const SEVERITY_COLOR = { low: "#0F6E67", medium: "#F2A93B", high: "#C1502E", critical: "#8A2E1B" };

export default function GovDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboardStats().then(setStats).catch((e) => setError(e.message));
    api.listReports({}).then(setReports).catch((e) => setError(e.message));
  }, []);

  const center = reports.length ? [reports[0].latitude, reports[0].longitude] : [12.9716, 77.5946];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="font-display font-700 text-3xl mb-8">Government dashboard</h1>
      {error && <p className="text-rust mb-4">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total reports" value={stats.total_reports} />
          <StatCard label="Resolved" value={stats.resolved} />
          <StatCard label="In progress" value={stats.in_progress} />
          <StatCard
            label="Avg. resolution"
            value={stats.avg_resolution_hours != null ? `${stats.avg_resolution_hours}h` : "—"}
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div className="rounded-xl overflow-hidden border border-line h-80">
          <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {reports.map((r) => (
              <CircleMarker
                key={r.id}
                center={[r.latitude, r.longitude]}
                radius={7}
                pathOptions={{ color: SEVERITY_COLOR[r.severity], fillOpacity: 0.7 }}
              >
                <Popup>
                  <strong className="capitalize">{r.category.replace("_", " ")}</strong>
                  <br />
                  {r.severity} severity · {r.status}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="border border-line rounded-xl p-6">
          <h3 className="font-display font-600 mb-4">By category</h3>
          <div className="space-y-2">
            {stats &&
              Object.entries(stats.by_category).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-28 text-sm capitalize text-ink/70">{cat.replace("_", " ")}</span>
                  <div className="flex-1 bg-line rounded-full h-2">
                    <div
                      className="bg-teal h-2 rounded-full"
                      style={{ width: `${(count / stats.total_reports) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono w-6 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <h2 className="font-display font-600 text-xl mb-4">Priority queue</h2>
      <div className="border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink text-paper text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Reported</th>
            </tr>
          </thead>
          <tbody>
            {reports.slice(0, 25).map((r) => (
              <tr key={r.id} className="border-t border-line hover:bg-teal/5">
                <td className="px-4 py-3">
                  <Link to={`/reports/${r.id}`} className="font-mono text-xs text-teal hover:underline">
                    #{r.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">{r.category.replace("_", " ")}</td>
                <td className="px-4 py-3"><SeverityBadge severity={r.severity} /></td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-ink/60">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border border-line rounded-xl p-5">
      <p className="text-xs text-ink/40 uppercase tracking-wide mb-2">{label}</p>
      <p className="font-display font-700 text-3xl">{value}</p>
    </div>
  );
}
