/* ============================================================
   disable.test.ts — 阶段 13a 禁用纯函数单测
   覆盖 isPageDisabled（全局/命中/未命中/无效 url/精确 host）与 hostOf。
   ============================================================ */

import { describe, it, expect } from 'vitest';
import { isPageDisabled, hostOf } from './disable';

describe('hostOf', () => {
  it('解析普通 http(s) url 的 host', () => {
    expect(hostOf('https://example.com/path?q=1')).toBe('example.com');
  });

  it('保留端口', () => {
    expect(hostOf('http://localhost:5173/foo')).toBe('localhost:5173');
  });

  it('子域返回完整子域 host', () => {
    expect(hostOf('https://sub.example.com/')).toBe('sub.example.com');
  });

  it('无效 url 返回空串', () => {
    expect(hostOf('not a url')).toBe('');
  });

  it('无 host 方案（file:///、mailto:）返回空串', () => {
    expect(hostOf('file:///c:/tmp/x.html')).toBe('');
    expect(hostOf('mailto:foo@bar.com')).toBe('');
  });
});

describe('isPageDisabled', () => {
  it('全局禁用 → 任意页面禁用', () => {
    expect(isPageDisabled('https://example.com', true, [])).toBe(true);
    expect(isPageDisabled('not a url', true, [])).toBe(true);
  });

  it('站点命中 → 禁用', () => {
    expect(isPageDisabled('https://example.com/x', false, ['example.com'])).toBe(true);
  });

  it('站点未命中 → 不禁用', () => {
    expect(isPageDisabled('https://other.com/x', false, ['example.com'])).toBe(false);
  });

  it('精确 host 匹配：子域不等于父域', () => {
    expect(isPageDisabled('https://sub.example.com', false, ['example.com'])).toBe(false);
    expect(isPageDisabled('https://example.com', false, ['sub.example.com'])).toBe(false);
  });

  it('端口参与匹配', () => {
    expect(isPageDisabled('http://localhost:5173', false, ['localhost:5173'])).toBe(true);
    expect(isPageDisabled('http://localhost:3000', false, ['localhost:5173'])).toBe(false);
  });

  it('无效 url 且非全局 → 不禁用', () => {
    expect(isPageDisabled('not a url', false, ['example.com'])).toBe(false);
  });

  it('空 sites 列表且非全局 → 不禁用', () => {
    expect(isPageDisabled('https://example.com', false, [])).toBe(false);
  });
});
