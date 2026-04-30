const { getDb } = require('../db');
const { toSlug } = require('../utils/slugify');

async function getOrCreateTag(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  const slug = toSlug(trimmed);
  const db = await getDb();
  let existing = await db.get('SELECT * FROM tags WHERE name = ?', trimmed);
  if (!existing) {
    existing = await db.get('SELECT * FROM tags WHERE slug = ?', slug);
  }
  if (existing) {
    return existing;
  }
  await db.run(
    'INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)',
    trimmed,
    slug,
  );
  const created = await db.get('SELECT * FROM tags WHERE name = ?', trimmed);
  return created || null;
}

async function listTagsWithCount() {
  const db = await getDb();
  const tags = await db.all(
    'SELECT t.*, COUNT(pt.post_id) AS post_count FROM tags t LEFT JOIN post_tags pt ON pt.tag_id = t.id GROUP BY t.id HAVING COUNT(pt.post_id) > 0 ORDER BY t.name',
  );
  for (const tag of tags) {
    if (!tag.slug || !tag.slug.trim()) {
      const newSlug = toSlug(tag.name || '') || `tag-${tag.id}`;
      await db.run('UPDATE tags SET slug = ? WHERE id = ?', newSlug, tag.id);
      tag.slug = newSlug;
    }
  }
  return tags;
}

async function getTagBySlug(slug) {
  const db = await getDb();
  let tag = await db.get('SELECT * FROM tags WHERE slug = ?', slug);
  if (!tag) {
    const encodedSlug = encodeURIComponent(slug);
    if (encodedSlug !== slug) {
      tag = await db.get('SELECT * FROM tags WHERE slug = ?', encodedSlug);
    }
  }
  if (!tag && slug.includes('%')) {
    try {
      const decodedSlug = decodeURIComponent(slug);
      if (decodedSlug !== slug) {
        tag = await db.get('SELECT * FROM tags WHERE slug = ?', decodedSlug);
      }
    } catch (error) {
      // Ignore malformed URI sequences.
    }
  }
  return tag;
}

async function listTagsForPost(postId) {
  const db = await getDb();
  return db.all(
    'SELECT t.* FROM tags t INNER JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ? ORDER BY t.name',
    postId,
  );
}

async function cleanupUnusedTags() {
  const db = await getDb();
  await db.run(
    'DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM post_tags)',
  );
}

module.exports = {
  getOrCreateTag,
  listTagsWithCount,
  getTagBySlug,
  listTagsForPost,
  cleanupUnusedTags,
};
