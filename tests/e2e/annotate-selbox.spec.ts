/**
 * annotate-selbox.spec.ts — 批注模式交互式选中框 E2E（阶段：统一选中件）
 *
 * 蓝图统一裁决：批注模式单击元素时，除弹出批注面板 + 落位号外，还叠加一个
 * 与移动模式完全一致的八向句柄选中框（.pd-selbox），句柄缩放并入该元素标注 +
 * 撤销历史。移动模式的选中框行为不受影响（见 move.spec.ts）。
 *
 * ① 批注模式单击元素 → pd-panel 打开 AND pd-selbox + 8 句柄出现
 * ② 拖句柄缩放 → 目标元素尺寸变大（并入标注/撤销历史）→ 撤销后复原
 * ③ 点击「已有标注」的元素 → 面板重开 AND 选中框再次出现
 *
 * 时序断言全部用轮询（waitForFunction / expect.poll）；句柄坐标先等稳定再拖，
 * 与 move.spec.ts 的 stableHandleCenter/dragHandle 一致，负载下更可靠。
 */

import { test, expect, BrowserContext, Page } from '@playwright/test';
import {
  launchExtensionBrowser,
  startFixtureServer,
  waitForExtensionInjected,
  clickShadowEl,
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

async function openFixturePage(): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`${server.baseUrl}/basic.html`);
  await waitForExtensionInjected(page);
  await page.evaluate(() => localStorage.removeItem('pigeondeck.pos'));
  await page.reload();
  await waitForExtensionInjected(page);
  return page;
}

/** 展开工具盘（自动进入批注模式） */
async function expandToolbar(page: Page): Promise<void> {
  await clickShadowEl(page, 'pd-ball');
  await page.waitForFunction(() => {
    const host = document.getElementById('pd-host');
    const tb = host?.shadowRoot?.querySelector<HTMLElement>('[data-testid="pd-toolbar"]');
    return !!tb && getComputedStyle(tb).display !== 'none';
  });
}

async function waitShadowTestId(page: Page, testId: string, timeout = 8000): Promise<void> {
  await page.waitForFunction(
    (id: string) => !!document.getElementById('pd-host')?.shadowRoot?.querySelector(`[data-testid="${id}"]`),
    testId,
    { timeout }
  );
}

async function shadowTestIdExists(page: Page, testId: string): Promise<boolean> {
  return page.evaluate((id: string) => {
    return !!document.getElementById('pd-host')?.shadowRoot?.querySelector(`[data-testid="${id}"]`);
  }, testId);
}

/** 滚动 #deco-strip 到视口上部并返回其中心视口坐标（留出下方空间给面板/拖拽） */
async function scrollDecoIntoView(page: Page): Promise<{ cx: number; cy: number }> {
  await page.evaluate(() => {
    const el = document.getElementById('deco-strip')!;
    const r = el.getBoundingClientRect();
    window.scrollBy(0, r.top - 120);
  });
  return page.evaluate(() => {
    const el = document.getElementById('deco-strip')!;
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  });
}

function decoHeight(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.getElementById('deco-strip');
    return el ? parseFloat(window.getComputedStyle(el).height) : -1;
  });
}

/**
 * 读取句柄中心坐标并等其稳定（连续两次读数一致）——与 move.spec.ts 同款：
 * selbox 定位后句柄位置在负载下可能延迟一帧，稳定后再拖，避免 mousedown 落空。
 */
async function stableHandleCenter(page: Page, dir: string): Promise<{ x: number; y: number }> {
  const read = (): Promise<{ x: number; y: number } | null> =>
    page.evaluate((d: string) => {
      const host = document.getElementById('pd-host');
      const h = host?.shadowRoot?.querySelector<HTMLElement>(`[data-testid="pd-handle-${d}"]`);
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, dir);

  let prev = await read();
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(50);
    const cur = await read();
    if (cur && prev && Math.abs(cur.x - prev.x) < 0.5 && Math.abs(cur.y - prev.y) < 0.5) {
      return cur;
    }
    prev = cur;
  }
  if (!prev) throw new Error(`handle ${dir} not found`);
  return prev;
}

