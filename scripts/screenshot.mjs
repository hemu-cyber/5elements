import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // 1. Desktop 1440px width
    console.log('Capturing Desktop 1440px...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
    // Allow fonts and animations to settle
    await new Promise((r) => setTimeout(r, 1000));
    const desktopPath = path.join(OUTPUT_DIR, 'phase0-desktop-1440.png');
    await page.screenshot({ path: desktopPath, fullPage: false });
    console.log('Saved:', desktopPath);

    // 2. Mobile 390px width (iPhone 14/15 standard)
    console.log('Capturing Mobile 390px...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1000));
    const mobilePath = path.join(OUTPUT_DIR, 'phase0-mobile-390.png');
    await page.screenshot({ path: mobilePath, fullPage: false });
    console.log('Saved:', mobilePath);

    console.log('Screenshots completed successfully!');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
