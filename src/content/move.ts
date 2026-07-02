/* ============================================================
   move.ts — MoveManager：移动模式单击选中 + 八向句柄缩放
   蓝图 §4.3：选中框 + 八向句柄 + 句柄拖拽改尺寸 → StyleChange → 撤销历史
   ============================================================ */

import { Controller } from './controller';
import { AnnotationStore, StyleChange, mergeChanges } from '../state/annotations';
import { History } from '../state/history';
import { SelectionResolver } from './selection';
import { buildSelector } from '../shared/dom-utils';

/** 八向句柄方位 */
type HandleDir = 'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'bm' | 'ml' | 'mr';

/** 哪些维度受该方位影响 */
const HANDLE_DIMS: Record<HandleDir, { w: boolean; h: boolean; wNeg: boolean; hNeg: boolean }> = {
  tl: { w: true,  h: true,  wNeg: true,  hNeg: true  },
  tr: { w: true,  h: true,  wNeg: false, hNeg: true  },
  bl: { w: true,  h: true,  wNeg: true,  hNeg: false },
  br: { w: true,  h: true,  wNeg: false, hNeg: false },
  tm: { w: false, h: true,  wNeg: false, hNeg: true  },
  bm: { w: false, h: true,  wNeg: false, hNeg: false },
  ml: { w: true,  h: false, wNeg: true,  hNeg: false },
  mr: { w: true,  h: false, wNeg: false, hNeg: false },
};

/** 按 selector 查找目标元素（仅唯一命中才返回） */
function resolveTarget(selector: string): HTMLElement | null {
  try {
    const matches = document.querySelectorAll(selector);
    if (matches.length === 1 && matches[0] instanceof HTMLElement) return matches[0];
    return null;
  } catch {
    return null;
  }
}

/** 应用样式变更到 HTMLElement（撤销/重做用） */
function applyChangesToEl(el: HTMLElement | null, changes: StyleChange[], dir: 'old' | 'new'): void {
  if (!el) return;
  for (const c of changes) {
    const value = dir === 'old' ? c.oldValue : c.newValue;
    el.style.setProperty(c.cssProp, value);
  }
}

export class MoveManager {
  private controller: Controller;
  private store: AnnotationStore;
  private history: History;
  private resolver: SelectionResolver;
  private overlayLayer: HTMLElement;
  private shadowHost: Element;

  // 当前选中
  private selectedEl: HTMLElement | null = null;
  private selboxEl: HTMLElement | null = null;

  // 句柄拖拽状态
  private dragging = false;
  private dragDir: HandleDir | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private origW = 0;
  private origH = 0;

  // 跟随刷新
  private rafId: number | null = null;

  private active = false;
  private unsubscribeController: () => void;

  constructor(opts: {
    controller: Controller;
    store: AnnotationStore;
    history: History;
    resolver: SelectionResolver;
    overlayLayer: HTMLElement;
  }) {
    this.controller = opts.controller;
    this.store = opts.store;
    this.history = opts.history;
    this.resolver = opts.resolver;
    this.overlayLayer = opts.overlayLayer;
    this.shadowHost = (opts.overlayLayer.getRootNode() as ShadowRoot).host;

    this.unsubscribeController = opts.controller.subscribe(() => this.syncActive());
    this.syncActive();

    // capture 段：移动模式接管 click/mousedown
    window.addEventListener('click', this.onClick, true);
    window.addEventListener('mousedown', this.onMouseDown, true);
    window.addEventListener('scroll', this.scheduleReposition, { capture: true, passive: true });
    window.addEventListener('resize', this.scheduleReposition);
  }

  destroy(): void {
    this.unsubscribeController();
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('mousedown', this.onMouseDown, true);
    window.removeEventListener('scroll', this.scheduleReposition, true);
    window.removeEventListener('resize', this.scheduleReposition);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.clearSelection();
  }

  // ---- 模式同步 ----

  private syncActive(): void {
    const { expanded, mode } = this.controller.getState();
    const next = expanded && mode === 'move';
    if (this.active && !next) {
      // 离开移动模式：清除选中
      this.clearSelection();
    }
    this.active = next;
  }

  private isOwnUi(ev: Event): boolean {
    return ev.composedPath().includes(this.shadowHost);
  }

  // ---- 事件处理 ----

  private onClick = (ev: MouseEvent): void => {
    if (!this.active || this.isOwnUi(ev)) return;

    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;

    // 排除 body/html（空白处点击 → 取消选中）
    if (target === document.body || target === document.documentElement) {
      this.clearSelection();
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    ev.preventDefault();
    ev.stopPropagation();

    // 解析选中目标
    const resolved = this.resolver.resolve(target);
    this.selectElement(resolved);
  };

  private onMouseDown = (ev: MouseEvent): void => {
    if (!this.active || this.isOwnUi(ev)) return;
    if (ev.target === document.body || ev.target === document.documentElement) return;

    // 阻止页面默认 mousedown（焦点/选区/链接等）
    ev.preventDefault();
    ev.stopPropagation();
  };

  // ---- 选中框 ----

  private selectElement(el: HTMLElement): void {
    this.clearSelection();
    this.selectedEl = el;
    this.renderSelbox();
  }

  private renderSelbox(): void {
    if (!this.selectedEl) return;
    const rect = this.selectedEl.getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    const box = document.createElement('div');
    box.className = 'pd-selbox';
    box.setAttribute('data-testid', 'pd-selbox');

    // 定位：overlay 层是 fixed inset:0，直接用 viewport 坐标
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;

    // 八向句柄
    const dirs: HandleDir[] = ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'ml', 'mr'];
    for (const dir of dirs) {
      const h = document.createElement('span');
      h.className = `h ${dir}`;
      h.setAttribute('data-testid', `pd-handle-${dir}`);
      h.addEventListener('mousedown', (e) => this.onHandleMouseDown(e, dir), true);
      box.appendChild(h);
    }

    this.overlayLayer.appendChild(box);
    this.selboxEl = box;
  }

