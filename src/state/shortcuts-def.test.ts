/* ============================================================
   shortcuts-def.test.ts — 快捷键 registry 纯函数单测
   buildDefaultShortcuts / comboHasModifier / findShortcutConflict。
   ============================================================ */

import { describe, it, expect } from 'vitest';
import {
  SHORTCUT_DEFS,
  buildDefaultShortcuts,
  comboHasModifier,
  findShortcutConflict,
} from './shortcuts-def';

describe('buildDefaultShortcuts', () => {
  it('包含 registry 全部 id 及其默认绑定', () => {
    const defaults = buildDefaultShortcuts();
    expect(Object.keys(defaults).sort()).toEqual(
      ['delete', 'exit', 'moveFree', 'redo', 'save', 'undo'].sort()
    );
    expect(defaults.undo).toBe('Mod+Z');
    expect(defaults.save).toBe('Mod+Enter');
    expect(defaults.delete).toBe('Delete');
    expect(defaults.moveFree).toBe('Alt');
  });

  it('每次返回新对象（不共享引用）', () => {
    expect(buildDefaultShortcuts()).not.toBe(buildDefaultShortcuts());
  });
});

describe('comboHasModifier', () => {
  it('无修饰键的单键 → false', () => {
    expect(comboHasModifier('Enter')).toBe(false);
    expect(comboHasModifier('Delete')).toBe(false);
    expect(comboHasModifier('Z')).toBe(false);
  });

  it('含修饰键或裸修饰 token → true', () => {
    expect(comboHasModifier('Mod+Enter')).toBe(true);
    expect(comboHasModifier('Mod+Shift+Z')).toBe(true);
    expect(comboHasModifier('Alt')).toBe(true);
    expect(comboHasModifier('Shift')).toBe(true);
  });
});

describe('findShortcutConflict', () => {
  const map = buildDefaultShortcuts();

  it('命中另一动作的相同绑定', () => {
    // exit 想绑到 undo 现值 Mod+Z → 冲突到 undo
    expect(findShortcutConflict(map, 'exit', 'Mod+Z')).toBe('undo');
  });

  it('大小写不敏感', () => {
    expect(findShortcutConflict(map, 'exit', 'mod+z')).toBe('undo');
  });

  it('绑到自身现值不算冲突', () => {
    expect(findShortcutConflict(map, 'undo', 'Mod+Z')).toBeNull();
  });

  it('无冲突返回 null', () => {
    expect(findShortcutConflict(map, 'exit', 'Mod+K')).toBeNull();
  });

  it('忽略 modifier 类动作（moveFree 不参与组合键冲突）', () => {
    // 把某组合键设成 'Alt' 不会与 moveFree（modifier 类）冲突
    expect(findShortcutConflict(map, 'undo', 'Alt')).toBeNull();
  });
});

describe('SHORTCUT_DEFS', () => {
  it('save 要求修饰键，moveFree 为 modifier 类', () => {
    const save = SHORTCUT_DEFS.find((d) => d.id === 'save');
    const moveFree = SHORTCUT_DEFS.find((d) => d.id === 'moveFree');
    expect(save?.requireModifier).toBe(true);
    expect(moveFree?.kind).toBe('modifier');
  });
});
