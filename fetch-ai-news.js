// Collects the latest artificial-intelligence news and research highlights from a
// mix of Persian tech media and international AI labs / outlets, and writes the
// result to ai-news.json for the "دستاوردهای هوش مصنوعی" section of the homepage.
//
// Run: node fetch-ai-news.js   (scheduled by .github/workflows/update-ai-news.yml)

const fs = require('fs');
const Parser = require('rss-parser');

const OUTPUT_FILE = 'ai-news.json';
const MAX_ITEMS = 12;
const MAX_ITEMS_PER_SOURCE = 3;
const MAX_AGE_DAYS = 45;

// `filter: true` means the feed is general-purpose, so only entries whose title
// matches AI_KEYWORDS are kept. Dedicated AI feeds are taken as-is.
const FEEDS = [
  { name: 'زومیت', url: 'https://www.zoomit.ir/feed/', lang: 'fa', filter: true },
  { name: 'دیجیاتو', url: 'https://digiato.com/feed', lang: 'fa', filter: true },
  { name: 'Google Discover (AI)', url: 'https://news.google.com/rss/search?q=%22%D9%87%D9%88%D8%B4%20%D9%85%D8%B5%D9%86%D9%88%D8%B9%DB%8C%22&hl=fa&gl=IR&ceid=IR%3Afa', lang: 'fa', filter: true },
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', lang: 'en', filter: false },
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml', lang: 'en', filter: false },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', lang: 'en', filter: false },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', lang: 'en', filter: false },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', lang: 'en', filter: false },
];

const AI_KEYWORDS = [
  'هوش مصنوعی', 'یادگیری ماشین', 'یادگیری عمیق', 'شبکه عصبی', 'مدل زبانی',
  'چت‌بات', 'چت بات', 'رباتیک',
  'artificial intelligence', ' ai ', 'machine learning', 'deep learning',
  'neural network', 'llm', 'chatgpt', 'gemini', 'claude', 'openai', 'anthropic',
];

const parser = new Parser({
  timeout: 20000,
  headers: { 'User-Agent': 'zharftahlil-ai-news/1.0 (+https://zharftahlil.ir)' },
});

function matchesAI(text) {
  const haystack = ' ' + String(text || '').toLowerCase() + ' ';
  return AI_KEYWORDS.some(k => haystack.includes(k));
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
    // Title-only match: matching the body as well pulls in gadget stories that
    // merely mention AI in passing.
    if (feed.filter && !matchesAI(title)) continue;
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
    console.error('No AI news collected from any source — keeping the previous file.');
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