  private clearSelection(): void {
    this.selboxEl?.remove();
    this.selboxEl = null;
    this.selectedEl = null;
    if (this.dragging) {
      this.endDrag();
    }
  }

  private repositionSelbox(): void {
    if (!this.selboxEl || !this.selectedEl) return;
    if (!this.selectedEl.isConnected) {
      this.clearSelection();
      return;
    }
    const rect = this.selectedEl.getBoundingClientRect();
    this.selboxEl.style.left = `${rect.left}px`;
    this.selboxEl.style.top = `${rect.top}px`;
    this.selboxEl.style.width = `${rect.width}px`;
    this.selboxEl.style.height = `${rect.height}px`;
  }

  private scheduleReposition = (): void => {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.repositionSelbox();
    });
  };

  // ---- 句柄拖拽 ----

  private onHandleMouseDown = (ev: MouseEvent, dir: HandleDir): void => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!this.selectedEl) return;

    this.dragging = true;
    this.dragDir = dir;
    this.dragStartX = ev.clientX;
    this.dragStartY = ev.clientY;

    const cs = window.getComputedStyle(this.selectedEl);
    this.origW = parseFloat(cs.width) || 0;
    this.origH = parseFloat(cs.height) || 0;

    window.addEventListener('mousemove', this.onDragMove, { capture: true });
    window.addEventListener('mouseup', this.onDragUp, { capture: true });
  };

  private onDragMove = (ev: MouseEvent): void => {
    if (!this.dragging || !this.selectedEl || !this.dragDir) return;
    ev.preventDefault();
    ev.stopPropagation();

    const dx = ev.clientX - this.dragStartX;
    const dy = ev.clientY - this.dragStartY;

    const dims = HANDLE_DIMS[this.dragDir];

    if (dims.w) {
      const newW = Math.max(0, this.origW + (dims.wNeg ? -dx : dx));
      this.selectedEl.style.width = `${newW}px`;
    }
    if (dims.h) {
      const newH = Math.max(0, this.origH + (dims.hNeg ? -dy : dy));
      this.selectedEl.style.height = `${newH}px`;
    }

    // 同步更新 selbox 位置/尺寸
    this.repositionSelbox();
  };

  private onDragUp = (ev: MouseEvent): void => {
    if (!this.dragging || !this.selectedEl || !this.dragDir) return;
    ev.preventDefault();
    ev.stopPropagation();

    const el = this.selectedEl;
    const dir = this.dragDir;
    const dims = HANDLE_DIMS[dir];

    const cs = window.getComputedStyle(el);
    const newW = parseFloat(cs.width) || 0;
    const newH = parseFloat(cs.height) || 0;

    // 构建 StyleChange（有变化才记录）
    const changes: StyleChange[] = [];
    if (dims.w && Math.abs(newW - this.origW) > 0.5) {
      changes.push({
        prop: 'width',
        cssProp: 'width',
        oldValue: `${this.origW}px`,
        newValue: `${newW}px`,
      });
    }
    if (dims.h && Math.abs(newH - this.origH) > 0.5) {
      changes.push({
        prop: 'height',
        cssProp: 'height',
        oldValue: `${this.origH}px`,
        newValue: `${newH}px`,
      });
    }

    if (changes.length > 0) {
      this.commitChanges(el, changes);
    }

    this.endDrag();
  };

  private endDrag(): void {
    this.dragging = false;
    this.dragDir = null;
    window.removeEventListener('mousemove', this.onDragMove, true);
    window.removeEventListener('mouseup', this.onDragUp, true);
  }

  /** 将 StyleChange 并入标注 store + 推入撤销历史 */
  private commitChanges(el: HTMLElement, changes: StyleChange[]): void {
    const selector = buildSelector(el);
    const existing = this.store.getBySelector(selector);

    if (existing) {
      const before = existing;
      const merged = mergeChanges(before.changes, changes);
      const after = this.store.update(before.id, { changes: merged });
      if (after) {
        const afterSnap = after;
        this.history.push({
          label: 'move:resize',
          apply: () => {
            applyChangesToEl(this.resolveEl(afterSnap.selector), changes, 'new');
            this.store.update(afterSnap.id, { changes: afterSnap.changes });
          },
          revert: () => {
            applyChangesToEl(this.resolveEl(afterSnap.selector), changes, 'old');
            this.store.update(before.id, { changes: before.changes });
          },
        });
      }
    } else {
      const rect = el.getBoundingClientRect();
      const added = this.store.add({
        selector,
        elementType: 'container',
        summary: el.tagName.toLowerCase(),
        note: '',
        changes,
        viewportPos: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        },
      });
      const addedSnap = added;
      this.history.push({
        label: 'move:resize',
        apply: () => {
          applyChangesToEl(this.resolveEl(addedSnap.selector), changes, 'new');
          this.store.restore(addedSnap);
        },
        revert: () => {
          applyChangesToEl(this.resolveEl(addedSnap.selector), changes, 'old');
          this.store.remove(addedSnap.id);
        },
      });
    }
  }

  private resolveEl(selector: string): HTMLElement | null {
    return resolveTarget(selector);
  }
}
