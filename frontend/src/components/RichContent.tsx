import DOMPurify from "dompurify";

type Props = {
  html: string;
  className?: string;
};

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s",
  "h2", "h3", "ul", "ol", "li", "blockquote", "a",
];
const ALLOWED_ATTR = ["href", "target", "rel"];

export function RichContent({ html, className = "" }: Props) {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });

  return (
    <div
      className={`prose-content ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
