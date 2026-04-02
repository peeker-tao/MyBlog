const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'vendor');

const assets = [
  {
    source: path.join(__dirname, '..', 'node_modules', 'marked', 'marked.min.js'),
    target: path.join(targetDir, 'marked.min.js'),
  },
  {
    source: path.join(__dirname, '..', 'node_modules', 'katex', 'dist', 'katex.min.js'),
    target: path.join(targetDir, 'katex.min.js'),
  },
  {
    source: path.join(
      __dirname,
      '..',
      'node_modules',
      'katex',
      'dist',
      'contrib',
      'auto-render.min.js',
    ),
    target: path.join(targetDir, 'katex-auto-render.min.js'),
  },
  {
    source: path.join(__dirname, '..', 'node_modules', 'katex', 'dist', 'katex.min.css'),
    target: path.join(targetDir, 'katex.min.css'),
  },
  {
    source: path.join(
      __dirname,
      '..',
      'node_modules',
      'highlight.js',
      'styles',
      'github.min.css',
    ),
    target: path.join(targetDir, 'highlight.min.css'),
  },
  {
    source: path.join(
      __dirname,
      '..',
      'node_modules',
      'highlight.js',
      'lib',
      'common.js',
    ),
    target: path.join(targetDir, 'highlight.min.js'),
  },
];

try {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const asset of assets) {
    fs.copyFileSync(asset.source, asset.target);
    console.log(`Copied ${path.basename(asset.target)}`);
  }
} catch (err) {
  console.warn('Skipping vendor copy:', err.message);
}
