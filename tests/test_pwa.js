const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const http = require('http');
const fs = require('fs');

const ROOT = '/home/user/Game-1';
const MIME = { '.html': 'text/html', '.json': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(ROOT, urlPath === '/' ? '/index.html' : urlPath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  console.log('=== Manifest link + apple-touch-icon present in <head> ===');
  await page.goto(`http://localhost:${port}/looksmaxxing_dictionary.html`);
  await page.waitForTimeout(300);
  const manifestHref = await page.evaluate(() => document.querySelector('link[rel="manifest"]')?.getAttribute('href'));
  const appleIconHref = await page.evaluate(() => document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'));
  const appCapable = await page.evaluate(() => document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content'));
  console.log('manifest href:', manifestHref, '| apple-touch-icon href:', appleIconHref, '| apple-mobile-web-app-capable:', appCapable);

  console.log('=== Manifest actually fetches and parses as valid JSON over HTTP ===');
  const manifestResp = await page.evaluate(async () => {
    const r = await fetch('manifest.json');
    return { status: r.status, contentType: r.headers.get('content-type'), body: await r.json() };
  });
  console.log('Manifest fetch status:', manifestResp.status, '| name:', manifestResp.body.name, '| icons:', manifestResp.body.icons.length, '| start_url:', manifestResp.body.start_url);

  console.log('=== Manifest icons resolve to real, fetchable PNGs ===');
  for (const icon of manifestResp.body.icons) {
    const r = await page.evaluate(async (src) => {
      const res = await fetch(src);
      return { status: res.status, type: res.headers.get('content-type') };
    }, icon.src);
    console.log(icon.src, '->', r.status, r.type);
  }

  console.log('=== apple-touch-icon.png itself is fetchable ===');
  const appleIconResp = await page.evaluate(async (href) => {
    const r = await fetch(href);
    return r.status;
  }, appleIconHref);
  console.log('apple-touch-icon.png status:', appleIconResp);

  console.log('=== index.html redirect page also carries manifest + updated favicon/colors ===');
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForTimeout(500);
  const finalUrl = page.url();
  const indexManifest = await page.evaluate(() => document.querySelector('link[rel="manifest"]')?.getAttribute('href'));
  console.log('Redirected to:', finalUrl, '| index.html manifest link present:', !!indexManifest);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
  server.close();
})();
