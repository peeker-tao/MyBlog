const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const postModel = require('../models/postModel');
const commentModel = require('../models/commentModel');
const categoryModel = require('../models/categoryModel');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const name = `img-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/', async (req, res, next) => {
  try {
    const query = (req.query.q || '').trim();
    const postsPromise = query
      ? postModel.searchAllPosts(query)
      : postModel.listAllPosts();
    const [posts, pendingComments] = await Promise.all([
      postsPromise,
      commentModel.listPending(),
    ]);
    const drafts = posts.filter((post) => post.status === 'draft');
    const publishedPosts = posts.filter((post) => post.status !== 'draft');
    res.render('admin/index', {
      title: '管理',
      drafts,
      publishedPosts,
      pendingComments,
      query,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/posts/new', async (req, res, next) => {
  try {
    const categories = await categoryModel.listCategories();
    res.render('admin/new', { title: '新建文章', categories });
  } catch (err) {
    next(err);
  }
});

// 上传图片，支持超大文件 413 错误处理
router.post('/uploads', (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件过大' });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'no file' });
    }
    const url = `/static/uploads/${req.file.filename}`;
    return res.json({ url });
  });
});

router.post('/posts', async (req, res, next) => {
  try {
    const { title, content, category, category_custom, tags, action } =
      req.body;
    if (!title || !content) {
      return res.status(400).render('error', {
        title: '缺少必填项',
        message: '标题和内容为必填。',
      });
    }
    const tagsArray = tags ? tags.split(',') : [];
    const status = action === 'draft' ? 'draft' : 'published';
    const categoryName =
      category_custom && category_custom.trim()
        ? category_custom.trim()
        : category;
    await postModel.createPost({
      title,
      content,
      categoryName,
      tags: tagsArray,
      status,
    });
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.get('/posts/:id/edit', async (req, res, next) => {
  try {
    const post = await postModel.getPostById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .render('error', { title: '未找到', message: '文章未找到。' });
    }
    const tagList = post.tags.map((tag) => tag.name).join(', ');
    const categories = await categoryModel.listCategories();
    res.render('admin/edit', { title: '编辑文章', post, tagList, categories });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:id', async (req, res, next) => {
  try {
    const { title, content, category, category_custom, tags, action } =
      req.body;
    if (!title || !content) {
      return res.status(400).render('error', {
        title: '缺少必填项',
        message: '标题和内容为必填。',
      });
    }
    const tagsArray = tags ? tags.split(',') : [];
    const status = action === 'draft' ? 'draft' : 'published';
    const categoryName =
      category_custom && category_custom.trim()
        ? category_custom.trim()
        : category;
    await postModel.updatePost(req.params.id, {
      title,
      content,
      categoryName,
      tags: tagsArray,
      status,
    });
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:id/delete', async (req, res, next) => {
  try {
    await postModel.deletePost(req.params.id);
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/comments/:id/approve', async (req, res, next) => {
  try {
    await commentModel.approveComment(req.params.id);
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/comments/:id/delete', async (req, res, next) => {
  try {
    await commentModel.deleteComment(req.params.id);
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
