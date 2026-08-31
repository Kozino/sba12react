const fs = require('fs');
const path = require('path');
const SRC = '/home/user/sba2012-hosted/frontend/src';

function fix(f, fn) {
  const p = path.join(SRC, f);
  let t = fs.readFileSync(p, 'utf8');
  t = fn(t);
  // ensure fileUrl import present if used
  if (/fileUrl\(/.test(t)) {
    const m = t.match(/import \{ ([^}]*) \} from "@\/lib\/api";/);
    if (m) {
      if (!m[1].split(',').includes('fileUrl')) {
        t = t.replace(/import \{ ([^}]*) \} from "@\/lib\/api";/, `import { ${m[1]}, fileUrl } from "@/lib/api";`);
      }
    } else {
      t = t.replace(/(import [^\n]+\n)/, '$1import { fileUrl } from "@/lib/api";\n');
    }
  }
  fs.writeFileSync(p, t);
  console.log('fixed', f);
}

const tpl = (name) => 'src={`/uploads/${' + name + '}`';

fix('components/Header.tsx', (t) => t.split('href={l.href}').join('to={l.href}'));

fix('components/GalleryClient.tsx', (t) =>
  t.split(tpl('g.image')).join('src={fileUrl(g.image)}')
   .split(tpl('filtered[openIndex].image')).join('src={fileUrl(filtered[openIndex].image)}')
);

fix('pages/admin/News.tsx', (t) =>
  t.split('setPreview(item.image ? `/uploads/${item.image}` : null);').join('setPreview(item.image ? fileUrl(item.image) : null);')
   .split(tpl('n.image')).join('src={fileUrl(n.image)}')
);

fix('pages/admin/Blogs.tsx', (t) =>
  t.split('setPreview(item.image ? `/uploads/${item.image}` : null);').join('setPreview(item.image ? fileUrl(item.image) : null);')
   .split(tpl('b.image')).join('src={fileUrl(b.image)}')
);

fix('pages/admin/GalleryAdmin.tsx', (t) =>
  t.split('setPreview(item.image ? `/uploads/${item.image}` : null);').join('setPreview(item.image ? fileUrl(item.image) : null);')
   .split(tpl('g.image')).join('src={fileUrl(g.image)}')
);

fix('pages/admin/Documents.tsx', (t) =>
  t.split('href={' + '`/uploads/${d.filename}`' + '}').join('href={fileUrl(d.filename)}')
);

console.log('all done');
