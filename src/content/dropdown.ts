/* ============================================================
   dropdown.ts — 统一自制下拉浮层（非语言枚举下拉一律不用原生 select）
   蓝图 §5.1 / design-system §5.11 / preview part 40：
   - 触发钮 .pd-select + 右侧小圆球 chevron（见 fields.ts）
   - 浮层：智能识别栏（祖先链采样去重按频次前 5，采不到自隐）
     → 分隔线 → 默认全量列表（≥7 行可见后滚动）
   ============================================================ */

import { t } from './i18n';
import { mountPopover, PopoverHandle } from './popover';

/** 勾选图标（Lucide check） */
const CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

export interface DropdownItem {
  value: string;
  label: string;
  /** 选项预览字体（字体下拉：选项用对应字体渲染） */
  fontFamily?: string;
}

/**
 * 采样"选中元素祖先链"上某字段的实际值：
 * 从元素本身沿 parentElement 上溯到 body（含），
 * 收集 getValue 的非空返回值，去重、按出现频次降序（同频保持自下而上先见顺序），取前 max。
 * 一个值都采不到时返回空数组（调用方自隐智能栏）。
 */
export function sampleAncestorValues(
  el: Element,
  getValue: (node: Element) => string | null | undefined,
  max = 5
): string[] {
  const counts = new Map<string, number>();
  const order: string[] = [];
  let node: Element | null = el;
  const doc = el.ownerDocument;
  while (node && node !== doc.documentElement) {
    const value = getValue(node);
    if (value) {
      if (!counts.has(value)) {
        counts.set(value, 0);
        order.push(value);
      }
      counts.set(value, counts.get(value)! + 1);
    }
    node = node.parentElement;
  }
  // 稳定排序：同频保持先见顺序
  return order.sort((a, b) => counts.get(b)! - counts.get(a)!).slice(0, max);
}

/** computed font-family 的首选字体名（去引号） */
export function primaryFontFamily(fontFamily: string): string {
  const first = fontFamily.split(',')[0]?.trim() ?? '';
  return first.replace(/^["']|["']$/g, '');
}

export interface DropdownOptions {
  /** 浮层挂载容器（panel 层根） */
  root: HTMLElement;
  /** 触发钮 */
  anchor: HTMLElement;
  /** 默认全量列表 */
  items: DropdownItem[];
  /** 智能识别项（空 = 该节自隐） */
  smartItems?: DropdownItem[];
  /** 当前值（对应行打勾高亮） */
  current: string;
  onPick: (value: string) => void;
}

function renderItem(item: DropdownItem, current: string, smart: boolean): HTMLElement {
  const row = document.createElement('div');
  row.className = 'pd-dd-item' + (item.value === current ? ' on' : '');
  row.setAttribute('data-testid', 'pd-dd-item');
  row.setAttribute('data-value', item.value);
  if (smart) {
    const badge = document.createElement('span');
    badge.className = 'smart';
    badge.textContent = t('badge_smart');
    row.appendChild(badge);
  }
  const nm = document.createElement('span');
  nm.className = 'nm';
  nm.textContent = item.label;
  if (item.fontFamily) nm.style.fontFamily = item.fontFamily;
  row.appendChild(nm);
  const chk = document.createElement('span');
  chk.className = 'chk';
  chk.innerHTML = CHECK_SVG;
  row.appendChild(chk);
  return row;
}

/** 打开自制下拉浮层。返回句柄（选择/点外部自动关闭）。 */
export function openDropdown(opts: DropdownOptions): PopoverHandle {
  const dd = document.createElement('div');
  dd.className = 'pd-dd';
  dd.setAttribute('data-testid', 'pd-dropdown');
  dd.style.width = `${Math.max(190, opts.anchor.getBoundingClientRect().width)}px`;

  const smartItems = opts.smartItems ?? [];
  if (smartItems.length > 0) {
    const h = document.createElement('div');
    h.className = 'pd-dd-h';
    h.textContent = t('dd_smart');
    dd.appendChild(h);

    const list = document.createElement('div');
    list.className = 'pd-dd-list';
    list.setAttribute('data-testid', 'pd-dd-smart');
    for (const item of smartItems) list.appendChild(renderItem(item, opts.current, true));
    dd.appendChild(list);

    const sep = document.createElement('div');
    sep.className = 'pd-dd-sep';
    dd.appendChild(sep);
  }

  const allH = document.createElement('div');
  allH.className = 'pd-dd-h';
  allH.textContent = t('dd_all');
  dd.appendChild(allH);

  const allList = document.createElement('div');
  allList.className = 'pd-dd-list pd-dd-scroll pd-scroll';
  allList.setAttribute('data-testid', 'pd-dd-all');
  for (const item of opts.items) allList.appendChild(renderItem(item, opts.current, false));
  dd.appendChild(allList);

  const handle = mountPopover(opts.root, dd, opts.anchor);

  dd.addEventListener('click', (ev) => {
    const row = (ev.target as Element).closest?.('.pd-dd-item');
    if (!(row instanceof HTMLElement)) return;
    const value = row.getAttribute('data-value');
    handle.close();
    if (value !== null) opts.onPick(value);
  });

  return handle;
}
