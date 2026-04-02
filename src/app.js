const path = require('path');
const express = require('express');
const loadCommon = require('./middleware/loadCommon');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

app.use(loadCommon);

app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: '未找到', message: '页面不存在。' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: '服务器错误',
    message: '出错了，请稍后再试。',
  });
});

app.listen(port, () => {
  console.log(`博客运行在 http://localhost:${port}`);
});
