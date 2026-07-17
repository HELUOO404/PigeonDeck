// 通用：把一个本地 HTML 的某个元素按 2x 截成 PNG。
// 用法：node scripts/shot-html.mjs <htmlPath> <width> <height> <out.png> [selector=.stage]
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const HTML = path.resolve(process.argv[2]);
const W = parseInt(process.argv[3] || '1080', 10);
const H = parseInt(process.argv[4] || '1440', 10);
const OUT = path.resolve(process.argv[5] || 'out.png');
const SEL = process.argv[6] || '.stage';
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.goto(`file://${HTML}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.locator(SEL).screenshot({ path: OUT });
console.log('wrote', OUT);
await browser.close();
