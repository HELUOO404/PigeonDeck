/* ============================================================
   disable.ts — 全局/站点禁用数据模型（chrome.storage.local）
   阶段 13a：Popup 与内容脚本注入守卫共享。纯函数可测 + 异步存取。
   ============================================================ */

/** storage key：全局禁用布尔 */
export const KEY_GLOBAL = 'pdDisabledGlobal';
/** storage key：禁用站点 host 列表 */
export const KEY_SITES = 'pdDisabledSites';

/**
 * 解析 url 的 host（精确 host，含端口，不含协议/路径）。
 * 解析失败（无效 url、chrome:// 等无 host 的方案）返回空串。
 */
export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

/**
 * 判定某页面是否被禁用（纯函数）：
 * - global 为 true → 一律禁用。
 * - 否则解析 host（失败 → 不禁用，返回 false），host 精确命中 sites → 禁用。
 * 精确 host 匹配：子域不等于父域（sub.example.com ≠ example.com）。
 */
export function isPageDisabled(url: string, global: boolean, sites: string[]): boolean {
  if (global) return true;
  const host = hostOf(url);
  if (!host) return false;
  return sites.includes(host);
}

/** 读取禁用状态；storage 不可用时静默返回默认（false / []）。 */
export async function loadDisableState(): Promise<{ global: boolean; sites: string[] }> {
  try {
    const result = await chrome.storage.local.get([KEY_GLOBAL, KEY_SITES]);
    const global = result[KEY_GLOBAL] === true;
    const sites = Array.isArray(result[KEY_SITES])
      ? (result[KEY_SITES] as unknown[]).filter((s): s is string => typeof s === 'string')
      : [];
    return { global, sites };
  } catch {
    return { global: false, sites: [] };
  }
}

/** 写全局禁用开关。 */
export async function setGlobalDisabled(v: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ [KEY_GLOBAL]: v });
  } catch {
    // storage 不可用时静默
  }
}

/** 增删禁用站点 host（去重）。 */
export async function setSiteDisabled(host: string, disabled: boolean): Promise<void> {
  if (!host) return;
  try {
    const { sites } = await loadDisableState();
    const set = new Set(sites);
    if (disabled) set.add(host);
    else set.delete(host);
    await chrome.storage.local.set({ [KEY_SITES]: [...set] });
  } catch {
    // storage 不可用时静默
  }
}
