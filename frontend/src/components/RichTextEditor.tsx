import { useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const modules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "link",
];

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const mods = useMemo(() => modules, []);

  return (
    <div className="rich-text-editor rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-navy-500">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={mods}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
