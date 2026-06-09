// tests/items.test.js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// 临时 DB
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aihotpoint-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.NODE_ENV = 'test';

const { migrate } = await import('../src/db/migrate.js');
const { bulkInsert, listItems, setAiResult, getKeywords, addKeyword, stats } = await import('../src/db/items.js');
const { closeDb } = await import('../src/db/sqlite.js');

before(() => migrate());
after(() => { try { closeDb(); } catch {}; fs.rmSync(tmpDir, { recursive: true, force: true }); });

test('bulkInsert 插入并去重', () => {
  const items = [
    { source: 'twitter', url: 'https://x.com/1', title: 'AI 大模型发布', content: 'test', author: 'alice', published_at: Date.now() },
    { source: 'twitter', url: 'https://x.com/1', title: 'AI 大模型发布', content: 'test', author: 'alice', published_at: Date.now() },
    { source: 'bing',    url: 'https://cn.bing.com/1', title: '新闻', content: 'test2', published_at: Date.now() },
  ];
  const c1 = bulkInsert(items, []);
  assert.equal(c1, 2); // 去重后 2 条
  const c2 = bulkInsert(items, []);
  assert.equal(c2, 0); // 第二次全重复
});

test('bulkInsert 按索引保存各自的 matched_keywords', () => {
  const items = [
    { source: 'twitter', url: 'https://x.com/2', title: 'AIGC 新进展', published_at: Date.now() },
    { source: 'twitter', url: 'https://x.com/3', title: '某明星结婚', published_at: Date.now() },
  ];
  bulkInsert(items, [['AIGC'], []]);
  const list = listItems({ sources: ['twitter'] });
  const a = list.items.find((it) => it.url === 'https://x.com/2');
  const b = list.items.find((it) => it.url === 'https://x.com/3');
  assert.deepEqual(JSON.parse(a.matched_keywords_json), ['AIGC']);
  assert.deepEqual(JSON.parse(b.matched_keywords_json), []);
});

test('listItems 筛选 + 排序', () => {
  setAiResult(1, { importance: 'high', score: 0.9, summary: 's', category: '科技', keywords: ['AI'] });
  setAiResult(2, { importance: 'low', score: 0.2, summary: 's', category: '其他', keywords: [] });
  const all = listItems({});
  assert.ok(all.total >= 2); // 至少 2 条（其它测试可能也插入了）
  const high = listItems({ importance: ['high'] });
  assert.equal(high.items[0].ai_importance, 'high');
  const sortedByScore = listItems({ sort: 'score_desc' });
  assert.equal(sortedByScore.items[0].ai_score, 0.9);
});

test('关键词增删', () => {
  const k1 = addKeyword('AI 大模型');
  assert.ok(k1.id);
  const k2 = addKeyword('AI 大模型'); // 重复
  assert.equal(k2, null);
  const list = getKeywords();
  assert.equal(list.length, 1);
});

test('stats 正常', () => {
  const s = stats();
  assert.ok(s.total >= 2);
  assert.ok(Array.isArray(s.bySource));
});
