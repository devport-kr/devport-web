/** Shown while a lazily loaded page's code downloads */
export default function PageFallback() {
  return (
    <div className="min-h-screen bg-glow flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin"></div>
    </div>
  );
}
