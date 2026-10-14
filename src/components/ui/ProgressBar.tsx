type ProgressBarProps = {
  /** 0..1 */
  value: number;
  color?: string;
  height?: number;
  label?: string;
  className?: string;
};

export function ProgressBar({ value, color = 'var(--color-brand)', height = 8, label, className = '' }: ProgressBarProps) {
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={`progress-track ${className}`}
      style={{ height }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <div className="progress-fill" style={{ background: color, transform: `scaleX(${v})` }} />
    </div>
  );
}

export function Skeleton({ width = '100%', height = 16, className = '' }: { width?: number | string; height?: number | string; className?: string }) {
  return <div className={`skeleton ${className}`} style={{ width, height }} aria-hidden />;
}
