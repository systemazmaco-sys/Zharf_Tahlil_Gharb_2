// Collects the latest Persian news about unauthorized cryptocurrency mining and
// writes the result to miner-news.json for the miner-detection section of the homepage.
//
// Run: node fetch-miner-news.js   (scheduled by .github/workflows/update-ai-news.yml)

const fs = require('fs');
const Parser = require('rss-parser');

const OUTPUT_FILE = 'miner-news.json';
const MAX_ITEMS = 8;
const MAX_ITEMS_PER_SOURCE = 3;
const MAX_AGE_DAYS = 180;

// All sources are general-purpose feeds, so only miner-related titles are kept.
const FEEDS = [
  { name: 'برق‌نیوز', url: 'https://barghnews.com/fa/rss/allnews', lang: 'fa', filter: true },
  { name: 'برق‌آب', url: 'https://barghab.ir/feed/', lang: 'fa', filter: true },
  { name: 'جست‌وجوی گوگل (ماینر)', url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('ماینر') + '&hl=fa&gl=IR&ceid=IR%3Afa', lang: 'fa', filter: true },
  { name: 'جست‌وجوی گوگل (استخراج غیرمجاز)', url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('استخراج غیرمجاز') + '&hl=fa&gl=IR&ceid=IR%3Afa', lang: 'fa', filter: true },
  { name: 'اقتصاد آنلاین', url: 'https://www.eghtesadonline.com/rss', lang: 'fa', filter: true },
  { name: 'مهر', url: 'https://www.mehrnews.com/rss', lang: 'fa', filter: true },
  { name: 'ایرنا', url: 'https://www.irna.ir/rss', lang: 'fa', filter: true },
  { name: 'ایسنا', url: 'https://www.isna.ir/rss', lang: 'fa', filter: true },
];

const MINER_KEYWORDS = [
  'ماینر', 'ماینینگ', 'ماین غیرمجاز', 'استخراج غیرمجاز', 'استخراج رمز',
  'کشف ماینر', 'دستگاه ماینر', 'رمزارز', 'رمز ارز', 'ارز دیجیتال', 'مصرف برق ماینر',
];

const parser = new Parser({
  timeout: 20000,
  headers: { 'User-Agent': 'zharftahlil-miner-news/1.0 (+https://zharftahlil.ir)' },
});

function matchesMiner(text) {
  const haystack = ' ' + String(text || '').toLowerCase() + ' ';
  return MINER_KEYWORDS.some(k => haystack.includes(k));
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(title) {
  return cleanText(title).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

// Google News wraps the publisher name into the title as "... - Publisher".
function splitGoogleTitle(title) {
  const parts = String(title).split(' - ');
  if (parts.length < 2) return { title: title, publisher: null };
  const publisher = parts.pop().trim();
  return { title: parts.join(' - ').trim(), publisher: publisher || null };
}

async function collectFeed(feed) {
  const parsed = await parser.parseURL(feed.url);
  const items = [];
  for (const item of parsed.items) {
    const isGoogleNews = feed.url.includes('news.google.com');
    const raw = cleanText(item.title);
    if (!raw || !item.link) continue;

    const { title, publisher } = isGoogleNews ? splitGoogleTitle(raw) : { title: raw, publisher: null };
    // Title-only match: matching the body as well pulls in unrelated stories
    // that merely mention mining in passing.
    if (feed.filter && !matchesMiner(title)) continue;
    const summary = cleanText(item.contentSnippet || item.content || '');

    const published = item.isoDate || item.pubDate || null;
    items.push({
      title: title,
      url: item.link,
      source: publisher || feed.name,
      lang: feed.lang,
      published: published ? new Date(published).toISOString() : null,
      summary: summary.slice(0, 220),
    });
  }
  return items;
}

async function main() {
  const results = await Promise.allSettled(FEEDS.map(collectFeed));

  const all = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`${FEEDS[i].name}: ${result.value.length} item(s)`);
      all.push(...result.value);
    } else {
      console.warn(`${FEEDS[i].name}: failed — ${result.reason && result.reason.message}`);
    }
  });

  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set();
  const perSource = new Map();
  const items = all
    .filter(item => !item.published || new Date(item.published).getTime() >= cutoff)
    .filter(item => {
      const key = normalizeTitle(item.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0))
    // Without a per-source cap a single high-volume feed fills the whole list.
    .filter(item => {
      const used = perSource.get(item.source) || 0;
      if (used >= MAX_ITEMS_PER_SOURCE) return false;
      perSource.set(item.source, used + 1);
      return true;
    })
    .slice(0, MAX_ITEMS);

  if (!items.length) {
    console.error('No miner news collected from any source — keeping the previous file.');
    process.exit(1);
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({ updated_at: new Date().toISOString(), items: items }, null, 2) + '\n',
    'utf-8'
  );
  console.log(`Wrote ${items.length} item(s) to ${OUTPUT_FILE}`);
}

main().catch(error => {
  console.error('Unexpected failure:', error);
  process.exit(1);
});
