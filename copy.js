const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'db');
const OUT_FILE = path.join(__dirname, 'docs', 'all-source-code.txt');

function getAllJsFiles(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

const files = getAllJsFiles(SRC_DIR);
let output = '';
for (const file of files) {
  output += `\n// ${path.relative(SRC_DIR, file)}\n`;
  output += fs.readFileSync(file, 'utf8');
  output += '\n';
}

// 追加写入，不覆盖
fs.appendFileSync(OUT_FILE, output, 'utf8');
console.log('已追加合并到', OUT_FILE);