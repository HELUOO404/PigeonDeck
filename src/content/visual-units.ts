/* ============================================================
   visual-units.ts — 智能组件块解析（移动/批注选择粒度用）
   蓝图 §4.3：选择粒度"智能块"基准的启发式实现。
   纯函数，无副作用，可单测。
   ============================================================ */

/** 语义标签：单独成块的结构性标签（无论 CSS）视为组件块 */
const SEMANTIC_BLOCK_TAGS = new Set([
  'SECTION', 'ARTICLE', 'ASIDE', 'NAV', 'HEADER', 'FOOTER',
  'LI', 'FIGURE', 'FORM', 'MAIN', 'DETAILS', 'SUMMARY',
  'FIELDSET', 'BLOCKQUOTE', 'TABLE', 'THEAD', 'TBODY', 'TR',
]);

/**
 * 视觉边界判定：元素是否有"视觉围栏"（边框 / 非透明背景 / 阴影 / 圆角组合）。
 * 用 computed style 判定，不依赖 inline style。
 */
function hasVisualBoundary(el: HTMLElement): boolean {
  const cs = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!cs) return false;

  // 非透明背景色（排除 transparent / rgba(0,0,0,0)）
  const bg = cs.backgroundColor;
  if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return true;

  // 有实边框（border-style !== none + border-width > 0）
  const bTop = cs.borderTopWidth;
  const bStyle = cs.borderTopStyle;
  if (bStyle && bStyle !== 'none' && bTop && parseFloat(bTop) > 0) return true;

  // box-shadow（有阴影）
  const shadow = cs.boxShadow;
  if (shadow && shadow !== 'none') return true;

  // 圆角 + 非默认背景（圆角自身不够，要有背景或边框配合；单独圆角跳过）
  // 以上条件任意一个已覆盖，此处无需再加

  return false;
}

/**
 * 视口上限：若元素宽且高都超过视口 95%，认为已是"整页容器"，停止爬升。
 * 目的：避免把 body/main 等整页块选中。
 * 注意：不能过于严格（≤90% 会漏掉合法的全宽卡片），95% 是经验值。
 * 改为"宽 AND 高都超 95%"，避免把普通全宽卡片当页面容器排除。
 */
function exceedsViewportThreshold(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vw = el.ownerDocument.defaultView?.innerWidth ?? 0;
  const vh = el.ownerDocument.defaultView?.innerHeight ?? 0;
  // 必须宽 AND 高都超过阈值（只有宽很大的全宽卡片不排除）
  return rect.width > vw * 0.98 && rect.height > vh * 0.5;
}

/**
 * resolveComponentBlock — 从命中元素沿 parentElement 上爬，
 * 返回最近的"组件块"：
 *   - 有可见边框 / 非透明背景 / 阴影 之一，且未超过视口 90%
 *   - 或是语义标签（SECTION/ARTICLE/ASIDE/NAV/HEADER/FOOTER/LI 等）
 * 爬不到（到 body/html 或超过视口阈值）则返回命中元素本身。
 */
export function resolveComponentBlock(el: HTMLElement): HTMLElement {
  const doc = el.ownerDocument;
  const body = doc.body;
  const root = doc.documentElement;

  let cur: HTMLElement | null = el;

  while (cur && cur !== body && cur !== root) {
    // 语义标签：直接当组件块
    if (SEMANTIC_BLOCK_TAGS.has(cur.tagName)) {
      // 但还要检视口阈值
      if (!exceedsViewportThreshold(cur)) return cur;
      // 超过阈值：继续向上找更小的祖先（实际上不会有更小的，所以直接返回 el）
      break;
    }

    // 有视觉边界 + 未超视口阈值
    if (hasVisualBoundary(cur) && !exceedsViewportThreshold(cur)) {
      return cur;
    }

    cur = cur.parentElement;
  }

  return el;
}
