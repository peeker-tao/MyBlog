const { getDb } = require('../db');

async function addComment({ postId, author, email, content }) {
  const db = await getDb();
  const result = await db.run(
    "INSERT INTO comments (post_id, author, email, content, status) VALUES (?, ?, ?, ?, 'pending')",
    postId,
    author,
    email || null,
    content,
  );
  return result.lastID;
}

async function listApprovedByPost(postId) {
  const db = await getDb();
  return db.all(
    "SELECT * FROM comments WHERE post_id = ? AND status = 'approved' ORDER BY created_at DESC",
    postId,
  );
}

async function listPending() {
  const db = await getDb();
  return db.all(
    "SELECT c.*, p.title AS post_title FROM comments c INNER JOIN posts p ON p.id = c.post_id WHERE c.status = 'pending' ORDER BY c.created_at DESC",
  );
}

async function approveComment(id) {
  const db = await getDb();
  await db.run("UPDATE comments SET status = 'approved' WHERE id = ?", id);
}

async function deleteComment(id) {
  const db = await getDb();
  await db.run('DELETE FROM comments WHERE id = ?', id);
}

module.exports = {
  addComment,
  listApprovedByPost,
  listPending,
  approveComment,
  deleteComment,
};
