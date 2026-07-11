// @vitest-environment jsdom
/* ============================================================
   shortcuts.test.ts — combo 纯函数单测（formatCombo / matchCombo）
   建议6：跨平台 Mod、修饰键固定序、命名键、仅修饰键→空串。
   ============================================================ */

import { describe, it, expect } from 'vitest';
import { formatCombo, matchCombo, eventHasModifier } from './shortcuts';

/** 构造一个 keydown KeyboardEvent */
function ke(init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent('keydown', init);
}

/** 构造一个 MouseEvent（modifier 类快捷键从拖拽鼠标事件读修饰键） */
function me(init: MouseEventInit): MouseEvent {
  return new MouseEvent('mousemove', init);
}

describe('formatCombo', () => {
  it('单字母主键统一大写', () => {
    expect(formatCombo(ke({ key: 'z' }))).toBe('Z');
    expect(formatCombo(ke({ key: 'Z' }))).toBe('Z');
  });

  it('Mod = Ctrl 或 Cmd（跨平台归一）', () => {
    expect(formatCombo(ke({ key: 'z', ctrlKey: true }))).toBe('Mod+Z');
    expect(formatCombo(ke({ key: 'z', metaKey: true }))).toBe('Mod+Z');
  });

  it('修饰键固定序 Mod → Shift → Alt', () => {
    expect(formatCombo(ke({ key: 'z', ctrlKey: true, shiftKey: true }))).toBe('Mod+Shift+Z');
    expect(formatCombo(ke({ key: 'z', metaKey: true, shiftKey: true, altKey: true }))).toBe(
      'Mod+Shift+Alt+Z'
    );
  });

  it('命名键保留 e.key 原值', () => {
    expect(formatCombo(ke({ key: 'Escape' }))).toBe('Escape');
    expect(formatCombo(ke({ key: 'ArrowUp' }))).toBe('ArrowUp');
    expect(formatCombo(ke({ key: 'F2' }))).toBe('F2');
    expect(formatCombo(ke({ key: 'Enter', ctrlKey: true }))).toBe('Mod+Enter');
  });

  it('仅按下修饰键本身 → 空串（尚无主键）', () => {
    expect(formatCombo(ke({ key: 'Control', ctrlKey: true }))).toBe('');
    expect(formatCombo(ke({ key: 'Meta', metaKey: true }))).toBe('');
    expect(formatCombo(ke({ key: 'Shift', shiftKey: true }))).toBe('');
    expect(formatCombo(ke({ key: 'Alt', altKey: true }))).toBe('');
  });
});

describe('matchCombo', () => {
  it('匹配默认撤销/重做绑定（Ctrl 与 Cmd 皆可）', () => {
    expect(matchCombo(ke({ key: 'z', ctrlKey: true }), 'Mod+Z')).toBe(true);
    expect(matchCombo(ke({ key: 'z', metaKey: true }), 'Mod+Z')).toBe(true);
    expect(matchCombo(ke({ key: 'z', ctrlKey: true, shiftKey: true }), 'Mod+Shift+Z')).toBe(true);
  });

  it('撤销组合不误配重做（Shift 区分）', () => {
    expect(matchCombo(ke({ key: 'z', ctrlKey: true, shiftKey: true }), 'Mod+Z')).toBe(false);
    expect(matchCombo(ke({ key: 'z', ctrlKey: true }), 'Mod+Shift+Z')).toBe(false);
  });

  it('Escape 匹配且大小写不敏感', () => {
    expect(matchCombo(ke({ key: 'Escape' }), 'Escape')).toBe(true);
    expect(matchCombo(ke({ key: 'Escape' }), 'escape')).toBe(true);
  });

  it('空 combo 永不匹配', () => {
    expect(matchCombo(ke({ key: 'z', ctrlKey: true }), '')).toBe(false);
    expect(matchCombo(ke({ key: 'Control', ctrlKey: true }), 'Mod+Z')).toBe(false);
  });

  it('匹配 Delete / Mod+Enter（重构后消费端用）', () => {
    expect(matchCombo(ke({ key: 'Delete' }), 'Delete')).toBe(true);
    expect(matchCombo(ke({ key: 'Backspace' }), 'Delete')).toBe(false);
    expect(matchCombo(ke({ key: 'Enter', ctrlKey: true }), 'Mod+Enter')).toBe(true);
    expect(matchCombo(ke({ key: 'Enter', metaKey: true }), 'Mod+Enter')).toBe(true);
    expect(matchCombo(ke({ key: 'Enter' }), 'Mod+Enter')).toBe(false);
  });
});

describe('eventHasModifier', () => {
  it('KeyboardEvent / MouseEvent 均识别按住的修饰键', () => {
    expect(eventHasModifier(me({ altKey: true }), 'Alt')).toBe(true);
    expect(eventHasModifier(me({ altKey: false }), 'Alt')).toBe(false);
    expect(eventHasModifier(ke({ key: 'a', shiftKey: true }), 'Shift')).toBe(true);
    expect(eventHasModifier(me({ metaKey: true }), 'Meta')).toBe(true);
  });

  it('Mod = Ctrl 或 Cmd', () => {
    expect(eventHasModifier(me({ ctrlKey: true }), 'Mod')).toBe(true);
    expect(eventHasModifier(me({ metaKey: true }), 'Mod')).toBe(true);
    expect(eventHasModifier(me({}), 'Mod')).toBe(false);
  });

  it('未知 token → false', () => {
    expect(eventHasModifier(me({ altKey: true }), 'Nope')).toBe(false);
  });
});
