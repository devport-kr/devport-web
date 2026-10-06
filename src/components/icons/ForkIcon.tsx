export default function ForkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="6" cy="6" r="3"/>
      <circle cx="18" cy="6" r="3"/>
      <circle cx="12" cy="18" r="3"/>
      <path d="M6 9v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/>
      <path d="M12 12v3"/>
    </svg>
  );
}
