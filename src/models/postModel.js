const { getDb } = require('../db');
const { toSlug } = require('../utils/slugify');
const { excerpt } = require('../utils/text');
const categoryModel = require('./categoryModel');
const tagModel = require('./tagModel');

const baseSelect =
  "SELECT p.*, c.name AS category_name, c.slug AS category_slug, (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved') AS comment_count FROM posts p LEFT JOIN categories c ON c.id = p.category_id";

async function createPost({ title, content, categoryName, tags }) {
  const db = await getDb();
  const slug = toSlug(title);
  const category = await categoryModel.getOrCreateCategory(categoryName);

  const result = await db.run(
    'INSERT INTO posts (title, slug, content, category_id) VALUES (?, ?, ?, ?)',
    title,
    slug,
    content,
    category ? category.id : null,
  );

  await syncTags(result.lastID, tags);
  return result.lastID;
}

async function updatePost(id, { title, content, categoryName, tags }) {
  const db = await getDb();
  const slug = toSlug(title);
  const category = await categoryModel.getOrCreateCategory(categoryName);

  await db.run(
    'UPDATE posts SET title = ?, slug = ?, content = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    title,
    slug,
    content,
    category ? category.id : null,
    id,
  );

  await syncTags(id, tags);
  await categoryModel.cleanupUnusedCategories();
  await tagModel.cleanupUnusedTags();
}

async function deletePost(id) {
  const db = await getDb();
  await db.run('DELETE FROM posts WHERE id = ?', id);
  await categoryModel.cleanupUnusedCategories();
  await tagModel.cleanupUnusedTags();
}

async function getPostById(id) {
  const db = await getDb();
  const post = await db.get(`${baseSelect} WHERE p.id = ?`, id);
  if (!post) {
    return null;
  }
  if (!post.slug || !post.slug.trim()) {
    const newSlug = toSlug(post.title || '') || `post-${post.id}`;
    await db.run('UPDATE posts SET slug = ? WHERE id = ?', newSlug, post.id);
    post.slug = newSlug;
  }
  post.tags = await tagModel.listTagsForPost(post.id);
  post.excerpt = excerpt(post.content);
  return post;
}

async function getPostBySlug(slug) {
  const db = await getDb();
  let post = await db.get(`${baseSelect} WHERE p.slug = ?`, slug);
  if (!post) {
    const encodedSlug = encodeURIComponent(slug);
    if (encodedSlug !== slug) {
      post = await db.get(`${baseSelect} WHERE p.slug = ?`, encodedSlug);
    }
  }
  if (!post && slug.includes('%')) {
    try {
      const decodedSlug = decodeURIComponent(slug);
      if (decodedSlug !== slug) {
        post = await db.get(`${baseSelect} WHERE p.slug = ?`, decodedSlug);
      }
    } catch (error) {
      // Ignore malformed URI sequences.
    }
  }
  if (!post) {
    return null;
  }
  post.tags = await tagModel.listTagsForPost(post.id);
  post.excerpt = excerpt(post.content);
  return post;
}

async function listPosts() {
  const db = await getDb();
  const posts = await db.all(`${baseSelect} ORDER BY p.created_at DESC`);
  for (const post of posts) {
    if (!post.slug || !post.slug.trim()) {
      const newSlug = toSlug(post.title || '') || `post-${post.id}`;
      await db.run('UPDATE posts SET slug = ? WHERE id = ?', newSlug, post.id);
      post.slug = newSlug;
    }
    post.tags = await tagModel.listTagsForPost(post.id);
    post.excerpt = excerpt(post.content);
  }
  return posts;
}

async function listPostsByCategory(categoryId) {
  const db = await getDb();
  const posts = await db.all(
    `${baseSelect} WHERE p.category_id = ? ORDER BY p.created_at DESC`,
    categoryId,
  );
  for (const post of posts) {
    if (!post.slug || !post.slug.trim()) {
      const newSlug = toSlug(post.title || '') || `post-${post.id}`;
      await db.run('UPDATE posts SET slug = ? WHERE id = ?', newSlug, post.id);
      post.slug = newSlug;
    }
    post.tags = await tagModel.listTagsForPost(post.id);
    post.excerpt = excerpt(post.content);
  }
  return posts;
}

