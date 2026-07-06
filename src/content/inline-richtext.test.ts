/**
 * inline-richtext.test.ts — 字体栈解析纯函数 + F21 富文本浮条应用/记录
 * resolveFontStack: 下拉选中值 → 一个总能渲染出东西的字体栈（纯字符串函数，无需 DOM）。
 * RichTextBar（jsdom）: 每个动作「执行即记录」为结构化 RichTextChange；
 *   选区 vs 光标（元素级）范围判定；对齐落 editEl.style.textAlign；getChanges 归并去重。
 */

// @vitest-environment jsdom

import { describe, it, expect, afterEach } from 'vitest';
import { resolveFontStack, FONT_LIST, RichTextBar } from './inline-richtext';

describe('resolveFontStack', () => {
  it('FONT_LIST 命中：返回其带兜底的栈', () => {
    expect(resolveFontStack('Georgia')).toBe('Georgia, "Times New Roman", Times, serif');
    expect(resolveFontStack('Arial')).toBe('Arial, Helvetica, sans-serif');
  });

  it('system-ui 命中 FONT_LIST：返回完整系统栈', () => {
    expect(resolveFontStack('system-ui')).toContain('system-ui');
    expect(resolveFontStack('system-ui')).toContain('sans-serif');
  });

  it('通用族关键字原样返回', () => {
    expect(resolveFontStack('serif')).toBe('serif');
    expect(resolveFontStack('sans-serif')).toBe('sans-serif');
    expect(resolveFontStack('monospace')).toBe('monospace');
  });

  it('通用族关键字大小写不敏感', () => {
    expect(resolveFontStack('SERIF')).toBe('SERIF');
  });

  it('未知单词族名：补 sans-serif 兜底', () => {
    expect(resolveFontStack('Roboto')).toBe('Roboto, sans-serif');
  });

  it('未知含空格族名：加引号并补兜底', () => {
    expect(resolveFontStack('Comic Sans MS')).toBe('"Comic Sans MS", sans-serif');
  });

  it('已带引号的族名：去掉原引号后按需重新加引号', () => {
    expect(resolveFontStack('"Helvetica Neue"')).toBe('"Helvetica Neue", sans-serif');
  });

  it('每个 FONT_LIST 栈都以通用族结尾（保证总能渲染）', () => {
    const generic = /(serif|sans-serif|monospace|cursive|fantasy|system-ui)\s*$/i;
    for (const f of FONT_LIST) {
      expect(f.stack, f.label).toMatch(generic);
    }
  });

  it('每个 FONT_LIST value 都能被 resolveFontStack 解析为自身栈', () => {
    for (const f of FONT_LIST) {
      expect(resolveFontStack(f.value)).toBe(f.stack);
    }
  });
});

// ============================================================
// F21: RichTextBar 应用 + 记录（jsdom）
// ============================================================

describe('RichTextBar — 应用即记录', () => {
  let panelLayer: HTMLElement;
  let editEl: HTMLElement;
  let bar: RichTextBar;

  function setup(text = 'Quarterly revenue grew'): void {
    document.body.innerHTML = '';
    panelLayer = document.createElement('div');
    editEl = document.createElement('p');
    editEl.textContent = text;
    document.body.appendChild(panelLayer);
    document.body.appendChild(editEl);
    bar = new RichTextBar({ panelLayer, editEl, onCommit: () => {} });
  }

  /** 在 editEl 文本节点上建 [start,end) 选区 */
  function select(start: number, end: number): void {
    const node = editEl.firstChild!;
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /** 折叠光标（无选区） */
  function caret(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(editEl);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  afterEach(() => {
    bar.destroy();
  });

  it('加粗（选区）：记 kind=bold/target=selection/on，DOM 出现 font-weight:700 span', () => {
    setup();
    select(0, 9); // "Quarterly"
    bar.toggleBold();
    const changes = bar.getChanges();
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ kind: 'bold', target: 'selection', oldValue: 'off', newValue: 'on' });
    expect(changes[0].targetText).toBe('Quarterly');
    expect(changes[0].summary.length).toBeGreaterThan(0);
    const span = editEl.querySelector('span');
    expect(span?.style.fontWeight).toBe('700');
  });

  it('字号（选区）：包 span，记 target=selection/new=32px（!important 稳压宿主）', () => {
    setup();
    select(0, 9);
    bar.applyFontSize('32');
    const changes = bar.getChanges();
    expect(changes[0]).toMatchObject({ kind: 'font-size', target: 'selection', newValue: '32px' });
    const span = [...editEl.querySelectorAll('span')].find((s) => s.style.fontSize === '32px');
    expect(span).toBeTruthy();
    expect(span!.style.getPropertyPriority('font-size')).toBe('important');
    expect(span!.textContent).toBe('Quarterly');
  });

  it('字号（仅光标）：不 bail，记 target=element、作用于整块包裹 span（F21#4）', () => {
    setup();
    caret();
    bar.applyFontSize('28');
    const changes = bar.getChanges();
    expect(changes[0]).toMatchObject({ kind: 'font-size', target: 'element', newValue: '28px' });
    expect(changes[0].targetText).toBeUndefined();
    // 整块被单层 span 包裹，字号落其上
    expect(editEl.childNodes.length).toBe(1);
    const span = editEl.firstElementChild as HTMLElement;
    expect(span.tagName).toBe('SPAN');
    expect(span.style.fontSize).toBe('28px');
  });

  it('对齐：始终 target=element，写 editEl.style.text-align（不写 span），记 old→new', () => {
    setup();
    select(0, 9); // 即使有选区，对齐也作用于整块
    bar.applyAlign('center');
    const changes = bar.getChanges();
    expect(changes[0]).toMatchObject({ kind: 'align', target: 'element', newValue: 'center' });
    expect(editEl.style.textAlign).toBe('center');
    // 对齐不产生 span 包裹
    expect(editEl.querySelector('span')).toBeNull();
  });

  it('字色（选区）：包 span 记 kind=color', () => {
    setup();
    select(0, 9);
    bar.applyColor('#e00');
    const changes = bar.getChanges();
    expect(changes[0]).toMatchObject({ kind: 'color', target: 'selection', newValue: '#e00' });
    const span = editEl.querySelector('span');
    expect(span?.style.color).toBe('rgb(238, 0, 0)');
  });

  it('getChanges 归并：同选区连续两次字号 → 一条，取最新 new', () => {
    setup();
    select(0, 9);
    bar.applyFontSize('32');
    bar.applyFontSize('48');
    const changes = bar.getChanges();
    expect(changes).toHaveLength(1);
    expect(changes[0].newValue).toBe('48px');
  });

  it('链式格式化：选区加粗后再改字号，作用同一段（复用/相邻 span，非整段）', () => {
    setup();
    select(0, 9);
    bar.toggleBold();
    bar.applyFontSize('20');
    // 两条记录（bold + font-size），文本仍只覆盖选区
    const kinds = bar.getChanges().map((c) => c.kind).sort();
    expect(kinds).toEqual(['bold', 'font-size']);
    const full = editEl.textContent ?? '';
    expect(full).toBe('Quarterly revenue grew');
  });
});
