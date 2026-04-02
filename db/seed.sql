INSERT INTO categories (name, slug) VALUES ('随笔', 'general');
INSERT INTO tags (name, slug) VALUES ('入门', 'intro');
INSERT INTO tags (name, slug) VALUES ('Node.js', 'nodejs');

INSERT INTO posts (title, slug, content, category_id)
VALUES (
  '欢迎来到我的博客',
  'welcome-to-my-blog',
  '这是你的第一篇文章，可以在后台**编辑或删除**它。\n\n- 清爽布局\n- 支持 Markdown\n- SQLite 存储',
  (SELECT id FROM categories WHERE slug = 'general')
);

INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id FROM posts p, tags t
WHERE p.slug = 'welcome-to-my-blog' AND t.slug IN ('intro', 'nodejs');

INSERT INTO comments (post_id, author, email, content, status)
VALUES (
  (SELECT id FROM posts WHERE slug = '欢迎来到我的博客'),
  '读者',
  'reader@example.com',
  '期待更多文章！',
  'approved'
);
