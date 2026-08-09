const STYLES = {
  low: "text-teal",
  medium: "text-amber-dark",
  high: "text-rust",
  critical: "text-rust font-bold",
};

export default function SeverityBadge({ severity }) {
  return <span className={`text-xs font-mono uppercase tracking-wide ${STYLES[severity] || ""}`}>{severity}</span>;
}
