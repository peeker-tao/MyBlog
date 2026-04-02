const categoryModel = require('../models/categoryModel');
const tagModel = require('../models/tagModel');

async function loadCommon(req, res, next) {
  try {
    const [categories, tags] = await Promise.all([
      categoryModel.listCategories(),
      tagModel.listTagsWithCount(),
    ]);
    res.locals.categories = categories;
    res.locals.tags = tags;
    res.locals.currentPath = req.path;
    res.locals.year = new Date().getFullYear();
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = loadCommon;
