const categoryModel = require('../models/categoryModel');
const tagModel = require('../models/tagModel');
const postModel = require('../models/postModel');

async function loadCommon(req, res, next) {
  try {
    const [categories, tags, posts] = await Promise.all([
      categoryModel.listCategories(),
      tagModel.listTagsWithCount(),
      postModel.listPosts(),
    ]);
    res.locals.categories = categories;
    res.locals.tags = tags;
    // 最近文章（只取前 6 条）
    res.locals.recentPosts = (posts || []).slice(0, 6);
    res.locals.currentPath = req.path;
    res.locals.year = new Date().getFullYear();
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = loadCommon;
