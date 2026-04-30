const request = require('supertest');
const express = require('express');
const publicRoutes = require('../src/routes/public');

jest.mock('../src/models/postModel');
jest.mock('../src/models/commentModel');
jest.mock('../src/models/categoryModel');
jest.mock('../src/models/tagModel');

const postModel = require('../src/models/postModel');
const commentModel = require('../src/models/commentModel');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(publicRoutes);
app.set('view engine', 'ejs');
app.set('views', __dirname); // mock

app.response.render = function (view, locals) {
  this.send({ view, ...locals });
};

describe('public routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET / 首页', async () => {
    postModel.listPosts.mockResolvedValue([
      { id: 1, title: 't', slug: 's', content: 'c' },
    ]);
    const res = await request(app).get('/');
    expect(res.body.view).toBe('index');
    expect(res.body.posts.length).toBe(1);
  });

  test('GET /post/:slug 命中', async () => {
    postModel.getPostBySlug.mockResolvedValue({
      id: 1,
      title: 't',
      slug: 's',
      content: 'c',
    });
    postModel.incrementReadCount.mockResolvedValue();
    commentModel.listApprovedByPost.mockResolvedValue([]);
    const res = await request(app).get('/post/s');
    expect(res.body.view).toBe('post');
    expect(res.body.post).toBeTruthy();
  });

  test('GET /post/:slug 404', async () => {
    postModel.getPostBySlug.mockResolvedValue(null);
    const res = await request(app).get('/post/notfound');
    expect(res.body.view).toBe('error');
    expect(res.statusCode).toBe(404);
  });

  test('POST /post/:slug/comments 成功', async () => {
    postModel.getPostBySlug.mockResolvedValue({ id: 1, slug: 's' });
    commentModel.addComment.mockResolvedValue();
    const res = await request(app)
      .post('/post/s/comments')
      .send('author=a&content=hi');
    expect(res.statusCode).toBe(302);
  });

  test('POST /post/:slug/comments 缺少 author/content', async () => {
    postModel.getPostBySlug.mockResolvedValue({ id: 1, slug: 's' });
    const res = await request(app)
      .post('/post/s/comments')
      .send('author=&content=');
    expect(res.body.view).toBe('error');
    expect(res.statusCode).toBe(400);
  });

  test('POST /post/:slug/comments 404', async () => {
    postModel.getPostBySlug.mockResolvedValue(null);
    const res = await request(app)
      .post('/post/notfound/comments')
      .send('author=a&content=hi');
    expect(res.body.view).toBe('error');
    expect(res.statusCode).toBe(404);
  });

  test('GET /archive', async () => {
    postModel.listPostsByDay.mockResolvedValue([]);
    const res = await request(app).get('/archive?day=2026-04-30');
    expect(res.body.view).toBe('archive');
  });

  test('GET /archive 异常', async () => {
    postModel.listPostsByDay.mockRejectedValue(new Error('fail'));
    await request(app).get('/archive?day=2026-04-30');
  });

  test('GET /archive 月归档参数', async () => {
    postModel.listArchives.mockResolvedValue([{ month: '2026-04', count: 1 }]);
    postModel.listArchivesByDay.mockResolvedValue([
      { day: '2026-04-30', count: 1 },
    ]);
    const res = await request(app).get('/archive?month=2026-04');
    expect(res.body.view).toBe('archive');
  });

  test('GET /archive 空参数', async () => {
    postModel.listArchives.mockResolvedValue([]);
    postModel.listArchivesByDay.mockResolvedValue([]);
    const res = await request(app).get('/archive');
    expect(res.body.view).toBe('archive');
  });

  test('GET /category/:slug 命中', async () => {
    const categoryModel = require('../src/models/categoryModel');
    categoryModel.getCategoryBySlug.mockResolvedValue({ id: 1, name: 'cat' });
    postModel.listPostsByCategory.mockResolvedValue([]);
    const res = await request(app).get('/category/cat');
    expect(res.body.view).toBe('category');
  });

  test('GET /category/:slug 404', async () => {
    const categoryModel = require('../src/models/categoryModel');
    categoryModel.getCategoryBySlug.mockResolvedValue(null);
    const res = await request(app).get('/category/notfound');
    expect(res.body.view).toBe('error');
    expect(res.statusCode).toBe(404);
  });

  test('GET /category/:slug 特殊字符', async () => {
    const categoryModel = require('../src/models/categoryModel');
    categoryModel.getCategoryBySlug.mockResolvedValue({ id: 1, name: '特殊' });
    postModel.listPostsByCategory.mockResolvedValue([]);
    const res = await request(app).get('/category/%E7%89%B9%E6%AE%8A');
    expect(res.body.view).toBe('category');
  });

  test('GET /category/:slug 异常', async () => {
    const categoryModel = require('../src/models/categoryModel');
    categoryModel.getCategoryBySlug.mockRejectedValue(new Error('fail'));
    await request(app).get('/category/cat');
  });

  test('GET /tag/:slug 命中', async () => {
    const tagModel = require('../src/models/tagModel');
    tagModel.getTagBySlug.mockResolvedValue({ id: 1, name: 'tag' });
    postModel.listPostsByTag.mockResolvedValue([]);
    const res = await request(app).get('/tag/tag');
    expect(res.body.view).toBe('tag');
  });

  test('GET /tag/:slug 404', async () => {
    const tagModel = require('../src/models/tagModel');
    tagModel.getTagBySlug.mockResolvedValue(null);
    const res = await request(app).get('/tag/notfound');
    expect(res.body.view).toBe('error');
    expect(res.statusCode).toBe(404);
  });

  test('GET /tag/:slug 特殊字符', async () => {
    const tagModel = require('../src/models/tagModel');
    tagModel.getTagBySlug.mockResolvedValue({ id: 1, name: '特殊' });
    postModel.listPostsByTag.mockResolvedValue([]);
    const res = await request(app).get('/tag/%E7%89%B9%E6%AE%8A');
    expect(res.body.view).toBe('tag');
  });

  test('GET /tag/:slug 异常', async () => {
    const tagModel = require('../src/models/tagModel');
    tagModel.getTagBySlug.mockRejectedValue(new Error('fail'));
    await request(app).get('/tag/tag');
  });

  test('GET /search', async () => {
    postModel.searchPosts.mockResolvedValue([]);
    const res = await request(app).get('/search?q=abc');
    expect(res.body.view).toBe('search');
  });

  test('GET /search 空参数', async () => {
    const res = await request(app).get('/search');
    expect(res.body.view).toBe('search');
  });

  test('GET /search 异常', async () => {
    postModel.searchPosts.mockRejectedValue(new Error('fail'));
    await request(app).get('/search?q=abc');
  });

  test('GET /about', async () => {
    const res = await request(app).get('/about');
    expect(res.body.view).toBe('about');
  });

  test('POST /post/:slug/like', async () => {
    postModel.getPostBySlug.mockResolvedValue({ id: 1, slug: 's' });
    postModel.incrementLikeCount.mockResolvedValue();
    const res = await request(app).post('/post/s/like');
    expect(res.statusCode).toBe(302);
  });

  test('POST /post/:slug/like 404', async () => {
    postModel.getPostBySlug.mockResolvedValue(null);
    const res = await request(app).post('/post/notfound/like');
    expect(res.body.view).toBe('error');
    expect(res.statusCode).toBe(404);
  });

  test('POST /post/:slug/like 异常', async () => {
    postModel.getPostBySlug.mockRejectedValue(new Error('fail'));
    await request(app).post('/post/s/like');
  });

  test('POST /post/:slug/favorite', async () => {
    postModel.getPostBySlug.mockResolvedValue({ id: 1, slug: 's' });
    postModel.incrementFavoriteCount.mockResolvedValue();
    const res = await request(app).post('/post/s/favorite');
    expect(res.statusCode).toBe(302);
  });

  test('POST /post/:slug/favorite 404', async () => {
    postModel.getPostBySlug.mockResolvedValue(null);
    const res = await request(app).post('/post/notfound/favorite');
    expect(res.body.view).toBe('error');
    expect(res.statusCode).toBe(404);
  });

  test('POST /post/:slug/favorite 异常', async () => {
    postModel.getPostBySlug.mockRejectedValue(new Error('fail'));
    await request(app).post('/post/s/favorite');
  });
});
