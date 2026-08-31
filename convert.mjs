// One-shot port script: Next.js source -> Vite React source (mechanical conversions)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SRC = '/home/user/sba2012';
const DST = '/home/user/sba2012-hosted/frontend/src';

// [source, destination]
const files = [
  ['lib/format.ts', 'lib/format.ts'],
  ['lib/site.ts', 'lib/site.ts'],
  ['components/ui.tsx', 'components/ui.tsx'],
  ['components/Header.tsx', 'components/Header.tsx'],
  ['components/Footer.tsx', 'components/Footer.tsx'],
  ['components/AuditClient.tsx', 'components/AuditClient.tsx'],
  ['components/ContactForm.tsx', 'components/ContactForm.tsx'],
  ['components/RegisterForm.tsx', 'components/RegisterForm.tsx'],
  ['components/GalleryClient.tsx', 'components/GalleryClient.tsx'],
  ['components/admin/ActiveLink.tsx', 'components/admin/ActiveLink.tsx'],
  ['components/admin/LogoutButton.tsx', 'components/admin/LogoutButton.tsx'],
  ['app/about/page.tsx', 'pages/About.tsx'],
  ['app/executives/page.tsx', 'pages/Executives.tsx'],
  ['app/audit/page.tsx', 'pages/Audit.tsx'],
  ['app/gallery/page.tsx', 'pages/Gallery.tsx'],
  ['app/contact/page.tsx', 'pages/Contact.tsx'],
  ['app/register/page.tsx', 'pages/Register.tsx'],
  ['app/admin/(panel)/dashboard/page.tsx', 'pages/admin/Dashboard.tsx'],
  ['app/admin/(panel)/payments/page.tsx', 'pages/admin/Payments.tsx'],
  ['app/admin/(panel)/content/news/page.tsx', 'pages/admin/News.tsx'],
  ['app/admin/(panel)/content/blogs/page.tsx', 'pages/admin/Blogs.tsx'],
  ['app/admin/(panel)/content/gallery/page.tsx', 'pages/admin/GalleryAdmin.tsx'],
  ['app/admin/(panel)/documents/page.tsx', 'pages/admin/Documents.tsx'],
  ['app/admin/(panel)/messages/page.tsx', 'pages/admin/Messages.tsx'],
  ['app/admin/(panel)/settings/page.tsx', 'pages/admin/Settings.tsx'],
];

function convert(code) {
  let t = code;
  // drop Next-only lines
  t = t.replace(/^"use client";\n/m, '');
  t = t.replace(/^export const dynamic = "force-dynamic";\n?/gm, '');
  t = t.replace(/^export const metadata = \{[^}]*\};\n?/gm, '');
  // router imports
  t = t.replace(/import Link from "next\/link";/g, 'import { Link } from "react-router-dom";');
  t = t.replace(/import \{ usePathname \} from "next\/navigation";/g, 'import { useLocation } from "react-router-dom";');
  t = t.replace(/import \{ useRouter \} from "next\/navigation";/g, 'import { useNavigate } from "react-router-dom";');
  t = t.replace(/import \{ redirect \} from "next\/navigation";/g, '');
  t = t.replace(/const router = useRouter\(\);/g, 'const navigate = useNavigate();');
  t = t.replace(/router\.push\(/g, 'navigate(');
  t = t.replace(/router\.refresh\(\);\n/g, '');
  // pathname usage
  t = t.replace(/const pathname = usePathname\(\) \|\| "\/";/g, 'const pathname = useLocation().pathname;');
  t = t.replace(/const pathname = usePathname\(\);/g, 'const pathname = useLocation().pathname;');
  // fetch -> apiFetch
  t = t.replace(/fetch\("/g, 'apiFetch("');
  t = t.replace(/fetch\(`/g, 'apiFetch(`');
  // uploads prefix
  t = t.replace(/src=\{`\/uploads\/\$\{src\}`\}/g, 'src={fileUrl(src)}');
  // default export name collisions are fine (one component per file)
  return t;
}

for (const [s, d] of files) {
  const src = join(SRC, s);
  if (!existsSync(src)) {
    console.log('MISSING:', s);
    continue;
  }
  let t = convert(readFileSync(src, 'utf8'));
  // inject apiFetch/fileUrl import if used
  const needsApi = /apiFetch\(/.test(t);
  const needsFile = /fileUrl\(/.test(t) && !/import .*fileUrl/.test(t);
  if (needsApi || needsFile) {
    const names = [...new Set([needsApi ? 'apiFetch' : '', needsFile ? 'fileUrl' : ''])].filter(Boolean);
    const importLine = `import { ${names.join(', ')} } from "@/lib/api";`;
    // insert after the first import statement
    t = t.replace(/(import [^\n]+\n)/, `$1${importLine}\n`);
  }
  const out = join(DST, d);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, t);
  console.log('port:', d);
}
console.log('done');
