/**
 * popup.spec.ts — 阶段 13a Popup + 注入守卫 E2E
 *
 * ① 直接 goto chrome-extension://<id>/popup.html
 *    → 断言标题、状态条、全局/站点开关、禁用列表入口渲染（chrome.i18n 生效）
 * ② 设 storage pdDisabledGlobal=true 后新开夹具页 → 断言 #pd-host 未注入（守卫生效）
 *    并验证清除后重新注入（守卫按存储放行）
 *
 * 注：Popup 开关切换 → onChanged → 活动标签 location.reload() 的完整链路
 *    依赖真实 action 弹窗与活动标签联动，在 persistent-context 下不可靠断言，
 *    列为手动冒烟（见最终报告）；isPageDisabled 纯函数由 disable.test.ts 覆盖。
 */

import { test, expect, BrowserContext, Page } from '@playwright/test';
import {
  launchExtensionBrowser,
  startFixtureServer,
  waitForExtensionInjected,
  TestServer,
} from './helpers/extension';

let context: BrowserContext;
let extensionId: string;
let server: TestServer;

test.beforeAll(async () => {
  server = await startFixtureServer();
  const result = await launchExtensionBrowser();
  context = result.context;
  extensionId = result.extensionId;
});

test.afterAll(async () => {
  await resetStorage();
  await context.close();
  await server.close();
});

/** 清空 chrome.storage.local，避免禁用状态泄漏到其它测试 */
async function resetStorage(): Promise<void> {
  const workers = context.serviceWorkers();
  if (workers.length > 0) {
    await workers[0].evaluate(() => chrome.storage.local.clear());
  }
}

async function setStorage(obj: Record<string, unknown>): Promise<void> {
  const workers = context.serviceWorkers();
  if (workers.length > 0) {
    await workers[0].evaluate((o) => chrome.storage.local.set(o), obj);
  }
}

test.beforeEach(async () => {
  await resetStorage();
});

test('Popup 渲染 chrome.i18n 文案与开关', async () => {
  expect(extensionId, 'extensionId should be resolved').toBeTruthy();

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  await expect(page).toHaveTitle(/PigeonDeck/);

  // 状态条文本非空（chrome.i18n 填充）
  await expect(page.locator('#stat-text')).not.toBeEmpty();

  // 两个开关渲染
  await expect(page.locator('#sw-global')).toHaveCount(1);
  await expect(page.locator('#sw-site')).toHaveCount(1);

  // 开关标签非空
  const labels = page.locator('.pd-srow .k');
  await expect(labels).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    await expect(labels.nth(i)).not.toBeEmpty();
  }

  // 禁用列表入口 + logo 指向扩展内资源
  await expect(page.locator('#list-toggle .k')).not.toBeEmpty();
  const src = await page.locator('#brand-logo').getAttribute('src');
  expect(src).toContain('brand/logo.svg');

  await page.close();
});

test('禁用列表入口点击展开', async () => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  await expect(page.locator('#dlist')).not.toHaveClass(/open/);
  await page.locator('#list-toggle').click();
  await expect(page.locator('#dlist')).toHaveClass(/open/);
  // 空列表显示占位文案
  await expect(page.locator('#dlist .empty')).not.toBeEmpty();

  await page.close();
});

test('全局禁用时注入守卫跳过注入，清除后恢复注入', async () => {
  // 先确认正常注入
  const before = await context.newPage();
  await before.goto(`${server.baseUrl}/basic.html`);
  await waitForExtensionInjected(before);
  await before.close();

  // 设全局禁用 → 新开页面守卫跳过注入
  await setStorage({ pdDisabledGlobal: true });
  const disabled = await context.newPage();
  await disabled.goto(`${server.baseUrl}/basic.html`);
  // 轮询一段时间确认 #pd-host 始终未注入
  await disabled.waitForTimeout(1500);
  const injected = await disabled.evaluate(() => !!document.getElementById('pd-host'));
  expect(injected).toBe(false);
  await disabled.close();

  // 清除禁用 → 恢复注入
  await resetStorage();
  const after = await context.newPage();
  await after.goto(`${server.baseUrl}/basic.html`);
  await waitForExtensionInjected(after);
  await after.close();
});
