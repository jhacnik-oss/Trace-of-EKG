import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const BABEL_URL = 'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js';

async function loadBabel() {
  const response = await fetch(BABEL_URL);
  if (!response.ok) throw new Error(`Failed to download Babel: ${response.status}`);
  const code = await response.text();
  const context = {};
  vm.createContext(context);
  vm.runInContext(code, context, { filename: 'babel-standalone.js' });
  return context.Babel;
}

const appDir = fileURLToPath(new URL('../app/', import.meta.url));
const Babel = await loadBabel();
const files = (await readdir(appDir))
  .filter((file) => file.endsWith('.jsx'))
  .sort((a, b) => {
    const order = [
      'state.jsx',
      'ekg.jsx',
      'media.jsx',
      'idle-strip.jsx',
      'live.jsx',
      'archive.jsx',
      'submit.jsx',
      'admin.jsx',
      'guest.jsx',
      'draft.jsx',
      'app.jsx',
      'main.jsx',
    ];
    return order.indexOf(a) - order.indexOf(b);
  });

for (const file of files) {
  const input = join(appDir, file);
  const output = input.replace(/\.jsx$/, '.js');
  const source = await readFile(input, 'utf8');
  const result = Babel.transform(source, {
    filename: file,
    sourceType: 'script',
    presets: [['react', { runtime: 'classic' }]],
    comments: true,
    compact: false,
  });
  await writeFile(output, `${result.code}\n`);
}
