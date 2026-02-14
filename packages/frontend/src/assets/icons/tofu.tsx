export function TofuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="5" width="18" height="15" rx="4" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9.5 15.5c1 1 4 1 5 0" />
      <circle cx="6.5" cy="14" r="1" fill="currentColor" stroke="none" opacity="0.25" />
      <circle cx="17.5" cy="14" r="1" fill="currentColor" stroke="none" opacity="0.25" />
    </svg>
  );
}
