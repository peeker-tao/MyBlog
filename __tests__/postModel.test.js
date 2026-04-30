test('deletePost: 正常删除', async () => {
  mockRun.mockResolvedValue({});
  await postModel.deletePost(1);
  expect(mockRun).toHaveBeenCalledWith('DELETE FROM posts WHERE id = ?', 1);
});

test('getPostById: slug 自动修复', async () => {
  mockGet.mockResolvedValue({ id: 1, slug: '', title: 't', content: 'c' });
  mockTag.listTagsForPost.mockResolvedValue([]);
  mockRun.mockResolvedValue({});
  const post = await postModel.getPostById(1);
  expect(post.slug).toBeDefined();
});

test('getPostById: 空数据', async () => {
  mockGet.mockResolvedValue(null);
  const post = await postModel.getPostById(0);
  expect(post).toBeNull();
});

// utils/slugify.js
const { toSlug } = require('../src/utils/slugify');
test('toSlug: 空字符串', () => {
  expect(toSlug('')).toBe('');
});
test('toSlug: 空白字符串', () => {
  expect(toSlug('   ')).toBe('');
});
test('toSlug: 正常 slug', () => {
  expect(toSlug('Hello World!')).toMatch(/hello-world/);
});
test('toSlug: slugify 失败 fallback', () => {
  // 模拟 slugify 返回空
  const origin = require('slugify');
  jest.mock('slugify', () => () => '');
  const { toSlug: toSlug2 } = require('../src/utils/slugify');
  expect(toSlug2('abc def')).toBe('abc-def');
  jest.unmock('slugify');
});

test('toSlug: slugify 返回空 fallback', () => {
  jest.resetModules();
  jest.doMock('slugify', () => () => '');
  const { toSlug } = require('../src/utils/slugify');
  expect(toSlug('abc def')).toBe('abc-def');
  jest.dontMock('slugify');
});

// utils/text.js
const { stripMarkdown, excerpt } = require('../src/utils/text');
test('stripMarkdown: 空字符串', () => {
  expect(stripMarkdown('')).toBe('');
});
test('stripMarkdown: 纯文本', () => {
  expect(stripMarkdown('hello')).toBe('hello');
});
test('stripMarkdown: markdown', () => {
  expect(stripMarkdown('# 标题 *粗体* [链接](url)')).not.toMatch(/[#*\[\]()]/);
});
test('excerpt: 小于 maxLength', () => {
  expect(excerpt('abc', 10)).toBe('abc');
});
test('excerpt: 超过 maxLength', () => {
  expect(excerpt('a'.repeat(200), 10)).toBe('aaaaaaaaaa...');
});
test('listPostsByCategory: slug 自动修复', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: '', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  mockRun.mockResolvedValue({});
  const posts = await postModel.listPostsByCategory(1);
  expect(posts[0].slug).toBeDefined();
});

test('listPostsByCategory: 空数据', async () => {
  mockAll.mockResolvedValue([]);
  const posts = await postModel.listPostsByCategory(1);
  expect(posts).toEqual([]);
});

test('listPostsByTag: slug 自动修复', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: '', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  mockRun.mockResolvedValue({});
  const posts = await postModel.listPostsByTag(1);
  expect(posts[0].slug).toBeDefined();
});

test('listPostsByTag: 空数据', async () => {
  mockAll.mockResolvedValue([]);
  const posts = await postModel.listPostsByTag(1);
  expect(posts).toEqual([]);
});

test('listPostsByMonth: slug 自动修复', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: '', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  mockRun.mockResolvedValue({});
  const posts = await postModel.listPostsByMonth('2026-04');
  expect(posts[0].slug).toBeDefined();
});

test('listPostsByMonth: 空数据', async () => {
  mockAll.mockResolvedValue([]);
  const posts = await postModel.listPostsByMonth('2026-04');
  expect(posts).toEqual([]);
});

test('listPostsByDay: slug 自动修复', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: '', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  mockRun.mockResolvedValue({});
  const posts = await postModel.listPostsByDay('2026-04-30');
  expect(posts[0].slug).toBeDefined();
});

test('listPostsByDay: 空数据', async () => {
  mockAll.mockResolvedValue([]);
  const posts = await postModel.listPostsByDay('2026-04-30');
  expect(posts).toEqual([]);
});

test('searchPosts: slug 自动修复', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: '', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  mockRun.mockResolvedValue({});
  const posts = await postModel.searchPosts('test');
  expect(posts[0].slug).toBeDefined();
});

test('searchPosts: 空数据', async () => {
  mockAll.mockResolvedValue([]);
  const posts = await postModel.searchPosts('test');
  expect(posts).toEqual([]);
});
test('listArchives: 正常返回', async () => {
  mockAll.mockResolvedValue([{ month: '2026-04', count: 1 }]);
  const result = await postModel.listArchives();
  expect(result).toEqual([{ month: '2026-04', count: 1 }]);
});

