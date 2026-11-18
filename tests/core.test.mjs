import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchWholeArchive, fetchRankedIds, normalizePost, orderByPopularity, isAllowedArticleUrl } from '../lib/archive-core.mjs';
import { assignCovers, balanceRows, capacityFor, physical } from '../lib/magazines.mjs';

const post = (id, day, extra = {}) => ({ id, slug: `p${id}`, title: `T${id}`, post_date: `2026-11-${String(day).padStart(2, '0')}T10:00:00Z`, canonical_url: `https://thesundaymagazine.substack.com/p/p${id}`, audience: 'everyone', postTags: [], ...extra });

test('rejects posts on foreign domains', () => {
  assert.equal(normalizePost(post(1, 1, { canonical_url: 'https://evil.example/p/x' })), null);
  assert.equal(isAllowedArticleUrl('http://thesundaymagazine.substack.com/p/x'), false);
});

test('cursor pagination continues past short pages and stops on missing cursor', async () => {
  const pages = { null: { posts: [post(1, 5), post(2, 4)], nextCursor: 'a' }, a: { posts: [post(3, 3)], nextCursor: 'b' }, b: { posts: [post(4, 2)], nextCursor: null } };
  const all = await fetchWholeArchive(async ({ cursor }) => pages[String(cursor)]);
  assert.deepEqual(all.map((a) => a.postId), ['1', '2', '3', '4']);
});

test('offset pagination continues until an empty batch', async () => {
  const data = [post(1, 9), post(2, 8), post(3, 7)];
  const all = await fetchWholeArchive(async ({ offset = 0 }) => data.slice(offset, offset + 2 - (offset ? 1 : 0)));
  assert.equal(all.length, 3);
});

test('repeating pages fail instead of looping', async () => {
  await assert.rejects(fetchWholeArchive(async () => ({ posts: [post(1, 1)], nextCursor: 'x' + Math.random() })));
});

test('popularity keeps Substack order and appends unranked newest first', async () => {
  const arts = [post(1, 1), post(2, 2), post(3, 3)].map(normalizePost);
  const ids = await fetchRankedIds(async () => ({ posts: [{ id: 1 }, { id: 3 }], nextCursor: null }));
  assert.deepEqual(orderByPopularity(arts, ids).map((a) => a.postId), ['1', '3', '2']);
});

test('rows balance: 63 at 8 -> seven 8s and one 7; 4 results stay 4', () => {
  const r = balanceRows(63, 8);
  assert.equal(r.length, 8); assert.equal(r.filter((n) => n === 8).length, 7); assert.equal(r.reduce((a, b) => a + b), 63);
  assert.deepEqual(balanceRows(4, 8), [4]);
  assert.equal(capacityFor(1000), 8); assert.equal(capacityFor(700), 7); assert.equal(capacityFor(320), 2);
});

test('never three consecutive covers in the same style when variants exist', () => {
  const variants = (pid) => ['overlay', 'split', 'title'].flatMap((style) => ['grid', 'stories'].map((ratio) => ({ style, ratio, src: `${pid}-${style}-${ratio}`, width: 720, height: ratio === 'grid' ? 900 : 1280 })));
  const arts = Array.from({ length: 60 }, (_, i) => normalizePost(post(100 + i, (i % 28) + 1)));
  const byId = Object.fromEntries(arts.map((a) => [a.postId, variants(a.postId)]));
  for (const order of [arts, [...arts].reverse(), arts.filter((_, i) => i % 3 === 0)]) {
    const { items, violations } = assignCovers(order, byId);
    assert.equal(violations.length, 0);
    for (let i = 2; i < items.length; i++) assert.ok(!(items[i].style === items[i - 1].style && items[i].style === items[i - 2].style));
    for (const it of items) assert.ok(it.cover.src.startsWith(it.article.postId));
  }
});

test('physical traits are stable and in range', () => {
  const v = [{ ratio: 'grid' }, { ratio: 'stories' }];
  const a = physical('abc', v), b = physical('abc', v);
  assert.deepEqual(a, b);
  assert.ok(a.lean >= -1.5 && a.lean <= 1.5 && a.thickness >= 2 && a.thickness <= 4);
});
