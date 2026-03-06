import { Children, isValidElement, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

interface WikiMarkdownRendererProps {
  content: string;
  className?: string;
  headingIdPrefix?: string;
}

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}

interface PreComponentProps {
  children?: ReactNode;
}

const WIKI_IDENTIFIER_LINE_RE = /^지금 항목 식별자는\s+sec-\d+\/sub-\d+-\d+\/\d+이다\.?/;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/[\u007f-\u009f]/g, '')
    .replace(/[^a-z0-9가-힣a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'section';
}

function extractNodeText(children: ReactNode): string {
  if (children == null) return '';
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(extractNodeText).join('');
  }

  if (isValidElement(children)) {
    const nested = (children.props as { children?: ReactNode }).children;
    return extractNodeText(nested);
  }

  return '';
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'antiscript',
  suppressErrorRendering: true,
  theme: 'dark',
  fontFamily: 'General Sans, sans-serif',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
  },
  themeVariables: {
    darkMode: true,
    background: '#080f1c',
    primaryColor: '#101c33',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#5a759f',
    secondaryColor: '#14243d',
    secondaryTextColor: '#ffffff',
    secondaryBorderColor: '#4d709d',
    tertiaryColor: '#0f1d31',
    tertiaryTextColor: '#ffffff',
    tertiaryBorderColor: '#43608a',
    lineColor: '#5c7698',
    clusterBkg: '#0d1624',
    clusterBorder: '#405c88',
    edgeLabelBackground: '#0a1220',
    noteBkgColor: '#101f38',
    noteTextColor: '#ffffff',
    noteBorderColor: '#4d6b96',
    actorBkg: '#101f38',
    actorBorder: '#4d6b96',
    actorTextColor: '#ffffff',
    sequenceTextColor: '#ffffff',
    sequenceNumberColor: '#ffffff',
    fontSize: '16px',
  },
});

