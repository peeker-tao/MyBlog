const slugify = require('slugify');

function toSlug(value) {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  let slug = slugify(trimmed, {
    lower: true,
    strict: false,
    trim: true,
  }).replace(/\s+/g, '-');
  if (!slug) {
    slug = trimmed.replace(/\s+/g, '-');
  }
  return slug;
}

module.exports = { toSlug };