test('listArchivesByDay: 正常返回', async () => {
  mockAll.mockResolvedValue([{ day: '2026-04-30', count: 1 }]);
  const result = await postModel.listArchivesByDay();
  expect(result).toEqual([{ day: '2026-04-30', count: 1 }]);
});

test('listAllPosts: 正常返回', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: 's', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  const posts = await postModel.listAllPosts();
  expect(posts.length).toBe(1);
});

test('searchAllPosts: 空关键词', async () => {
  const posts = await postModel.searchAllPosts('');
  expect(posts).toEqual([]);
});

test('searchAllPosts: 正常搜索', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: 's', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  const posts = await postModel.searchAllPosts('test');
  expect(posts.length).toBe(1);
});

test('incrementReadCount: 正常', async () => {
  mockRun.mockResolvedValue({});
  await postModel.incrementReadCount(1);
  expect(mockRun).toHaveBeenCalledWith(
    'UPDATE posts SET read_count = read_count + 1 WHERE id = ?',
    1,
  );
});

test('incrementLikeCount: 正常', async () => {
  mockRun.mockResolvedValue({});
  await postModel.incrementLikeCount(1);
  expect(mockRun).toHaveBeenCalledWith(
    'UPDATE posts SET like_count = like_count + 1 WHERE id = ?',
    1,
  );
});

test('incrementFavoriteCount: 正常', async () => {
  mockRun.mockResolvedValue({});
  await postModel.incrementFavoriteCount(1);
  expect(mockRun).toHaveBeenCalledWith(
    'UPDATE posts SET favorite_count = favorite_count + 1 WHERE id = ?',
    1,
  );
});
test('getPostBySlug: 正常获取', async () => {
  mockGet.mockResolvedValueOnce({
    id: 1,
    slug: 'slug',
    title: 't',
    content: 'c',
  });
  mockTag.listTagsForPost.mockResolvedValue([{ name: 'tag1' }]);
  const post = await postModel.getPostBySlug('slug');
  expect(post).toBeTruthy();
  expect(post.slug).toBe('slug');
  expect(post.tags).toEqual([{ name: 'tag1' }]);
});

test('getPostBySlug: slug 编码/解码 fallback', async () => {
  // 1. 原始 slug 查不到
  mockGet.mockResolvedValueOnce(null);
  // 2. encodeURIComponent fallback
  mockGet.mockResolvedValueOnce({
    id: 2,
    slug: '%E4%B8%AD%E6%96%87',
    title: '中文',
    content: 'c',
  });
  mockTag.listTagsForPost.mockResolvedValue([{ name: 'tag2' }]);
  let post = await postModel.getPostBySlug('中文');
  expect(post).toBeTruthy();
  expect(post.slug).toMatch('%');
  // 3. decodeURIComponent fallback
  mockGet.mockResolvedValueOnce(null);
  mockGet.mockResolvedValueOnce({
    id: 3,
    slug: '中文',
    title: '中文',
    content: 'c',
  });
  mockTag.listTagsForPost.mockResolvedValue([{ name: 'tag3' }]);
  post = await postModel.getPostBySlug('%E4%B8%AD%E6%96%87');
  expect(post).toBeTruthy();
  expect(post.slug).toBe('中文');
});

test('getPostBySlug: decodeURIComponent 异常', async () => {
  // 触发 decodeURIComponent 抛错
  mockGet.mockResolvedValue(null);
  const badSlug = '%E4%B8%AD%E6%96%'; // 非法编码
  const post = await postModel.getPostBySlug(badSlug);
  expect(post).toBeNull();
});

test('getPostBySlug: 查无此 slug', async () => {
  mockGet.mockResolvedValue(null);
  const post = await postModel.getPostBySlug('notfound');
  expect(post).toBeNull();
});

test('listPosts: 正常返回', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: 's', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  const posts = await postModel.listPosts();
  expect(posts.length).toBe(1);
});

test('listPostsByCategory: 正常返回', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: 's', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  const posts = await postModel.listPostsByCategory(1);
  expect(posts.length).toBe(1);
});

test('listPostsByTag: 正常返回', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: 's', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  const posts = await postModel.listPostsByTag(1);
  expect(posts.length).toBe(1);
});

test('listPostsByMonth: 正常返回', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: 's', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  const posts = await postModel.listPostsByMonth('2026-04');
  expect(posts.length).toBe(1);
});

test('listPostsByDay: 正常返回', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: 's', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  const posts = await postModel.listPostsByDay('2026-04-30');
  expect(posts.length).toBe(1);
});

test('searchPosts: 空关键词', async () => {
  const posts = await postModel.searchPosts('');
  expect(posts).toEqual([]);
});

test('searchPosts: 正常搜索', async () => {
  mockAll.mockResolvedValue([{ id: 1, slug: 's', title: 't', content: 'c' }]);
  mockTag.listTagsForPost.mockResolvedValue([]);
  const posts = await postModel.searchPosts('test');
  expect(posts.length).toBe(1);
});

