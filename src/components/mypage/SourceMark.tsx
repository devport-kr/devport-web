import { SOURCE_META } from './accountMeta';

/** Small tinted tile with the source's logo or initial, for article rows. */
export default function SourceMark({ source }: { source: string }) {
  const meta = SOURCE_META[source];
  const Mark = meta?.mark;

  return (
    <span
      aria-hidden
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold ${
        meta?.tile ?? 'bg-surface-hover text-text-secondary'
      }`}
    >
      {!Mark ? (
        source.charAt(0).toUpperCase()
      ) : typeof Mark === 'string' ? (
        <span className={meta.markClass}>{Mark}</span>
      ) : (
        <Mark className="h-4 w-4" />
      )}
    </span>
  );
}
