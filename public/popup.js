/* ============================================================
   popup.js — 工具栏弹窗脚本（静态扩展页，不走 vite 入口）
   阶段 13a：全局/站点禁用开关 + 禁用列表 + 状态条 + file/PDF 提示。
   文案走 chrome.i18n；禁用状态直读写 chrome.storage.local（键与
   src/state/disable.ts 保持一致：pdDisabledGlobal / pdDisabledSites）。
   ============================================================ */

const KEY_GLOBAL = 'pdDisabledGlobal';
const KEY_SITES = 'pdDisabledSites';

/** 解析 host，失败返回空串（与 disable.ts hostOf 语义一致）。 */
function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

/** 是否为扩展无法标注的页面（无 http(s) host：chrome://、扩展页、about: 等）。 */
function isUnsupported(url) {
  if (!url) return true;
  return !/^https?:\/\//i.test(url) && !/^file:\/\//i.test(url);
}

function i18n(key) {
  return chrome.i18n.getMessage(key) || '';
}

function fillI18n() {
  const title = i18n('popup_title');
  if (title) document.title = title;
  const uiLang = chrome.i18n.getUILanguage();
  if (uiLang) document.documentElement.lang = uiLang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const msg = i18n(el.getAttribute('data-i18n'));
    if (msg) el.textContent = msg;
  });
}

async function loadState() {
  try {
    const r = await chrome.storage.local.get([KEY_GLOBAL, KEY_SITES]);
    return {
      global: r[KEY_GLOBAL] === true,
      sites: Array.isArray(r[KEY_SITES]) ? r[KEY_SITES].filter((s) => typeof s === 'string') : [],
    };
  } catch {
    return { global: false, sites: [] };
  }
}

async function setGlobal(v) {
  try {
    await chrome.storage.local.set({ [KEY_GLOBAL]: v });
  } catch {
    /* 静默 */
  }
}

async function setSite(host, disabled) {
  if (!host) return;
  try {
    const { sites } = await loadState();
    const set = new Set(sites);
    if (disabled) set.add(host);
    else set.delete(host);
    await chrome.storage.local.set({ [KEY_SITES]: [...set] });
  } catch {
    /* 静默 */
  }
}

function setSwitch(el, on) {
  el.classList.toggle('on', on);
  el.setAttribute('aria-pressed', String(on));
}

document.addEventListener('DOMContentLoaded', async () => {
  fillI18n();

  const logo = document.getElementById('brand-logo');
  if (logo) logo.src = chrome.runtime.getURL('brand/logo.svg');

  // 当前活动标签
  let url = '';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    url = tab && tab.url ? tab.url : '';
  } catch {
    url = '';
  }

  const host = hostOf(url);
  const unsupported = isUnsupported(url);
  const isPdf = /\.pdf(?:[?#].*)?$/i.test(url);
  const isFile = /^file:\/\//i.test(url);

  const siteHostEl = document.getElementById('site-host');
  siteHostEl.textContent = host || (unsupported ? i18n('popup_unsupported_site') : url) || '—';

  const statEl = document.getElementById('stat');
  const statText = document.getElementById('stat-text');
  const swGlobal = document.getElementById('sw-global');
  const swSite = document.getElementById('sw-site');
  const listToggle = document.getElementById('list-toggle');
  const dlist = document.getElementById('dlist');

  let state = await loadState();

  function renderStat() {
    statEl.classList.remove('off', 'warn');
    if (unsupported || isPdf) {
      statEl.classList.add('warn');
      statText.textContent = i18n('popup_status_unsupported');
    } else if (state.global) {
      statEl.classList.add('off');
      statText.textContent = i18n('popup_status_global_off');
    } else if (host && state.sites.includes(host)) {
      statEl.classList.add('off');
      statText.textContent = i18n('popup_status_site_off');
    } else {
      statText.textContent = i18n('popup_status_running');
    }
  }

  function renderSwitches() {
    setSwitch(swGlobal, state.global);
    const siteOn = !!host && state.sites.includes(host);
    setSwitch(swSite, siteOn);
    // 无有效 host（chrome://、扩展页）→ 站点开关灰置
    swSite.disabled = !host;
  }

  function renderList() {
    dlist.innerHTML = '';
    if (state.sites.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = i18n('popup_list_empty');
      dlist.appendChild(empty);
      return;
    }
    for (const s of state.sites) {
      const row = document.createElement('div');
      row.className = 'row';
      const h = document.createElement('span');
      h.className = 'h';
      h.textContent = s;
      const rm = document.createElement('button');
      rm.setAttribute('aria-label', i18n('popup_remove') || 'Remove');
      rm.innerHTML =
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      rm.addEventListener('click', async () => {
        await setSite(s, false);
        state = await loadState();
        renderAll();
      });
      row.appendChild(h);
      row.appendChild(rm);
      dlist.appendChild(row);
    }
  }

  function renderAll() {
    renderStat();
    renderSwitches();
    renderList();
  }

  renderAll();

  // 提示：PDF / file://
  if (isPdf) document.getElementById('notice-pdf').classList.remove('hidden');
  if (isFile) {
    const fileNotice = document.getElementById('notice-file');
    if (chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
      chrome.extension.isAllowedFileSchemeAccess((allowed) => {
        if (!allowed) fileNotice.classList.remove('hidden');
      });
    } else {
      fileNotice.classList.remove('hidden');
    }
  }

  // 交互：全局开关（切换后当前活动标签会因 storage.onChanged 重载）
  swGlobal.addEventListener('click', async () => {
    const next = !swGlobal.classList.contains('on');
    await setGlobal(next);
    state = await loadState();
    renderAll();
  });

  // 交互：当前站点开关
  swSite.addEventListener('click', async () => {
    if (!host) return;
    const next = !swSite.classList.contains('on');
    await setSite(host, next);
    state = await loadState();
    renderAll();
  });

  // 禁用站点列表展开/收起
  listToggle.addEventListener('click', () => {
    const open = dlist.classList.toggle('open');
    listToggle.classList.toggle('open', open);
  });
});
