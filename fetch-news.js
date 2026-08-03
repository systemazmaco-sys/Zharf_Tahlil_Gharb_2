const Parser = require('rss-parser');
const fs = require('fs');
const parser = new Parser();

async function fetchGlobalCryptoNews() {
  // جستجوی اخبار مربوط به ماینر و استخراج رمزارز از منابع معتبر جهانی
  const query = encodeURIComponent('crypto mining OR asic miner OR bitcoin mining');
  const googleNewsUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

  try {
    console.log('Fetching news from Google News...');
    const feed = await parser.parseURL(googleNewsUrl);
    
    // دریافت ۱۰ خبر جدید
    const latestNews = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source || 'Google News'
    }));

    // ذخیره خروجی در فایل news.json
    fs.writeFileSync('news.json', JSON.stringify(latestNews, null, 2), 'utf-8');
    console.log('اخبار با موفقیت دریافت و به‌روزرسانی شد!');
  } catch (error) {
    console.error('خطا در دریافت اخبار:', error);
    process.exit(1);
  }
}

fetchGlobalCryptoNews();
