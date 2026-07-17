// 渲染混合封面：headless chromium，deviceScaleFactor=2，按 .stage 精确裁剪导出 PNG。
// 用法：node scripts/shot-cover.mjs 3x4 assets/covers/pigeondeck-cover-3x4.png
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const A = process.argv[2] || '3x4';
const OUT = path.resolve(process.argv[3] || `assets/covers/pigeondeck-cover-${A}.png`);
const HTML = path.resolve('assets/covers/build/cover.html');
const size = A === '4x3' ? { width: 1440, height: 1080 } : { width: 1080, height: 1440 };
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2 });
await page.goto(`file://${HTML}?a=${A}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600); // webp 解码 + 字体上屏
await page.locator('.stage').screenshot({ path: OUT });
console.log('wrote', OUT);
await browser.close();
