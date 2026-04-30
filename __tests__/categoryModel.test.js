const mockRun = jest.fn();
const mockGet = jest.fn();
const mockAll = jest.fn();

jest.mock('../src/db', () => ({
  getDb: async () => ({ run: mockRun, get: mockGet, all: mockAll }),
}));
const {
  getOrCreateCategory,
  listCategories,
  getCategoryBySlug,
  cleanupUnusedCategories,
} = require('../src/models/categoryModel');
const { toSlug } = require('../src/utils/slugify');

describe('categoryModel', () => {
  beforeEach(() => {
    mockRun.mockReset();
    mockGet.mockReset();
    mockAll.mockReset();
  });

  test('getOrCreateCategory: 空/空白', async () => {
    expect(await getOrCreateCategory('')).toBeNull();
    expect(await getOrCreateCategory('   ')).toBeNull();
  });

  test('getOrCreateCategory: 已存在 name', async () => {
    mockGet.mockResolvedValueOnce({ id: 1, name: 'cat', slug: 'cat' });
    const cat = await getOrCreateCategory('cat');
    expect(cat).toEqual({ id: 1, name: 'cat', slug: 'cat' });
  });

  test('getOrCreateCategory: 已存在 slug', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce({ id: 2, name: 'cat2', slug: 'cat2' });
    const cat = await getOrCreateCategory('cat2');
    expect(cat).toEqual({ id: 2, name: 'cat2', slug: 'cat2' });
  });

  test('getOrCreateCategory: 新增', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce(null);
    mockRun.mockResolvedValue({});
    mockGet.mockResolvedValueOnce({ id: 3, name: 'cat3', slug: 'cat3' });
    const cat = await getOrCreateCategory('cat3');
    expect(cat).toEqual({ id: 3, name: 'cat3', slug: 'cat3' });
  });

  test('listCategories: 正常', async () => {
    mockAll.mockResolvedValue([{ id: 1, name: 'cat', slug: 'cat' }]);
    const cats = await listCategories();
    expect(cats.length).toBe(1);
  });

  test('listCategories: slug 自动修复', async () => {
    mockAll.mockResolvedValue([{ id: 2, name: 'cat2', slug: '' }]);
    mockRun.mockResolvedValue({});
    const cats = await listCategories();
    expect(cats[0].slug).toBeDefined();
  });

  test('getCategoryBySlug: 命中原始', async () => {
    mockGet.mockResolvedValueOnce({ id: 1, slug: 'cat' });
    const cat = await getCategoryBySlug('cat');
    expect(cat).toBeTruthy();
  });

  test('getCategoryBySlug: 命中 encode', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce({ id: 2, slug: '%E4%B8%AD%E6%96%87' });
    const cat = await getCategoryBySlug('中文');
    expect(cat).toBeTruthy();
  });

  test('getCategoryBySlug: 命中 decode', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce({ id: 3, slug: '中文' });
    const cat = await getCategoryBySlug('%E4%B8%AD%E6%96%87');
    expect(cat).toBeTruthy();
  });

  test('getCategoryBySlug: 查无', async () => {
    mockGet.mockResolvedValue(null);
    const cat = await getCategoryBySlug('notfound');
    expect(cat).toBeNull();
  });

  test('getCategoryBySlug: decodeURIComponent 异常', async () => {
    const { getCategoryBySlug } = require('../src/models/categoryModel');
    // 触发 decodeURIComponent 抛错
    const badSlug = '%E4%B8%AD%E6%96%'; // 非法编码
    // 不需要 mock db.get，直接调用即可，异常会被 catch
    await expect(getCategoryBySlug(badSlug)).resolves.toBeUndefined();
  });

  test('cleanupUnusedCategories: 正常', async () => {
    const { cleanupUnusedCategories } = require('../src/models/categoryModel');
    mockRun.mockResolvedValue({});
    await cleanupUnusedCategories();
    expect(mockRun).toHaveBeenCalled();
  });
});
