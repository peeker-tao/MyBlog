const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { toSlug } = require('../src/utils/slugify');

const dbFile = path.join(__dirname, '..', 'db', 'blog.db');

const CATEGORY_POOL = ['随笔', '技术', '日常', '学习', '思考', '产品'];
const TAG_POOL = ['前端', '后端', '数据库', '算法', '生活', '效率', '工具', '随记'];
const WORDS = [
  '清晨', '微风', '记录', '灵感', '实践', '总结', '探索', '细节', '节奏', '光影',
  '代码', '想法', '笔记', '成长', '路径', '方向', '方法', '专注', '反馈', '迭代',
  '视角', '结构', '表达', '温度', '片刻', '阅读', '坚持', '体验', '问题', '解决',
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[randInt(0, list.length - 1)];
}

function buildTitle() {
  return `${pick(WORDS)}与${pick(WORDS)}的片段`;
}

function buildContent() {
  let text = '';
  while (text.length < 100) {
    text += `${pick(WORDS)}${pick(WORDS)}，`;
  }
  return text.slice(0, 120);
}

function randomDateISO() {
  const now = Date.now();
  const past = now - randInt(1, 365) * 24 * 60 * 60 * 1000;
  return new Date(past).toISOString();
}

async function getOrCreateCategory(db, name) {
  const slug = toSlug(name) || `category-${name}`;
  const existing = await db.get('SELECT id FROM categories WHERE slug = ?', slug);
  if (existing) {
    return existing.id;
  }
  const result = await db.run('INSERT INTO categories (name, slug) VALUES (?, ?)', name, slug);
  return result.lastID;
}

async function getOrCreateTag(db, name) {
  const slug = toSlug(name) || `tag-${name}`;
  const existing = await db.get('SELECT id FROM tags WHERE slug = ?', slug);
  if (existing) {
    return existing.id;
  }
  const result = await db.run('INSERT INTO tags (name, slug) VALUES (?, ?)', name, slug);
  return result.lastID;
}

async function main() {
  const count = Number.parseInt(process.argv[2], 10) || 10;
  const db = await open({ filename: dbFile, driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON;');

  for (let i = 0; i < count; i += 1) {
    const title = buildTitle();
    const slug = toSlug(title) || `post-${Date.now()}-${i}`;
    const content = buildContent();
    const categoryId = await getOrCreateCategory(db, pick(CATEGORY_POOL));
    const createdAt = randomDateISO();
    const readCount = randInt(10, 300);
    const likeCount = randInt(0, 80);
    const favoriteCount = randInt(0, 40);

    const result = await db.run(
      'INSERT INTO posts (title, slug, content, created_at, updated_at, category_id, read_count, like_count, favorite_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      title,
      slug,
      content,
      createdAt,
      createdAt,
      categoryId,
      readCount,
      likeCount,
      favoriteCount,
    );

    const postId = result.lastID;
    const tagCount = randInt(1, 3);
    const pickedTags = new Set();
    while (pickedTags.size < tagCount) {
      pickedTags.add(pick(TAG_POOL));
    }
    for (const tagName of pickedTags) {
      const tagId = await getOrCreateTag(db, tagName);
      await db.run('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', postId, tagId);
    }

    const commentCount = randInt(0, 5);
    for (let c = 0; c < commentCount; c += 1) {
      await db.run(
        "INSERT INTO comments (post_id, author, email, content, status, created_at) VALUES (?, ?, ?, ?, 'approved', ?)",
        postId,
        `访客${randInt(1, 99)}`,
        null,
        buildContent().slice(0, 40),
        randomDateISO(),
      );
    }
  }

  await db.close();
  console.log(`Inserted ${count} posts with random data.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
