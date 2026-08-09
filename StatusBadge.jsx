const STYLES = {
  submitted: "bg-ink/10 text-ink",
  routed: "bg-teal/10 text-teal",
  in_progress: "bg-amber/20 text-amber-dark",
  resolved: "bg-teal text-white",
  duplicate: "bg-ink/10 text-ink/60",
  rejected: "bg-rust/10 text-rust",
};

const LABELS = {
  submitted: "Submitted",
  routed: "Routed",
  in_progress: "In Progress",
  resolved: "Resolved",
  duplicate: "Duplicate",
  rejected: "Rejected",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STYLES[status] || "bg-ink/10"}`}>
      {LABELS[status] || status}
    </span>
  );
}