/** 从句柄中心拖拽 (ddx,ddy)：hover→down→分段 move→up，负载下更可靠触发缩放 */
async function dragHandle(page: Page, dir: string, ddx: number, ddy: number): Promise<void> {
  const c = await stableHandleCenter(page, dir);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x + ddx / 2, c.y + ddy / 2, { steps: 8 });
  await page.mouse.move(c.x + ddx, c.y + ddy, { steps: 8 });
  await page.mouse.up();
}

// ============================================================
// 用例
// ============================================================

test('①  批注模式单击元素 → 面板 + selbox + 8 句柄同时出现', async () => {
  const page = await openFixturePage();
  await expandToolbar(page); // 批注模式（默认）

  const c = await scrollDecoIntoView(page);
  await page.mouse.click(c.cx, c.cy);

  // 面板与选中框同时出现
  await waitShadowTestId(page, 'pd-panel');
  await waitShadowTestId(page, 'pd-selbox');

  // 8 个句柄都在
  for (const dir of ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'ml', 'mr']) {
    const exists = await shadowTestIdExists(page, `pd-handle-${dir}`);
    expect(exists, `handle ${dir} should exist`).toBe(true);
  }

  await page.close();
});

test('②  批注模式拖句柄缩放 → 元素变大（入标注/历史）→ 撤销复原', async () => {
  const page = await openFixturePage();
  await expandToolbar(page);

  const c = await scrollDecoIntoView(page);
  await page.mouse.click(c.cx, c.cy);
  await waitShadowTestId(page, 'pd-panel');
  await waitShadowTestId(page, 'pd-selbox');

  const h0 = await decoHeight(page);
  expect(h0).toBeGreaterThan(0);

  // 拖右下角句柄放大（dy 影响高度）
  await dragHandle(page, 'br', 80, 80);

  // 高度变大（缩放即时生效 + 提交）
  await expect
    .poll(() => decoHeight(page), {
      timeout: 6000,
      message: `deco-strip height should grow beyond ${h0 + 20}`,
    })
    .toBeGreaterThan(h0 + 20);

  // 缩放并入 store → 位号出现（同移动模式）
  await expect
    .poll(() => shadowTestIdExists(page, 'pd-pin'), {
      timeout: 8000,
      message: 'pin should appear after annotate-mode resize commit',
    })
    .toBe(true);

  // 撤销 → 高度复原（点工具盘撤销按钮，会关面板；断言只看页面元素高度）
  await clickShadowEl(page, 'pd-btn-undo');
  await expect
    .poll(() => decoHeight(page), {
      timeout: 6000,
      message: 'deco-strip height should revert after undo',
    })
    .toBeLessThan(h0 + 12);

  await page.close();
});

test('③  点击已有标注的元素 → 面板重开且选中框再次出现', async () => {
  const page = await openFixturePage();
  await expandToolbar(page);

  const c = await scrollDecoIntoView(page);

  // 先建一条标注（填说明保存）→ 面板与选中框关闭
  await page.mouse.click(c.cx, c.cy);
  await waitShadowTestId(page, 'pd-panel');
  await page.keyboard.type('已有标注的元素');
  await clickShadowEl(page, 'pd-panel-save');
  await waitShadowTestId(page, 'pd-pin');
  // 保存后面板关闭 → 选中框随之消失
  await expect.poll(() => shadowTestIdExists(page, 'pd-selbox'), { timeout: 5000 }).toBe(false);

  // 再次单击同一（已标注）元素 → 面板重开 + 选中框再次出现
  await page.mouse.click(c.cx, c.cy);
  await waitShadowTestId(page, 'pd-panel');
  await expect
    .poll(() => shadowTestIdExists(page, 'pd-selbox'), {
      timeout: 5000,
      message: 'selbox should reappear when clicking an already-annotated element',
    })
    .toBe(true);

  await page.close();
});
