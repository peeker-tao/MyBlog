const mockRun = jest.fn();
const mockGet = jest.fn();
const mockAll = jest.fn();

jest.mock('../src/db', () => ({
  getDb: async () => ({ run: mockRun, get: mockGet, all: mockAll }),
}));
const tagModel = require('../src/models/tagModel');
const { toSlug } = require('../src/utils/slugify');

describe('tagModel', () => {
  beforeEach(() => {
    mockRun.mockReset();
    mockGet.mockReset();
    mockAll.mockReset();
  });

  test('getOrCreateTag: 空/空白', async () => {
    expect(await tagModel.getOrCreateTag('')).toBeNull();
    expect(await tagModel.getOrCreateTag('   ')).toBeNull();
  });

  test('getOrCreateTag: 已存在 name', async () => {
    mockGet.mockResolvedValueOnce({ id: 1, name: 'tag', slug: 'tag' });
    const tag = await tagModel.getOrCreateTag('tag');
    expect(tag).toEqual({ id: 1, name: 'tag', slug: 'tag' });
  });

  test('getOrCreateTag: 已存在 slug', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce({ id: 2, name: 'tag2', slug: 'tag2' });
    const tag = await tagModel.getOrCreateTag('tag2');
    expect(tag).toEqual({ id: 2, name: 'tag2', slug: 'tag2' });
  });

  test('getOrCreateTag: 新增', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce(null);
    mockRun.mockResolvedValue({});
    mockGet.mockResolvedValueOnce({ id: 3, name: 'tag3', slug: 'tag3' });
    const tag = await tagModel.getOrCreateTag('tag3');
    expect(tag).toEqual({ id: 3, name: 'tag3', slug: 'tag3' });
  });

  test('listTagsWithCount: 正常', async () => {
    mockAll.mockResolvedValue([{ id: 1, name: 'tag', slug: 'tag' }]);
    const tags = await tagModel.listTagsWithCount();
    expect(tags.length).toBe(1);
  });

  test('listTagsWithCount: slug 自动修复', async () => {
    mockAll.mockResolvedValue([{ id: 2, name: 'tag2', slug: '' }]);
    mockRun.mockResolvedValue({});
    const tags = await tagModel.listTagsWithCount();
    expect(tags[0].slug).toBeDefined();
  });

  test('getTagBySlug: 命中原始', async () => {
    mockGet.mockResolvedValueOnce({ id: 1, slug: 'tag' });
    const tag = await tagModel.getTagBySlug('tag');
    expect(tag).toBeTruthy();
  });

  test('getTagBySlug: 命中 encode', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce({ id: 2, slug: '%E4%B8%AD%E6%96%87' });
    const tag = await tagModel.getTagBySlug('中文');
    expect(tag).toBeTruthy();
  });

  test('getTagBySlug: 命中 decode', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce({ id: 3, slug: '中文' });
    const tag = await tagModel.getTagBySlug('%E4%B8%AD%E6%96%87');
    expect(tag).toBeTruthy();
  });

  test('getTagBySlug: decodeURIComponent 异常', async () => {
    const { getTagBySlug } = require('../src/models/tagModel');
    // 触发 decodeURIComponent 抛错
    const badSlug = '%E4%B8%AD%E6%96%'; // 非法编码
    // 不需要 mock db.get，直接调用即可，异常会被 catch
    await expect(getTagBySlug(badSlug)).resolves.toBeUndefined();
  });

  test('getTagBySlug: 查无', async () => {
    mockGet.mockResolvedValue(null);
    const tag = await tagModel.getTagBySlug('notfound');
    expect(tag).toBeNull();
  });

  test('listTagsForPost: 正常', async () => {
    mockAll.mockResolvedValue([{ id: 1, name: 'tag' }]);
    const tags = await tagModel.listTagsForPost(1);
    expect(tags.length).toBe(1);
  });

  test('cleanupUnusedTags: 正常', async () => {
    await tagModel.cleanupUnusedTags();
    expect(mockRun).toHaveBeenCalled();
  });
});