async function listPostsByTag(tagId) {
  const db = await getDb();
  const posts = await db.all(
    "SELECT p.*, c.name AS category_name, c.slug AS category_slug, (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved') AS comment_count FROM posts p INNER JOIN post_tags pt ON pt.post_id = p.id LEFT JOIN categories c ON c.id = p.category_id WHERE pt.tag_id = ? ORDER BY p.created_at DESC",
    tagId,
  );
  for (const post of posts) {
    if (!post.slug || !post.slug.trim()) {
      const newSlug = toSlug(post.title || '') || `post-${post.id}`;
      await db.run('UPDATE posts SET slug = ? WHERE id = ?', newSlug, post.id);
      post.slug = newSlug;
    }
    post.tags = await tagModel.listTagsForPost(post.id);
    post.excerpt = excerpt(post.content);
  }
  return posts;
}

async function listArchives() {
  const db = await getDb();
  return db.all(
    "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count FROM posts GROUP BY month ORDER BY month DESC",
  );
}

async function listArchivesByDay() {
  const db = await getDb();
  return db.all(
    "SELECT strftime('%Y-%m-%d', created_at) AS day, COUNT(*) AS count FROM posts GROUP BY day ORDER BY day DESC",
  );
}

async function listPostsByMonth(month) {
  const db = await getDb();
  const posts = await db.all(
    `${baseSelect} WHERE strftime('%Y-%m', p.created_at) = ? ORDER BY p.created_at DESC`,
    month,
  );
  for (const post of posts) {
    if (!post.slug || !post.slug.trim()) {
      const newSlug = toSlug(post.title || '') || `post-${post.id}`;
      await db.run('UPDATE posts SET slug = ? WHERE id = ?', newSlug, post.id);
      post.slug = newSlug;
    }
    post.tags = await tagModel.listTagsForPost(post.id);
    post.excerpt = excerpt(post.content);
  }
  return posts;
}

async function listPostsByDay(day) {
  const db = await getDb();
  const posts = await db.all(
    `${baseSelect} WHERE strftime('%Y-%m-%d', p.created_at) = ? ORDER BY p.created_at DESC`,
    day,
  );
  for (const post of posts) {
    if (!post.slug || !post.slug.trim()) {
      const newSlug = toSlug(post.title || '') || `post-${post.id}`;
      await db.run('UPDATE posts SET slug = ? WHERE id = ?', newSlug, post.id);
      post.slug = newSlug;
    }
    post.tags = await tagModel.listTagsForPost(post.id);
    post.excerpt = excerpt(post.content);
  }
  return posts;
}

async function searchPosts(term) {
  const db = await getDb();
  if (!term || !term.trim()) {
    return [];
  }
  const query = term.trim();
  const posts = await db.all(
    "SELECT p.*, c.name AS category_name, c.slug AS category_slug, (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved') AS comment_count FROM posts_fts f INNER JOIN posts p ON p.id = f.rowid LEFT JOIN categories c ON c.id = p.category_id WHERE posts_fts MATCH ? ORDER BY p.created_at DESC",
    query,
  );
  for (const post of posts) {
    if (!post.slug || !post.slug.trim()) {
      const newSlug = toSlug(post.title || '') || `post-${post.id}`;
      await db.run('UPDATE posts SET slug = ? WHERE id = ?', newSlug, post.id);
      post.slug = newSlug;
    }
    post.tags = await tagModel.listTagsForPost(post.id);
    post.excerpt = excerpt(post.content);
  }
  return posts;
}

async function syncTags(postId, tags) {
  const db = await getDb();
  await db.run('DELETE FROM post_tags WHERE post_id = ?', postId);
  const cleanTags = (tags || [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  for (const tag of cleanTags) {
    const tagRow = await tagModel.getOrCreateTag(tag);
    if (tagRow) {
      await db.run(
        'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
        postId,
        tagRow.id,
      );
    }
  }
}

async function incrementReadCount(id) {
  const db = await getDb();
  await db.run('UPDATE posts SET read_count = read_count + 1 WHERE id = ?', id);
}

async function incrementLikeCount(id) {
  const db = await getDb();
  await db.run('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', id);
}

async function incrementFavoriteCount(id) {
  const db = await getDb();
  await db.run(
    'UPDATE posts SET favorite_count = favorite_count + 1 WHERE id = ?',
    id,
  );
}

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getPostById,
  getPostBySlug,
  incrementReadCount,
  incrementLikeCount,
  incrementFavoriteCount,
  listPosts,
  listPostsByCategory,
  listPostsByTag,
  listArchives,
  listArchivesByDay,
  listPostsByMonth,
  listPostsByDay,
  searchPosts,
};
