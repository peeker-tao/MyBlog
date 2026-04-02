const express = require('express');
const { marked } = require('marked');
const postModel = require('../models/postModel');
const commentModel = require('../models/commentModel');
const categoryModel = require('../models/categoryModel');
const tagModel = require('../models/tagModel');

const router = express.Router();

marked.setOptions({ breaks: true });

router.get('/', async (req, res, next) => {
  try {
    const posts = await postModel.listPosts();
    res.render('index', { title: '首页', posts });
  } catch (err) {
    next(err);
  }
});

router.get('/post/:slug', async (req, res, next) => {
  try {
    const post = await postModel.getPostBySlug(req.params.slug);
    if (!post) {
      return res
        .status(404)
        .render('error', { title: '未找到', message: '文章未找到。' });
    }
    await postModel.incrementReadCount(post.id);
    post.read_count = (post.read_count || 0) + 1;
    post.html = marked.parse(post.content);
    const comments = await commentModel.listApprovedByPost(post.id);
    const enhancedComments = comments.map((comment) => ({
      ...comment,
      html: marked.parse(comment.content || ''),
    }));
    res.render('post', {
      title: post.title,
      post,
      comments: enhancedComments,
      success: req.query.success,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/post/:slug/comments', async (req, res, next) => {
  try {
    const post = await postModel.getPostBySlug(req.params.slug);
    if (!post) {
      return res
        .status(404)
        .render('error', { title: '未找到', message: '文章未找到。' });
    }
    const { author, email, content } = req.body;
    if (!author || !content) {
      return res.status(400).render('error', {
        title: '缺少必填项',
        message: '姓名和评论内容为必填。',
      });
    }
    await commentModel.addComment({ postId: post.id, author, email, content });
    res.redirect(`/post/${post.slug}?success=1`);
  } catch (err) {
    next(err);
  }
});

router.get('/archive', async (req, res, next) => {
  try {
    const day = req.query.day;
    const month = req.query.month;
    if (day) {
      const posts = await postModel.listPostsByDay(day);
      return res.render('archive', {
        title: '归档',
        day,
        month: null,
        posts,
        archives: [],
        months: [],
        calendar: null,
        minMonth: null,
        maxMonth: null,
        prevMonth: null,
        nextMonth: null,
      });
    }
    const archives = await postModel.listArchives();
    const archiveDays = await postModel.listArchivesByDay();
    const dayCountMap = new Map();
    archiveDays.forEach((item) => {
      dayCountMap.set(item.day, item.count);
    });
    const monthCountMap = new Map();
    archives.forEach((item) => {
      monthCountMap.set(item.month, item.count);
    });

    const buildMonthCalendar = (monthKey) => {
      const parts = monthKey.split('-');
      const year = Number(parts[0]);
      const monthIndex = Number(parts[1]);
      const firstDate = new Date(year, monthIndex - 1, 1);
      const daysInMonth = new Date(year, monthIndex, 0).getDate();
      const firstWeekday = (firstDate.getDay() + 6) % 7; // Monday = 0
      const weeks = [];
      let dayCursor = 1;
      let week = [];

      for (let i = 0; i < firstWeekday; i += 1) {
        week.push({ day: null, count: 0, date: null });
      }

      while (dayCursor <= daysInMonth) {
        const dayString = String(dayCursor).padStart(2, '0');
        const fullDate = `${monthKey}-${dayString}`;
        const count = dayCountMap.get(fullDate) || 0;
        week.push({ day: dayCursor, count, date: fullDate });
        if (week.length === 7) {
          weeks.push(week);
          week = [];
        }
        dayCursor += 1;
      }

      if (week.length) {
        while (week.length < 7) {
          week.push({ day: null, count: 0, date: null });
        }
        weeks.push(week);
      }

      return {
        monthKey,
        year,
        monthIndex,
        weeks,
      };
    };

    const formatMonthKey = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    };

    const toMonthDate = (monthKey) => {
      const parts = monthKey.split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      return new Date(y, m - 1, 1);
    };

    const addMonths = (monthKey, delta) => {
      const base = toMonthDate(monthKey);
      base.setMonth(base.getMonth() + delta);
      return formatMonthKey(base);
    };

    const maxMonth = archives.length ? archives[0].month : null;
    const minMonth = archives.length
      ? archives[archives.length - 1].month
      : null;
    const defaultMonth = maxMonth || formatMonthKey(new Date());
    const activeMonth = month || defaultMonth;
    const safeActiveMonth = minMonth && maxMonth ? activeMonth : null;
    const calendar = safeActiveMonth
      ? buildMonthCalendar(safeActiveMonth)
      : null;
    const prevMonth =
      minMonth && safeActiveMonth && safeActiveMonth > minMonth
        ? addMonths(safeActiveMonth, -1)
        : null;
    const nextMonth =
      maxMonth && safeActiveMonth && safeActiveMonth < maxMonth
        ? addMonths(safeActiveMonth, 1)
        : null;
    const activeMonthCount = safeActiveMonth
      ? monthCountMap.get(safeActiveMonth) || 0
      : 0;

    const monthOptions = [];
    if (minMonth && maxMonth) {
      let cursor = toMonthDate(maxMonth);
      const end = toMonthDate(minMonth);
      while (cursor >= end) {
        const key = formatMonthKey(cursor);
        monthOptions.push({
          monthKey: key,
          count: monthCountMap.get(key) || 0,
        });
        cursor.setMonth(cursor.getMonth() - 1);
      }
    }

    const months = [];
    res.render('archive', {
      title: '归档',
      month: safeActiveMonth,
      day: null,
      posts: [],
      archives,
      months,
      calendar,
      minMonth,
      maxMonth,
      prevMonth,
      nextMonth,
      monthOptions,
      activeMonthCount,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/category/:slug', async (req, res, next) => {
  try {
    const category = await categoryModel.getCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).render('error', {
        title: '未找到',
        message: '分类未找到。',
      });
    }
    const posts = await postModel.listPostsByCategory(category.id);
    res.render('category', { title: category.name, category, posts });
  } catch (err) {
    next(err);
  }
});

router.get('/tag/:slug', async (req, res, next) => {
  try {
    const tag = await tagModel.getTagBySlug(req.params.slug);
    if (!tag) {
      return res
        .status(404)
        .render('error', { title: '未找到', message: '标签未找到。' });
    }
    const posts = await postModel.listPostsByTag(tag.id);
    res.render('tag', { title: `标签：${tag.name}`, tag, posts });
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const posts = query ? await postModel.searchPosts(query) : [];
    res.render('search', { title: '搜索', query, posts });
  } catch (err) {
    next(err);
  }
});

router.get('/about', (req, res) => {
  res.render('about', { title: '关于' });
});

router.post('/post/:slug/like', async (req, res, next) => {
  try {
    const post = await postModel.getPostBySlug(req.params.slug);
    if (!post) {
      return res
        .status(404)
        .render('error', { title: '未找到', message: '文章未找到。' });
    }
    await postModel.incrementLikeCount(post.id);
    res.redirect(`/post/${post.slug}`);
  } catch (err) {
    next(err);
  }
});

router.post('/post/:slug/favorite', async (req, res, next) => {
  try {
    const post = await postModel.getPostBySlug(req.params.slug);
    if (!post) {
      return res
        .status(404)
        .render('error', { title: '未找到', message: '文章未找到。' });
    }
    await postModel.incrementFavoriteCount(post.id);
    res.redirect(`/post/${post.slug}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
