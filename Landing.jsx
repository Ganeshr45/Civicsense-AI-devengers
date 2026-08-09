import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PROBLEMS = [
  { label: "Manual Filing", detail: "Tedious, error-prone complaint systems." },
  { label: "Duplicate Complaints", detail: "Overflowing, unorganized tickets." },
  { label: "Misrouting", detail: "Wrong department assignment delays action." },
  { label: "Slow Response", detail: "Average 14+ day resolution turnaround." },
];

const FEATURES = [
  { n: "01", title: "Snap or speak", detail: "Citizens capture a photo (or describe the issue) in one tap — no forms to fill." },
  { n: "02", title: "AI classifies instantly", detail: "Computer vision reads the photo, assigns a category and a severity score." },
  { n: "03", title: "Duplicate check", detail: "Geospatial + text matching folds repeat reports into the original ticket." },
  { n: "04", title: "Auto-routed & tracked", detail: "The ticket goes straight to the right department, with live status for the citizen." },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-teal mb-4">Civic infrastructure, reimagined</p>
            <h1 className="font-display font-700 text-5xl md:text-6xl leading-[1.05] text-ink mb-6">
              One report today.<br />A better city tomorrow.
            </h1>
            <p className="text-lg text-ink/70 mb-8 max-w-md">
              CivicSense AI turns a single photo into a routed, tracked, resolved municipal ticket —
              no forms, no waiting in a queue that goes nowhere.
            </p>
            <div className="flex gap-4">
              <Link
                to={user ? "/report" : "/login"}
                className="rounded-full bg-teal text-white px-6 py-3 font-medium hover:bg-teal-dark transition-colors"
              >
                Report an issue
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-ink px-6 py-3 font-medium hover:bg-ink hover:text-white transition-colors"
              >
                Government login
              </Link>
            </div>
          </div>
          <div className="ticket rounded-2xl p-8 shadow-sm">
            <p className="font-mono text-xs text-ink/40 mb-1">TICKET #CS-2026-0417</p>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-600 text-xl">Pothole — Ward 12</h3>
              <span className="text-xs font-mono uppercase text-rust font-bold">High</span>
            </div>
            <div className="stub-divider pl-4 space-y-2 text-sm text-ink/70">
              <p>Detected by computer vision · 0.87 confidence</p>
              <p>Routed to Public Works Department</p>
              <p>Citizen notified in real time</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink text-paper py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display font-700 text-3xl mb-10">The civic problem, in four parts</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {PROBLEMS.map((p) => (
              <div key={p.label} className="border-t border-paper/20 pt-4">
                <h3 className="font-display font-600 mb-2">{p.label}</h3>
                <p className="text-sm text-paper/60">{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display font-700 text-3xl mb-10">How it works</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {FEATURES.map((f) => (
            <div key={f.n} className="flex gap-5">
              <span className="font-mono text-amber-dark text-sm pt-1">{f.n}</span>
              <div>
                <h3 className="font-display font-600 text-lg mb-1">{f.title}</h3>
                <p className="text-ink/60 text-sm">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
