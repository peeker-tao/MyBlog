const { getDb } = require('../db');
const { toSlug } = require('../utils/slugify');
const { excerpt } = require('../utils/text');
const categoryModel = require('./categoryModel');
const tagModel = require('./tagModel');

const baseSelect =
  "SELECT p.*, c.name AS category_name, c.slug AS category_slug, (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved') AS comment_count FROM posts p LEFT JOIN categories c ON c.id = p.category_id";

async function createPost({
  title,
  content,
  categoryName,
  tags,
  status = 'published',
}) {
  const db = await getDb();
  const slug = toSlug(title);
  const category = await categoryModel.getOrCreateCategory(categoryName);

  const result = await db.run(
    'INSERT INTO posts (title, slug, content, category_id, status) VALUES (?, ?, ?, ?, ?)',
    title,
    slug,
    content,
    category ? category.id : null,
    status,
  );

  await syncTags(result.lastID, tags);
  return result.lastID;
}

async function updatePost(
  id,
  { title, content, categoryName, tags, status = 'published' },
) {
  const db = await getDb();
  const slug = toSlug(title);
  const category = await categoryModel.getOrCreateCategory(categoryName);
  const existing = await db.get('SELECT status FROM posts WHERE id = ?', id);
  const prevStatus = existing ? existing.status : null;

  let sql =
    'UPDATE posts SET title = ?, slug = ?, content = ?, category_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP';
  const params = [title, slug, content, category ? category.id : null, status];
  if (prevStatus === 'draft' && status === 'published') {
    sql += ', created_at = CURRENT_TIMESTAMP';
  }
  sql += ' WHERE id = ?';
  params.push(id);

  await db.run(sql, params);

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
  let post = await db.get(
    `${baseSelect} WHERE p.slug = ? AND p.status = 'published'`,
    slug,
  );
  if (!post) {
    const encodedSlug = encodeURIComponent(slug);
    if (encodedSlug !== slug) {
      post = await db.get(
        `${baseSelect} WHERE p.slug = ? AND p.status = 'published'`,
        encodedSlug,
      );
    }
  }
  if (!post && slug.includes('%')) {
    try {
      const decodedSlug = decodeURIComponent(slug);
      if (decodedSlug !== slug) {
        post = await db.get(
          `${baseSelect} WHERE p.slug = ? AND p.status = 'published'`,
          decodedSlug,
        );
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
  const posts = await db.all(
    `${baseSelect} WHERE p.status = 'published' ORDER BY p.created_at DESC`,
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

async function listPostsByCategory(categoryId) {
  const db = await getDb();
  const posts = await db.all(
    `${baseSelect} WHERE p.category_id = ? AND p.status = 'published' ORDER BY p.created_at DESC`,
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
    "SELECT p.*, c.name AS category_name, c.slug AS category_slug, (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved') AS comment_count FROM posts p INNER JOIN post_tags pt ON pt.post_id = p.id LEFT JOIN categories c ON c.id = p.category_id WHERE pt.tag_id = ? AND p.status = 'published' ORDER BY p.created_at DESC",
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
    "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count FROM posts WHERE status = 'published' GROUP BY month ORDER BY month DESC",
  );
}

async function listArchivesByDay() {
  const db = await getDb();
  return db.all(
    "SELECT strftime('%Y-%m-%d', created_at) AS day, COUNT(*) AS count FROM posts WHERE status = 'published' GROUP BY day ORDER BY day DESC",
  );
}

async function listPostsByMonth(month) {
  const db = await getDb();
  const posts = await db.all(
    `${baseSelect} WHERE strftime('%Y-%m', p.created_at) = ? AND p.status = 'published' ORDER BY p.created_at DESC`,
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
    `${baseSelect} WHERE strftime('%Y-%m-%d', p.created_at) = ? AND p.status = 'published' ORDER BY p.created_at DESC`,
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
    "SELECT p.*, c.name AS category_name, c.slug AS category_slug, (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved') AS comment_count FROM posts_fts f INNER JOIN posts p ON p.id = f.rowid LEFT JOIN categories c ON c.id = p.category_id WHERE posts_fts MATCH ? AND p.status = 'published' ORDER BY p.created_at DESC",
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

async function listAllPosts() {
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

async function searchAllPosts(term) {
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
  listAllPosts,
  listPostsByCategory,
  listPostsByTag,
  listArchives,
  listArchivesByDay,
  listPostsByMonth,
  listPostsByDay,
  searchPosts,
  searchAllPosts,
  syncTags,
};
