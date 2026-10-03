// Raw color values for libraries that can't use Tailwind classes (Recharts, SVG attributes).
// Keep in sync with the --c-* variables in src/index.css.
export const themeColors = {
  surface: '#0a131e',
  elevated: '#0e1825',
  card: '#101b29',
  hover: '#162233',
  border: '#213045',
  borderStrong: '#2e4059',
  text: '#e6edf5',
  textSecondary: '#aebccc',
  textMuted: '#7a8aa0',
  accent: '#4a94ff',
  signal: '#f0b44c',
} as const;

// Plex Sans KR covers Hangul, which Plex Mono lacks
export const monoFont = '"IBM Plex Mono", "IBM Plex Sans KR", ui-monospace, monospace';

// Shared Recharts styling
export const chartTooltipStyle = {
  contentStyle: {
    background: themeColors.elevated,
    border: `1px solid ${themeColors.borderStrong}`,
    borderRadius: 3,
    color: themeColors.text,
    fontSize: 12,
    fontFamily: monoFont,
  },
  labelStyle: { color: themeColors.textMuted },
  itemStyle: { color: themeColors.text },
} as const;

export const chartAxisTick = { fill: themeColors.textMuted, fontSize: 10, fontFamily: monoFont } as const;
