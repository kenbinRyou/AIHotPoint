// tests/hash.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itemHash, timeRangeToSince, safeJson, randomDelay } from '../src/utils/hash.js';

test('itemHash 大小写归一化（用于去重）', () => {
  const a = itemHash('https://x.com/a', 'Hello World');
  const b = itemHash('https://x.com/a', 'Hello   World');
  const c = itemHash('https://x.com/a', 'hello world');
  assert.equal(a, b);
  assert.equal(a, c); // 大小写归一
});

test('itemHash 空值不报错', () => {
  const a = itemHash('', '');
  const b = itemHash(null, undefined);
  assert.equal(a, b);
  assert.equal(a.length, 40);
});

test('timeRangeToSince 1h ≈ 3600000ms', () => {
  const now = Date.now();
  const s = timeRangeToSince('1h');
  assert.ok(now - s >= 3590000 && now - s <= 3601000);
});

test('timeRangeToSince all => 0', () => {
  assert.equal(timeRangeToSince('all'), 0);
});

test('safeJson 解析', () => {
  assert.deepEqual(safeJson('{"a":1}'), { a: 1 });
  assert.equal(safeJson('not json', 'fallback'), 'fallback');
  assert.deepEqual(safeJson(null, []), []);
  assert.equal(safeJson(undefined, 'fb'), 'fb');
});

test('randomDelay 在范围内', async () => {
  const t0 = Date.now();
  await randomDelay(50, 100);
  const dt = Date.now() - t0;
  assert.ok(dt >= 40 && dt <= 300, `delay=${dt}`);
});
