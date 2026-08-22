import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const root = process.cwd()
const font = fs.readFileSync(
  path.join(root, 'src/assets/fonts/Geist-Variable.woff2')
).toString('base64')
const image = fs.readFileSync(
  path.join(root, 'public/landing/editor-hero-desktop-hardened.png')
).toString('base64')
const output = path.join(root, 'public/landing/social-preview.png')

const html = `<!doctype html><style>
@font-face{font-family:Geist;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900;font-display:block}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}body{background:#edf2f0;color:#17211e;font-family:Geist,"Helvetica Neue",system-ui,sans-serif;-webkit-font-smoothing:antialiased}.frame{position:relative;display:grid;grid-template-columns:500px 1fr;gap:62px;align-items:center;width:100%;height:100%;padding:54px 58px}.copy{align-self:center}.brand{display:flex;align-items:center;gap:10px;margin-bottom:62px;font-size:17px;font-weight:720;letter-spacing:-.025em}.mark{display:grid;place-items:center;width:36px;height:36px;border-radius:4px;background:#14796f;color:#f7fffd}.mark svg{width:19px;height:19px}.eyebrow{margin:0 0 16px;color:#14796f;font-size:11px;font-weight:720;letter-spacing:.075em;text-transform:uppercase}.title{margin:0;max-width:480px;font-size:68px;font-weight:650;letter-spacing:-.057em;line-height:.91}.lede{margin:24px 0 0;max-width:440px;color:#56635e;font-size:17px;line-height:1.55}.stage{position:relative;overflow:hidden;border:1px solid #9eafa9;background:#dfe7e4;padding:45px 22px 20px;box-shadow:0 20px 44px rgba(31,52,45,.12)}.meta{position:absolute;inset:16px 18px auto;display:flex;justify-content:space-between;color:#56635e;font-size:9px;font-weight:680;letter-spacing:.06em;text-transform:uppercase}.stage img{display:block;width:100%;height:auto;border:1px solid #bccbc6;background:#f8fbfa;box-shadow:0 18px 42px rgba(31,52,45,.14)}.edge{position:absolute;left:58px;right:58px;bottom:30px;height:1px;background:#9eafa9}
</style><main class="frame"><section class="copy"><div class="brand"><span class="mark"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M248 92.68a15.86 15.86 0 0 0-4.69-11.31l-68.68-68.69a16 16 0 0 0-22.63 0l-28.43 28.43-58 21.77a16.06 16.06 0 0 0-10.22 12.35L32.11 214.68A8 8 0 0 0 40 224a8.4 8.4 0 0 0 1.32-.11l139.44-23.24a16 16 0 0 0 12.35-10.17l21.77-58L243.31 104A15.87 15.87 0 0 0 248 92.68Zm-69.87 92.19L63.32 204l47.37-47.37a28 28 0 1 0-11.32-11.32L52 192.7 71.13 77.86 126 57.29 198.7 130ZM112 132a12 12 0 1 1 12 12 12 12 0 0 1-12-12Zm96-15.32L139.31 48l24-24L232 92.68Z"/></svg></span><span>Presume</span></div><p class="eyebrow">Local-first resume workbench</p><h1 class="title">Your resume should stay yours.</h1><p class="lede">Edit the finished Letter page directly. Keep constraints visible. Export a stable PDF.</p></section><figure class="stage"><div class="meta"><span>Working editor crop</span><span>Sample resume</span></div><img src="data:image/png;base64,${image}" width="980" height="855" alt=""></figure><div class="edge"></div></main>`

const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  await page.setContent(html)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('img').evaluate(element => element.decode())
  const result = await page.evaluate(() => ({
    font: document.fonts.check('16px Geist'),
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }))
  if (!result.font || result.width !== 1200 || result.height !== 630) {
    throw new Error(`Invalid social preview geometry: ${JSON.stringify(result)}`)
  }
  await page.screenshot({ path: output })
  console.log(`Wrote ${path.relative(root, output)} (${result.width}x${result.height})`)
} finally {
  await browser.close()
}
