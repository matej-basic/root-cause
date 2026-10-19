import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders challenge descriptions. react-markdown does not render raw HTML by
// default and we do not add rehype-raw, so embedded HTML in the markdown is
// treated as text. Only remark-gfm (tables, lists, autolinks) is enabled.
export function Markdown({ content }: { content: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Descriptions open with "# Title"; the page already has the h1, so
        // shift markdown headings down one level.
        components={{
          h1: (props) => <h2 {...props} />,
          h2: (props) => <h3 {...props} />,
          h3: (props) => <h4 {...props} />,
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
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
