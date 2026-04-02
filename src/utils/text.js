function stripMarkdown(value) {
  if (!value) {
    return '';
  }
  return value
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$\n]+\$/g, '')
    .replace(/\\\([^\n]+\\\)/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[#>*_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(value, maxLength = 180) {
  const plain = stripMarkdown(value);
  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, maxLength).trim()}...`;
}

module.exports = { stripMarkdown, excerpt };
