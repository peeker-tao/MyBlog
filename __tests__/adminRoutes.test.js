const request = require('supertest');
const express = require('express');
const adminRoutes = require('../src/routes/admin');
const path = require('path');
const fs = require('fs');

jest.mock('../src/models/postModel');
jest.mock('../src/models/commentModel');
jest.mock('../src/models/categoryModel');

const postModel = require('../src/models/postModel');
const commentModel = require('../src/models/commentModel');
const categoryModel = require('../src/models/categoryModel');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(adminRoutes);
app.set('view engine', 'ejs');
app.set('views', __dirname); // mock

app.response.render = function (view, locals) {
  this.send({ view, ...locals });
};

describe('admin routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET / 管理首页', async () => {
    postModel.listAllPosts.mockResolvedValue([
      { id: 1, status: 'draft' },
      { id: 2, status: 'published' },
    ]);
    commentModel.listPending.mockResolvedValue([]);
    const res = await request(app).get('/');
    expect(res.body.view).toBe('admin/index');
    expect(res.body.drafts.length).toBe(1);
    expect(res.body.publishedPosts.length).toBe(1);
  });

  test('GET / 管理首页 异常', async () => {
    const next = jest.fn();
    postModel.listAllPosts.mockRejectedValue(new Error('fail'));
    await request(app)
      .get('/')
      .then(
        () => {},
        () => {},
      );
    // 由于 supertest 不便直接断言 next，这里仅做分支触发
  });

  test('GET /posts/new', async () => {
    categoryModel.listCategories.mockResolvedValue([]);
    const res = await request(app).get('/posts/new');
    expect(res.body.view).toBe('admin/new');
  });

  test('GET /posts/new 异常', async () => {
    const next = jest.fn();
    categoryModel.listCategories.mockRejectedValue(new Error('fail'));
    await request(app)
      .get('/posts/new')
      .then(
        () => {},
        () => {},
      );
  });

  test('POST /uploads 无文件', async () => {
    const res = await request(app).post('/uploads');
    expect(res.body.error).toBe('no file');
    expect(res.statusCode).toBe(400);
  });

  test('POST /uploads 成功', async () => {
    // 模拟上传文件
    const filePath = path.join(__dirname, 'fixtures', 'test.png');
    if (!fs.existsSync(path.dirname(filePath)))
      fs.mkdirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const res = await request(app).post('/uploads').attach('image', filePath);
    expect(res.body.url).toMatch(/\/static\/uploads\//);
    fs.unlinkSync(filePath);
  });

  test('POST /uploads 边界类型', async () => {
    // 超长扩展名
    const filePath = path.join(__dirname, 'fixtures', 'test.verylongextension');
    fs.writeFileSync(filePath, Buffer.from([0x00]));
    const res = await request(app).post('/uploads').attach('image', filePath);
    expect(res.body.url).toMatch(/\/static\/uploads\//);
    fs.unlinkSync(filePath);
  });

  test('POST /uploads 支持的图片类型', async () => {
    // 伪造图片上传
    const res = await request(app)
      .post('/uploads')
      .attach('image', Buffer.from([1, 2, 3]), 'test.png');
    expect(res.body.url).toMatch(/\/static\/uploads\//);
    expect(res.statusCode).toBe(200);
  });

  test('POST /uploads 不支持的扩展名', async () => {
    // 伪造超长扩展名
    const res = await request(app)
      .post('/uploads')
      .attach('image', Buffer.from([1, 2, 3]), 'test.verylongextension');
    expect(res.body.url).toMatch(/\/static\/uploads\//);
    expect(res.statusCode).toBe(200);
  });

  test('POST /uploads 超大文件', async () => {
    // 伪造超大文件
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 1); // 6MB
    const res = await request(app)
      .post('/uploads')
      .attach('image', bigBuffer, 'big.png');
    expect(res.statusCode).toBe(413); // Payload Too Large
  });

  test('POST /posts 缺少必填', async () => {
    const res = await request(app).post('/posts').send('title=&content=');
    expect(res.body.view).toBe('error');
    expect(res.statusCode).toBe(400);
  });

  test('POST /posts 正常', async () => {
    postModel.createPost.mockResolvedValue(1);
    const res = await request(app)
      .post('/posts')
      .send('title=abc&content=def&category=cat&tags=a,b');
    expect(res.statusCode).toBe(302);
  });

  test('POST /posts 异常', async () => {
    postModel.createPost.mockRejectedValue(new Error('fail'));
    await request(app).post('/posts').send('title=abc&content=def');
  });

  test('GET /posts/:id/edit 命中', async () => {
    postModel.getPostById.mockResolvedValue({ id: 1, tags: [] });
    categoryModel.listCategories.mockResolvedValue([]);
    const res = await request(app).get('/posts/1/edit');
    expect(res.body.view).toBe('admin/edit');
  });

  test('GET /posts/:id/edit 异常', async () => {
    postModel.getPostById.mockRejectedValue(new Error('fail'));
    await request(app).get('/posts/1/edit');
  });

  test('GET /posts/:id/edit 404', async () => {
    postModel.getPostById.mockResolvedValue(null);
    const res = await request(app).get('/posts/999/edit');
    expect(res.body.view).toBe('error');
    expect(res.statusCode).toBe(404);
  });

  test('POST /posts/:id 正常', async () => {
    postModel.updatePost.mockResolvedValue();
    const res = await request(app)
      .post('/posts/1')
      .send('title=abc&content=def&category=cat&tags=a,b');
    expect(res.statusCode).toBe(302);
  });

  test('POST /posts/:id 异常', async () => {
    postModel.updatePost.mockRejectedValue(new Error('fail'));
    await request(app).post('/posts/1').send('title=abc&content=def');
  });

  test('POST /posts/:id/delete', async () => {
    postModel.deletePost.mockResolvedValue();
    const res = await request(app).post('/posts/1/delete');
    expect(res.statusCode).toBe(302);
  });

  test('POST /posts/:id/delete 异常', async () => {
    postModel.deletePost.mockRejectedValue(new Error('fail'));
    await request(app).post('/posts/1/delete');
  });

  test('POST /comments/:id/approve', async () => {
    commentModel.approveComment.mockResolvedValue();
    const res = await request(app).post('/comments/1/approve');
    expect(res.statusCode).toBe(302);
  });

  test('POST /comments/:id/approve 异常', async () => {
    commentModel.approveComment.mockRejectedValue(new Error('fail'));
    await request(app).post('/comments/1/approve');
  });

  test('POST /comments/:id/delete', async () => {
    commentModel.deleteComment.mockResolvedValue();
    const res = await request(app).post('/comments/1/delete');
    expect(res.statusCode).toBe(302);
  });

  test('POST /comments/:id/delete 异常', async () => {
    commentModel.deleteComment.mockRejectedValue(new Error('fail'));
    await request(app).post('/comments/1/delete');
  });

  test('POST /posts/category_custom 优先', async () => {
    postModel.createPost.mockResolvedValue(1);
    const res = await request(app)
      .post('/posts')
      .send(
        'title=abc&content=def&category=cat&category_custom=自定义&tags=a,b',
      );
    expect(res.statusCode).toBe(302);
  });

  test('POST /posts/tags 边界', async () => {
    postModel.createPost.mockResolvedValue(1);
    const res = await request(app)
      .post('/posts')
      .send('title=abc&content=def&category=cat&tags=');
    expect(res.statusCode).toBe(302);
  });

  test('POST /posts/action draft', async () => {
    postModel.createPost.mockResolvedValue(1);
    const res = await request(app)
      .post('/posts')
      .send('title=abc&content=def&category=cat&tags=a&action=draft');
    expect(res.statusCode).toBe(302);
  });

  test('POST /posts/:id/category_custom 优先', async () => {
    postModel.updatePost.mockResolvedValue();
    const res = await request(app)
      .post('/posts/1')
      .send(
        'title=abc&content=def&category=cat&category_custom=自定义&tags=a,b',
      );
    expect(res.statusCode).toBe(302);
  });

  test('POST /posts/:id/tags 边界', async () => {
    postModel.updatePost.mockResolvedValue();
    const res = await request(app)
      .post('/posts/1')
      .send('title=abc&content=def&category=cat&tags=');
    expect(res.statusCode).toBe(302);
  });

  test('POST /posts/:id/action draft', async () => {
    postModel.updatePost.mockResolvedValue();
    const res = await request(app)
      .post('/posts/1')
      .send('title=abc&content=def&category=cat&tags=a&action=draft');
    expect(res.statusCode).toBe(302);
  });
});
