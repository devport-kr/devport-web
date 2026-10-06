// Naver's green square badge with the white N
export default function NaverIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#03C75A" />
      <path fill="#fff" d="M14.07 12.4 9.78 6.25H6.25v11.5h3.68V11.6l4.29 6.15h3.53V6.25h-3.68z" />
    </svg>
  );
}
