import './ui.css';

interface StatusDotProps {
  status: 'online' | 'offline' | 'warning';
  label?: string;
}

export default function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className={`status-dot-wrapper`}>
      <span className={`status-dot status-${status}`} />
      {label && <span className="status-label">{label}</span>}
    </span>
  );
}
