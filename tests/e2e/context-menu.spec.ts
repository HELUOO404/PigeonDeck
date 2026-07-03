/**
 * context-menu.spec.ts — 阶段 13b 右键菜单「快速标注」E2E
 *
 * 真实的浏览器原生右键菜单点击无法用 Playwright 触发，故此处覆盖
 * onClicked 之后的消息链路：后台 chrome.tabs.sendMessage(tabId,
 * {type:'pd-context-annotate'}) → 内容脚本 onMessage → controller.expand()
 * → 工具盘展开。菜单项创建 + onClicked 派发这段列为手动冒烟（见最终报告）。
 */

import { test, expect, BrowserContext } from '@playwright/test';
import {
  launchExtensionBrowser,
  startFixtureServer,
  waitForExtensionInjected,
  isShadowElVisible,
  TestServer,
} from './helpers/extension';

let context: BrowserContext;
let server: TestServer;

test.beforeAll(async () => {
  server = await startFixtureServer();
  const result = await launchExtensionBrowser();
  context = result.context;
});

test.afterAll(async () => {
  await context.close();
  await server.close();
});

test('后台发 pd-context-annotate → 内容脚本展开工具盘', async () => {
  const page = await context.newPage();
  await page.goto(`${server.baseUrl}/basic.html`);
  await waitForExtensionInjected(page);

  // 初始收起：工具盘不可见
  expect(await isShadowElVisible(page, 'pd-toolbar')).toBe(false);

  // 经后台向该标签页转发右键菜单消息（模拟 onClicked 之后的链路）
  const workers = context.serviceWorkers();
  expect(workers.length).toBeGreaterThan(0);
  const targetUrl = `${server.baseUrl}/basic.html`;
  await workers[0].evaluate(async (url) => {
    const tabs = await chrome.tabs.query({ url });
    for (const tab of tabs) {
      if (tab.id != null) {
        await chrome.tabs.sendMessage(tab.id, { type: 'pd-context-annotate' }).catch(() => {});
      }
    }
  }, targetUrl);

  // 工具盘展开可见
  await page.waitForFunction(
    () => {
      const host = document.getElementById('pd-host');
      const el = host?.shadowRoot?.querySelector<HTMLElement>('[data-testid="pd-toolbar"]');
      if (!el) return false;
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    },
    { timeout: 5000 }
  );
  expect(await isShadowElVisible(page, 'pd-toolbar')).toBe(true);

  await page.close();
});