test('syncTags: tags 为空', async () => {
  mockRun.mockResolvedValue({});
  await postModel.syncTags(1, []);
  expect(mockRun).toHaveBeenCalled();
});

test('syncTags: 正常同步', async () => {
  mockRun.mockResolvedValue({});
  mockTag.getOrCreateTag.mockResolvedValue({ id: 2 });
  await postModel.syncTags(1, ['a', 'b']);
  expect(mockTag.getOrCreateTag).toHaveBeenCalled();
});
const mockRun = jest.fn();
const mockGet = jest.fn();
const mockAll = jest.fn();
const mockCategory = {
  getOrCreateCategory: jest.fn(),
  cleanupUnusedCategories: jest.fn(),
};
const mockTag = {
  listTagsForPost: jest.fn(),
  getOrCreateTag: jest.fn(),
  cleanupUnusedTags: jest.fn(),
};

jest.mock('../src/db', () => ({
  getDb: async () => ({ run: mockRun, get: mockGet, all: mockAll }),
}));
jest.mock('../src/models/categoryModel', () => mockCategory);
jest.mock('../src/models/tagModel', () => mockTag);

const postModel = require('../src/models/postModel');

beforeEach(() => {
  mockRun.mockReset();
  mockGet.mockReset();
  mockAll.mockReset();
  mockCategory.getOrCreateCategory.mockReset();
  mockCategory.cleanupUnusedCategories.mockReset();
  mockTag.listTagsForPost.mockReset();
  mockTag.getOrCreateTag.mockReset();
  mockTag.cleanupUnusedTags.mockReset();
});

test('createPost: 正常创建', async () => {
  mockCategory.getOrCreateCategory.mockResolvedValue({ id: 1 });
  mockRun.mockResolvedValueOnce({ lastID: 42 });
  mockTag.getOrCreateTag.mockResolvedValue({ id: 2 });
  mockRun.mockResolvedValueOnce({}); // syncTags
  const id = await postModel.createPost({
    title: 't',
    content: 'c',
    categoryName: 'cat',
    tags: ['a'],
    status: 'published',
  });
  expect(id).toBe(42);
  expect(mockCategory.getOrCreateCategory).toHaveBeenCalledWith('cat');
  expect(mockRun).toHaveBeenCalled();
});

test('createPost: 空标题', async () => {
  mockCategory.getOrCreateCategory.mockResolvedValue({ id: 1 });
  mockRun.mockResolvedValueOnce({ lastID: 43 });
  mockTag.getOrCreateTag.mockResolvedValue({ id: 2 });
  mockRun.mockResolvedValueOnce({});
  const id = await postModel.createPost({
    title: '',
    content: 'c',
    categoryName: 'cat',
    tags: [],
    status: 'published',
  });
  expect(id).toBe(43);
});

test('createPost: 数据库异常', async () => {
  mockCategory.getOrCreateCategory.mockRejectedValue(new Error('db error'));
  await expect(
    postModel.createPost({
      title: 't',
      content: 'c',
      categoryName: 'cat',
      tags: [],
      status: 'published',
    }),
  ).rejects.toThrow('db error');
});

test('getPostById: 正常获取', async () => {
  mockGet.mockResolvedValue({
    id: 1,
    title: 't',
    slug: 't',
    content: 'c',
    category_id: 1,
  });
  mockTag.listTagsForPost.mockResolvedValue([{ name: 'tag1' }]);
  const post = await postModel.getPostById(1);
  expect(post).toBeTruthy();
  expect(post.tags).toEqual([{ name: 'tag1' }]);
});

test('getPostById: 无效ID', async () => {
  mockGet.mockResolvedValue(null);
  const post = await postModel.getPostById(999);
  expect(post).toBeNull();
});

test('updatePost: 正常更新', async () => {
  mockCategory.getOrCreateCategory.mockResolvedValue({ id: 1 });
  mockGet.mockResolvedValue({ status: 'published' });
  mockRun.mockResolvedValue({});
  mockTag.getOrCreateTag.mockResolvedValue({ id: 2 });
  mockRun.mockResolvedValue({});
  await postModel.updatePost(1, {
    title: 't',
    content: 'c',
    categoryName: 'cat',
    tags: ['a'],
    status: 'published',
  });
  expect(mockCategory.getOrCreateCategory).toHaveBeenCalled();
  expect(mockRun).toHaveBeenCalled();
});

test('updatePost: 数据库异常', async () => {
  mockCategory.getOrCreateCategory.mockRejectedValue(new Error('db error'));
  mockGet.mockResolvedValue({ status: 'published' });
  await expect(
    postModel.updatePost(1, {
      title: 't',
      content: 'c',
      categoryName: 'cat',
      tags: [],
      status: 'published',
    }),
  ).rejects.toThrow('db error');
});
