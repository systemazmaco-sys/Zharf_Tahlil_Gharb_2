// اسکریپت دریافت آخرین اخبار از سایت خبری توانیر و تبدیل به JSON
const fs = require('fs');
const cheerio = require('cheerio');

const SOURCE_URL = 'https://news.tavanir.org.ir/';
const OUTPUT_PATH = 'tavanir-news.json';
const MAX_ITEMS = 8;

async function main() {
  const res = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZharfTahlilBot/1.0)' },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const seen = new Set();
  const items = [];

  // لینک‌های خبر در سایت توانیر همیشه الگوی /news/<id>/<slug> دارند —
  // این پایدارترین راه برای پیدا کردن خبرهای واقعی است، مستقل از تغییرات ظاهری سایت
  $('a[href*="/news/"]').each((_, el) => {
    if (items.length >= MAX_ITEMS) return;
    const href = $(el).attr('href');
    if (!href) return;
    const match = href.match(/\/news\/(\d+)\//);
    if (!match) return;
    const id = match[1];
    if (seen.has(id)) return;

    let title = $(el).text().trim().replace(/\s+/g, ' ');
    if (!title || title.length < 8) return; // لینک‌های تزئینی/آیکونی را حذف کن

    const fullUrl = href.startsWith('http') ? href : new URL(href, SOURCE_URL).toString();
    seen.add(id);
    items.push({ id, title, url: fullUrl });
  });

  const output = {
    source: SOURCE_URL,
    updated_at: new Date().toISOString(),
    items,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Saved ${items.length} news items to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Failed to fetch Tavanir news:', err);
  process.exit(1);
});
