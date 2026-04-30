const mockRun = jest.fn();
const mockAll = jest.fn();

// mock the db module before importing the model
jest.mock('../src/db', () => ({
  getDb: async () => ({
    run: mockRun,
    all: mockAll,
  }),
}));

const commentModel = require('../src/models/commentModel');

beforeEach(() => {
  mockRun.mockReset();
  mockAll.mockReset();
});

test('addComment inserts comment and returns lastID', async () => {
  mockRun.mockResolvedValue({ lastID: 123 });
  const id = await commentModel.addComment({
    postId: 5,
    author: '张三',
    email: 'a@b.com',
    content: '内容',
  });
  expect(mockRun).toHaveBeenCalled();
  expect(mockRun.mock.calls[0][0]).toMatch(/INSERT INTO comments/);
  expect(mockRun.mock.calls[0][1]).toBe(5);
  expect(id).toBe(123);
});

test('addComment inserts comment with null email', async () => {
  mockRun.mockResolvedValue({ lastID: 456 });
  const id = await commentModel.addComment({
    postId: 6,
    author: '李四',
    content: '无邮箱',
  });
  expect(mockRun).toHaveBeenCalled();
  // email 应为 null
  expect(mockRun.mock.calls[0][3]).toBeNull();
  expect(id).toBe(456);
});

test('listApprovedByPost calls db.all with correct SQL', async () => {
  mockAll.mockResolvedValue([{ id: 1, post_id: 5 }]);
  const rows = await commentModel.listApprovedByPost(5);
  expect(mockAll).toHaveBeenCalled();
  expect(mockAll.mock.calls[0][0]).toMatch(/SELECT \*/);
  expect(mockAll.mock.calls[0][1]).toBe(5);
  expect(rows).toEqual([{ id: 1, post_id: 5 }]);
});

test('listPending returns pending comments joined with posts', async () => {
  mockAll.mockResolvedValue([{ id: 2, post_title: '测试' }]);
  const rows = await commentModel.listPending();
  expect(mockAll).toHaveBeenCalled();
  // SQL may select c.*; just assert the presence of the joined title alias
  expect(mockAll.mock.calls[0][0]).toMatch(/p.title AS post_title/);
  expect(rows).toEqual([{ id: 2, post_title: '测试' }]);
});

test('approveComment updates status', async () => {
  mockRun.mockResolvedValue({ changes: 1 });
  await commentModel.approveComment(77);
  expect(mockRun).toHaveBeenCalled();
  expect(mockRun.mock.calls[0][0]).toMatch(
    /UPDATE comments SET status = 'approved'/,
  );
  expect(mockRun.mock.calls[0][1]).toBe(77);
});

test('deleteComment deletes comment by id', async () => {
  mockRun.mockResolvedValue({ changes: 1 });
  await commentModel.deleteComment(88);
  expect(mockRun).toHaveBeenCalled();
  expect(mockRun.mock.calls[0][0]).toMatch(/DELETE FROM comments/);
  expect(mockRun.mock.calls[0][1]).toBe(88);
});
