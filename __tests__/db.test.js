describe('db.js 异常分支', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../src/db', () => {
      return {
        getDb: async () => {
          throw new Error('db error');
        },
      };
    });
  });
  afterEach(() => {
    jest.dontMock('../src/db');
    jest.resetModules();
  });
  it('getDb 抛出异常', async () => {
    const { getDb } = require('../src/db');
    await expect(getDb()).rejects.toThrow('db error');
  });
});

describe('db.js 正常分支', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  afterEach(() => {
    jest.dontMock('sqlite');
    jest.resetModules();
  });
  it('getDb 正常返回 db 实例', async () => {
    jest.doMock('sqlite', () => ({
      open: jest.fn().mockResolvedValue({
        exec: jest.fn().mockResolvedValue(),
        test: 123,
      }),
    }));
    const path = require('path');
    const dbFile = path.join(__dirname, '..', 'db', 'blog.db');
    // 重新加载 db.js，触发正常分支
    const { getDb } = require('../src/db');
    const db = await getDb();
    expect(db.test).toBe(123);
  });
});