function sanitizeMermaidDiagram(source: string): string {
  // Mermaid treats [/label] and [\label] as trapezoid shapes.
  // Labels that start with / but lack a matching closing / before ] cause parse errors.
  // Wrap them in quotes to force plain rectangle rendering.
  return source
    .replace(/\[\/([^\/\]"]+)\]/g, '[\"/$1\"]')
    .replace(/\[\\([^\\>\]"]+)\]/g, '[\"\\$1\"]');
}

function normalizeMermaidSource(rawSource: string): string {
  const trimmed = rawSource.trim();
  const stripped = trimmed.startsWith('```')
    ? trimmed
        .replace(/^```\s*mermaid\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/, '')
        .trim()
    : trimmed;
  return sanitizeMermaidDiagram(stripped);
}

function normalizeRenderedSvg(rawSvg: string): string {
  const viewBoxMatch = rawSvg.match(/viewBox="[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/i);
  if (!viewBoxMatch) return rawSvg;

  const width = Number(viewBoxMatch[1]);
  const height = Number(viewBoxMatch[2]);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return rawSvg;
  }

  let normalized = rawSvg;
  normalized = normalized.replace(/\sstyle="[^"]*max-width:[^"]*"/i, '');

  if (/\swidth="[^"]*"/i.test(normalized)) {
    normalized = normalized.replace(/\swidth="[^"]*"/i, ` width="${width}"`);
  } else {
    normalized = normalized.replace('<svg', `<svg width="${width}"`);
  }

  if (/\sheight="[^"]*"/i.test(normalized)) {
    normalized = normalized.replace(/\sheight="[^"]*"/i, ` height="${height}"`);
  } else {
    normalized = normalized.replace('<svg', `<svg height="${height}"`);
  }

  if (!/\sdata-wiki-normalized="1"/i.test(normalized)) {
    normalized = normalized.replace('<svg', '<svg data-wiki-normalized="1"');
  }

  return normalized;
}

function sanitizeMermaidSvgColors(rawSvg: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    if (doc.querySelector('parsererror')) {
      return rawSvg
        .replace(/(fill=")(?!none|url\()#?[0-9a-fA-F]{3,8}(")/g, '$1#101c33$2')
        .replace(/(stroke=")(?!none|url\()#?[0-9a-fA-F]{3,8}(")/g, '$1#5c7698$2')
        .replace(/(fill:\s*)#?[0-9a-fA-F]{3,8}/g, '$1#101c33')
        .replace(/(stroke:\s*)#?[0-9a-fA-F]{3,8}/g, '$1#5c7698');
    }

    const svg = doc.querySelector('svg');
    if (!svg) return rawSvg;

    const bg = '#080f1c';
    const nodeFill = '#101c33';
    const nodeStroke = '#5c7698';
    const textColor = '#ffffff';

    svg.querySelectorAll('*').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const isText = tag === 'text' || tag === 'tspan';
      const isSvgTextContainer = tag === 'foreignObject';
      const className = el.getAttribute('class') || '';
      const isUrlRef = (value: string | null) => value ? value.trim().toLowerCase().startsWith('url(') : false;
      const isNodeLike = ['rect', 'circle', 'ellipse', 'polygon', 'path'].includes(tag) || /\bnode\b/.test(className);

      const fill = el.getAttribute('fill');
      const stroke = el.getAttribute('stroke');
      
      const elementWithStyle = el as HTMLElement | SVGElement;

      if (isText) {
        elementWithStyle.style.setProperty('fill', textColor, 'important');
      } else if (isNodeLike) {
        if ((!fill || fill.toLowerCase() !== 'none') && !isUrlRef(fill)) {
          elementWithStyle.style.setProperty('fill', nodeFill, 'important');
        }
      }

      if (isText) {
        elementWithStyle.style.setProperty('stroke', textColor, 'important');
      } else if (stroke && stroke.toLowerCase() !== 'none' && !isUrlRef(stroke)) {
        elementWithStyle.style.setProperty('stroke', nodeStroke, 'important');
      } else if (!stroke && !isSvgTextContainer) {
        elementWithStyle.style.setProperty('stroke', nodeStroke, 'important');
      }

      if (isText) {
        elementWithStyle.style.setProperty('color', textColor, 'important');
      } else if (isSvgTextContainer) {
        elementWithStyle.style.setProperty('color', textColor, 'important');
      }

      if (tag === 'style' || tag === 'defs' || tag === 'marker' || tag === 'title' || tag === 'desc') {
        return;
      }
    });

    const svgWithStyle = svg as unknown as HTMLElement | SVGElement;
    svgWithStyle.style.setProperty('background-color', bg, 'important');
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return rawSvg;
  }
}

function sanitizeWikiMarkdown(rawContent: string): string {
  let normalized = rawContent.replace(/\r\n/g, '\n');

  if (/\\n(?:#{1,6}\s|```|지금 항목 식별자는)/.test(normalized)) {
    normalized = normalized.replace(/\\n/g, '\n');
  }

  normalized = normalized.replace(/```\s+mermaid/gi, '```mermaid');
  const lines = normalized.split('\n');
  const cleaned: string[] = [];
  let previousLine = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (WIKI_IDENTIFIER_LINE_RE.test(trimmed)) {
      continue;
    }

    if (trimmed && trimmed === previousLine) {
      continue;
    }

    cleaned.push(line);
    previousLine = trimmed;
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n');
}

export function MermaidCodeBlock({ source, title = null }: { source: string; title?: string | null }) {
  const diagram = normalizeMermaidSource(source);
  const [svg, setSvg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const renderId = useId().replace(/:/g, '');

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      if (!diagram) return;

      // Clean up any leftover element from a prior cancelled render to avoid ID collision.
      document.getElementById(`wiki-mermaid-${renderId}`)?.remove();

      try {
        const { svg: renderedSvg } = await mermaid.render(`wiki-mermaid-${renderId}`, diagram);
        if (!cancelled) {
          const normalizedSvg = sanitizeMermaidSvgColors(normalizeRenderedSvg(renderedSvg));
          setSvg(normalizedSvg);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setSvg('');
          setErrorMessage(error instanceof Error ? error.message : 'Failed to render diagram');
        }
      }
    }

    setSvg('');
    setErrorMessage(null);
    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [diagram, renderId]);

  if (!diagram) return null;

  return (
    <div className="my-4">
      {title && <div className="mb-2 text-xs text-text-muted uppercase tracking-wide">{title}</div>}
      {errorMessage ? (
        <pre className="overflow-x-auto rounded-lg border border-surface-border p-3 bg-surface-elevated/60">
          <code className="text-[12px] leading-6 text-text-secondary font-mono whitespace-pre-wrap">{diagram}</code>
        </pre>
      ) : svg ? (
        <div className="overflow-x-auto py-2">
          <div className="wiki-mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      ) : (
        <div className="px-1 py-2 text-xs text-text-muted">Rendering diagram...</div>
      )}
    </div>
  );
}

function getCodeText(children: ReactNode | undefined): string {
  if (!children) return '';
  return Children.toArray(children)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('');
}

function WikiCodeBlock({ inline, className, children }: CodeComponentProps) {
  const codeText = useMemo(() => getCodeText(children).replace(/\n$/, ''), [children]);
  if (!codeText) return null;

  if (inline) {
    return (
      <code className="px-1 py-0.5 rounded bg-surface-elevated/80 text-text-secondary border border-surface-border text-[12px] font-mono">
        {codeText}
      </code>
    );
  }

  return (
    <code className={`${className ? `${className} ` : ''}text-xs text-text-secondary leading-relaxed font-mono break-words`}>
      {codeText}
    </code>
  );
}

function WikiPreBlock({ children }: PreComponentProps) {
  const firstChild = Children.toArray(children)[0];

  if (isValidElement<CodeComponentProps>(firstChild)) {
    const codeProps = firstChild.props;
    const language = codeProps.className?.match(/language-([\w-]+)/)?.[1]?.toLowerCase();
    const codeText = getCodeText(codeProps.children).replace(/\n$/, '');

    if (language === 'mermaid') {
      return <MermaidCodeBlock source={codeText} />;
    }
  }

  return <pre className="overflow-x-auto rounded-lg border border-surface-border bg-surface-elevated/70 p-3">{children}</pre>;
}

export default function WikiMarkdownRenderer({
  content,
  className = '',
  headingIdPrefix,
}: WikiMarkdownRendererProps) {
  const markdown = useMemo(() => sanitizeWikiMarkdown(content).trim(), [content]);
  if (!markdown) return null;

  // Fresh counter map per render so heading IDs are stable across re-renders.
  const headingCounters = new Map<string, number>();

  const buildHeadingId = (level: number, children: ReactNode): string => {
    if (!headingIdPrefix) return '';
    const text = extractNodeText(children).trim() || `section-${level}`;
    const baseSlug = slugify(text);
    const key = `${level}:${baseSlug}`;
    const currentCount = headingCounters.get(key) ?? 0;
    headingCounters.set(key, currentCount + 1);
    const uniqueSlug = currentCount > 0 ? `${baseSlug}-${currentCount + 1}` : baseSlug;
    return `${headingIdPrefix}${uniqueSlug}`;
  };

  const collectHeading = (level: number, children: ReactNode) => {
    const text = extractNodeText(children).trim();
    if (!text) return null;
    const id = buildHeadingId(level, children);
    if (!id) return null;
    return {
      id,
      level,
      label: text,
    };
  };

  return (
    <div className={`wiki-markdown ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          h1: ({ children }) => <h1 id={collectHeading(1, children)?.id}>{children}</h1>,
          h2: ({ children }) => <h2 id={collectHeading(2, children)?.id}>{children}</h2>,
          h3: ({ children }) => <h3 id={collectHeading(3, children)?.id}>{children}</h3>,
          h4: ({ children }) => <h4 id={collectHeading(4, children)?.id}>{children}</h4>,
          h5: ({ children }) => <h5 id={collectHeading(5, children)?.id}>{children}</h5>,
          h6: ({ children }) => <h6 id={collectHeading(6, children)?.id}>{children}</h6>,
          table: ({ children }) => <table>{children}</table>,
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href ?? '#'}
              target={href ? '_blank' : undefined}
              rel={href ? 'noopener noreferrer' : undefined}
              className="wiki-markdown-link"
            >
              {children}
            </a>
          ),
          code: WikiCodeBlock,
          pre: WikiPreBlock,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
