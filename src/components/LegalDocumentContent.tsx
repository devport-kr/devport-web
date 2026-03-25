import ReactMarkdown from 'react-markdown';

interface LegalDocumentContentProps {
  content: string;
}

export default function LegalDocumentContent({
  content,
}: LegalDocumentContentProps) {
  return (
    <div className="wiki-markdown legal-markdown max-w-none">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="wiki-markdown-link"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
