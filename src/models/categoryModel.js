const { getDb } = require('../db');
const { toSlug } = require('../utils/slugify');

async function getOrCreateCategory(name) {
  if (!name || !name.trim()) {
    return null;
  }
  const db = await getDb();
  const trimmed = name.trim();
  const slug = toSlug(trimmed);
  let existing = await db.get(
    'SELECT * FROM categories WHERE name = ?',
    trimmed,
  );
  if (!existing) {
    existing = await db.get('SELECT * FROM categories WHERE slug = ?', slug);
  }
  if (existing) {
    return existing;
  }
  await db.run(
    'INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)',
    trimmed,
    slug,
  );
  const created = await db.get(
    'SELECT * FROM categories WHERE name = ?',
    trimmed,
  );
  return created || null;
}

async function listCategories() {
  const db = await getDb();
  const categories = await db.all(
    'SELECT c.*, COUNT(p.id) AS post_count FROM categories c LEFT JOIN posts p ON p.category_id = c.id GROUP BY c.id HAVING COUNT(p.id) > 0 ORDER BY c.name',
  );
  for (const category of categories) {
    if (!category.slug || !category.slug.trim()) {
      const newSlug = toSlug(category.name || '') || `category-${category.id}`;
      await db.run(
        'UPDATE categories SET slug = ? WHERE id = ?',
        newSlug,
        category.id,
      );
      category.slug = newSlug;
    }
  }
  return categories;
}

async function getCategoryBySlug(slug) {
  const db = await getDb();
  let category = await db.get('SELECT * FROM categories WHERE slug = ?', slug);
  if (!category) {
    const encodedSlug = encodeURIComponent(slug);
    if (encodedSlug !== slug) {
      category = await db.get(
        'SELECT * FROM categories WHERE slug = ?',
        encodedSlug,
      );
    }
  }
  if (!category && slug.includes('%')) {
    try {
      const decodedSlug = decodeURIComponent(slug);
      if (decodedSlug !== slug) {
        category = await db.get(
          'SELECT * FROM categories WHERE slug = ?',
          decodedSlug,
        );
      }
    } catch (error) {
      // Ignore malformed URI sequences.
    }
  }
  return category;
}

async function cleanupUnusedCategories() {
  const db = await getDb();
  await db.run(
    'DELETE FROM categories WHERE id NOT IN (SELECT DISTINCT category_id FROM posts WHERE category_id IS NOT NULL)',
  );
}

module.exports = {
  getOrCreateCategory,
  listCategories,
  getCategoryBySlug,
  cleanupUnusedCategories,
};
