/**
 * نماینده‌ی آنلاین مهندس سعیدی‌نژاد — دستیار گفت‌وگوی صفحه‌ی شرکت‌های توزیع.
 * پاسخ‌ها از پیش نوشته شده‌اند؛ هیچ سرویس هوش مصنوعی یا کلید API لازم نیست.
 * وابستگی: companies-data.js باید پیش از این فایل بارگذاری شود.
 */
(function () {
  'use strict';

  var CONFIG = {
    engineer: 'مهندس سعیدی‌نژاد',
    // نام نماینده‌ای که در گفت‌وگو حضور دارد.
    agentName: 'مهندس محمدی',
    // عکس نماینده؛ صفحه‌ها همگی در ریشه‌ی سایت هستند، پس مسیر نسبی کافی است.
    avatar: 'agent.jpg',
    // حق‌الزحمه‌ی کارشناسی هر دستگاه به ریال، با احتساب بیمه و مالیات.
    // اسکان و ایاب‌وذهاب جداگانه و بر عهده‌ی شرکت توزیع است.
    feePerDeviceRials: 18750000,
    maxAttachmentMB: 10,
    allowedAttachments: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    emailjs: {
      serviceId: 'service_q06nqsi',
      templateId: 'template_kpyh3xc',
      publicKey: 'ZZzvUoMsLgN4TEsI5',
      sdk: 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    },
    supabase: {
      url: 'https://fmjsfdfwjkaqxhyceeoq.supabase.co',
      key: 'sb_publishable_pTHiPE2P1V347aaFG0sFtw_dwncaRZE',
      table: 'service_requests',
      bucket: 'request-attachments',
      sdk: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
    }
  };

  var CSS = [
    '.ztg-bot,.ztg-bot *{box-sizing:border-box}',
    '.ztg-bot{position:fixed;bottom:20px;left:20px;z-index:9999;font-family:"Vazirmatn","IRANYekan",Tahoma,sans-serif;direction:rtl}',
    '.ztg-launcher{display:flex;align-items:center;gap:10px;background:#e0982f;color:#171008;border:none;border-radius:40px;',
    'padding:12px 18px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 10px 26px rgba(3,8,14,.45)}',
    '.ztg-launcher:hover{background:#f5b34a}',
    '.ztg-launcher svg{width:20px;height:20px;flex-shrink:0}',
    '.ztg-launcher img{width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(23,16,8,.35)}',
    '.ztg-badge{position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:#4fb3a8;border:2px solid #0a1420}',
    '.ztg-panel{display:none;flex-direction:column;width:370px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 110px);',
    'background:#0f1e30;border:1px solid #1e3450;border-radius:10px;overflow:hidden;box-shadow:0 24px 60px rgba(3,8,14,.6)}',
    '.ztg-bot.open .ztg-panel{display:flex}',
    '.ztg-bot.open .ztg-launcher{display:none}',
    '.ztg-head{display:flex;align-items:center;gap:11px;padding:14px 16px;background:#122438;border-bottom:1px solid #1e3450}',
    '.ztg-avatar{width:38px;height:38px;border-radius:50%;background:#0a1420;border:1px solid #8a6428;object-fit:cover;flex-shrink:0}',
    '.ztg-hero{align-self:center;text-align:center;padding:8px 0 2px}',
    '.ztg-hero img{width:88px;height:88px;border-radius:50%;object-fit:cover;border:2px solid #e0982f;box-shadow:0 8px 22px rgba(3,8,14,.55)}',
    '.ztg-hero b{display:block;margin-top:9px;font-size:15px;color:#f5b34a;font-weight:600}',
    '.ztg-title{flex:1;min-width:0;line-height:1.5}',
    '.ztg-title strong{display:block;font-size:13.5px;color:#e7edf5;font-weight:600}',
    '.ztg-title span{display:block;font-size:11px;color:#6d84a0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ztg-close{background:none;border:none;color:#9db0c7;font-size:22px;line-height:1;cursor:pointer;padding:2px 6px;font-family:inherit}',
    '.ztg-close:hover{color:#f5b34a}',
    '.ztg-log{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;display:flex;flex-direction:column;gap:10px;background:#0a1420}',
    '.ztg-msg{max-width:88%;padding:10px 13px;border-radius:10px;font-size:13.5px;line-height:1.85;white-space:pre-wrap;word-wrap:break-word}',
    '.ztg-msg.bot{align-self:flex-start;background:#122438;border:1px solid #1e3450;color:#e7edf5;border-bottom-right-radius:3px}',
    '.ztg-msg.me{align-self:flex-end;background:#8a6428;border:1px solid #e0982f;color:#fdf3e3;border-bottom-left-radius:3px}',
    '.ztg-msg.note{align-self:stretch;max-width:100%;background:rgba(79,179,168,.08);border:1px solid #4fb3a8;color:#7fd4c9;font-size:12.5px}',
    '.ztg-msg.warn{align-self:stretch;max-width:100%;background:rgba(198,91,78,.08);border:1px solid #c65b4e;color:#e08b7f;font-size:12.5px}',
    '.ztg-msg b{color:#f5b34a;font-weight:600}',
    '.ztg-msg a{color:#7fd4c9}',
    '.ztg-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:#122438;border:1px solid #1e3450;border-radius:10px}',
    '.ztg-typing i{width:6px;height:6px;border-radius:50%;background:#6d84a0;animation:ztg-blink 1.1s infinite}',
    '.ztg-typing i:nth-child(2){animation-delay:.18s}.ztg-typing i:nth-child(3){animation-delay:.36s}',
    '@keyframes ztg-blink{0%,60%,100%{opacity:.28}30%{opacity:1}}',
    '.ztg-foot{border-top:1px solid #1e3450;background:#0f1e30;padding:10px 12px}',
    '.ztg-options{display:flex;flex-wrap:wrap;gap:7px}',
    '.ztg-opt{background:#122438;border:1px solid #1e3450;color:#c9d7e8;border-radius:20px;padding:8px 13px;',
    'font-family:inherit;font-size:12.5px;cursor:pointer;text-align:right;line-height:1.6}',
    '.ztg-opt:hover{border-color:#e0982f;color:#f5b34a}',
    '.ztg-form{display:flex;gap:8px;align-items:center}',
    '.ztg-form input[type=text]{flex:1;min-width:0;background:#0a1420;border:1px solid #1e3450;border-radius:4px;',
    'padding:11px 12px;color:#e7edf5;font-family:inherit;font-size:14px;outline:none}',
    '.ztg-form input[type=text]:focus{border-color:#e0982f}',
    '.ztg-send{background:#e0982f;color:#171008;border:none;border-radius:4px;padding:11px 15px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer}',
    '.ztg-send:hover{background:#f5b34a}',
    '.ztg-send:disabled{opacity:.5;cursor:default}',
    '.ztg-file{flex:1;min-width:0;color:#9db0c7;font-size:12px;font-family:inherit}',
    '.ztg-file::file-selector-button{background:#122438;border:1px solid #1e3450;color:#c9d7e8;border-radius:4px;',
    'padding:8px 12px;margin-left:10px;font-family:inherit;font-size:12.5px;cursor:pointer}',
    '.ztg-code{display:block;margin-top:6px;font-size:17px;font-weight:700;color:#f5b34a;letter-spacing:.06em;direction:ltr;text-align:center}',
    '@media(max-width:640px){',
    '  .ztg-bot{bottom:14px;left:14px;right:14px}',
    '  .ztg-panel{width:100%;height:min(76vh,540px)}',
    '  .ztg-launcher{width:100%;justify-content:center}',
    /* 16px keeps iOS Safari from zooming in on focus */
    '  .ztg-form input[type=text]{font-size:16px}',
    '}',
    '@media(prefers-reduced-motion:reduce){.ztg-typing i{animation:none;opacity:.6}}'
  ].join('');

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/></svg>';
  var ICON_AGENT = '<svg viewBox="0 0 24 24" fill="none" stroke="#e0982f" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 3v6c0 4.6-3 8.2-7 11-4-2.8-7-6.4-7-11V5z"/><path d="M9 12l2 2 4-4"/></svg>';

  var FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  function toFa(value) {
    return String(value).replace(/\d/g, function (d) { return FA_DIGITS[+d]; });
  }

  function toEnDigits(value) {
    return String(value)
      .replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
      .replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
  }

  function money(rials) {
    return toFa(rials.toLocaleString('en-US')).replace(/,/g, '٬') + ' ریال';
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = function () { reject(new Error('load failed: ' + src)); };
      document.head.appendChild(el);
    });
  }

  function trackingCode() {
    var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    var tail = '';
    for (var i = 0; i < 4; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
    var now = new Date();
    var stamp = now.toLocaleDateString('en-US-u-ca-persian', { year: '2-digit', month: '2-digit' }).replace(/\D/g, '');
    return 'ZTG-' + stamp.slice(-4) + '-' + tail;
  }

  var DOCS_EXPERT = 'برای ثبت درخواست کارشناسی این موارد لازم است:\n' +
    '۱. معرفی‌نامه یا نامه‌ی رسمی شرکت توزیع با امضای واحد حراست\n' +
    '۲. شماره و شرح مختصر پرونده‌ی استخراج غیرمجاز\n' +
    '۳. تعداد و مدل دستگاه‌های توقیف‌شده\n' +
    '۴. محل نگهداری دستگاه‌ها و تاریخ پیشنهادی برای کارشناسی\n' +
    '۵. نام و شماره تماس کارشناس رابط در شرکت توزیع\n\n' +
    'اگر پرونده قضایی دارد، شماره‌ی پرونده و نام مرجع رسیدگی‌کننده هم کمک می‌کند.';

  var STEPS_EXPERT = 'روند کارشناسی چهار مرحله دارد:\n' +
    '۱. بررسی اولیه و هماهنگی با واحد حراست شرکت توزیع\n' +
    '۲. تخلیه‌ی فنی اطلاعات دستگاه بدون آسیب به تجهیزات\n' +
    '۳. تحلیل داده و تطبیق با ادعاها و مستندات پرونده\n' +
    '۴. تدوین گزارش کارشناسی قابل استناد در کمیسیون‌ها و مراجع قضایی';

  var DOCS_PARTNERSHIP = 'برای ثبت درخواست همکاری این موارد لازم است:\n' +
    '۱. نامه‌ی رسمی درخواست همکاری از سوی شرکت توزیع\n' +
    '۲. فایل «پیشنهاد نوع همکاری و مدل مالی قرارداد» پس از تکمیل\n' +
    '۳. نام و سمت فرد رابط و اطلاعات تماس مستقیم\n' +
    '۴. برآورد حجم پرونده‌های سالانه و بازه‌ی زمانی مدنظر\n\n' +
    'دو سند «شرح خدمات تخصصی» و «پیشنهاد نوع همکاری» در صفحه‌ی درخواست همکاری قابل دانلود است.';

  var FAQ = [
    {
      q: 'کارشناسی هر دستگاه چقدر طول می‌کشد؟',
      a: 'زمان دقیق به تعداد و مدل دستگاه‌ها بستگی دارد. تخلیه‌ی اطلاعات هر دستگاه معمولاً در همان روز اعزام انجام می‌شود و تدوین گزارش نهایی پس از تحلیل داده‌ها تحویل می‌گردد. برنامه‌ی زمانی دقیق در هماهنگی اولیه با واحد حراست تعیین می‌شود.'
    },
    {
      q: 'آیا دستگاه در جریان کارشناسی آسیب می‌بیند؟',
      a: 'خیر. روش تخلیه‌ی اطلاعات تخصصی و بدون آسیب به تجهیزات است و زنجیره‌ی مستندسازی در تمام مراحل حفظ می‌شود، تا گزارش در مراجع قضایی قابل استناد بماند.'
    },
    {
      q: 'گزارش شما در دادگاه قابل استناد است؟',
      a: 'بله. خروجی کار، گزارش کارشناسی مستند است که برای ارائه به کمیسیون‌های داخلی شرکت توزیع و مراجع قضایی تنظیم می‌شود. سوابق همکاری با توانیر و شرکت‌های توزیع در بخش مستندات سایت قابل مشاهده است.'
    },
    {
      q: 'اطلاعات پرونده محرمانه می‌ماند؟',
      a: 'بله. محرمانگی اطلاعات پرونده‌ها طبق ضوابط داخلی شرکت توزیع طرف همکاری رعایت می‌شود و هماهنگی هر مرحله از عملیات میدانی از طریق واحد حراست انجام می‌گیرد.'
    },
    {
      q: 'سوابق و توصیه‌نامه‌ها را کجا ببینم؟',
      a: 'در بخش «مستندات» صفحه‌ی اصلی سایت، تصویر نامه‌های رسمی توانیر و شرکت‌های توزیع به‌همراه شرح خدمات و طرح پیشنهاد همکاری قابل مشاهده و دانلود است.'
    }
  ];

  function Bot(company) {
    this.company = company;
    this.data = {};
    this.flow = null;
    this.step = 0;
    this.busy = false;
    this.build();
  }

  Bot.prototype.build = function () {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.className = 'ztg-bot';
    root.innerHTML =
      '<button class="ztg-launcher" type="button" aria-label="گفت‌وگو با نماینده‌ی ' + CONFIG.engineer + '">' +
        '<img src="' + CONFIG.avatar + '" alt="">' + '<span>گفت‌وگو با نماینده</span><span class="ztg-badge"></span>' +
      '</button>' +
      '<div class="ztg-panel" role="dialog" aria-label="گفت‌وگو با نماینده‌ی ' + CONFIG.engineer + '">' +
        '<div class="ztg-head">' +
          '<img class="ztg-avatar" src="' + CONFIG.avatar + '" alt="' + CONFIG.agentName + '">' +
          '<div class="ztg-title"><strong>' + CONFIG.agentName + '</strong><span></span></div>' +
          '<button class="ztg-close" type="button" aria-label="بستن گفت‌وگو">&times;</button>' +
        '</div>' +
        '<div class="ztg-log" id="ztgLog" aria-live="polite"></div>' +
        '<div class="ztg-foot" id="ztgFoot"></div>' +
      '</div>';
    document.body.appendChild(root);

    this.root = root;
    this.log = root.querySelector('#ztgLog');
    this.foot = root.querySelector('#ztgFoot');
    root.querySelector('.ztg-title span').textContent = 'نماینده‌ی ' + CONFIG.engineer;

    var self = this;
    root.querySelector('.ztg-launcher').addEventListener('click', function () { self.open(); });
    root.querySelector('.ztg-close').addEventListener('click', function () { self.close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('open')) self.close();
    });
  };

  Bot.prototype.open = function () {
    this.root.classList.add('open');
    if (!this.started) {
      this.started = true;
      this.greet();
    }
  };

  Bot.prototype.close = function () {
    this.root.classList.remove('open');
  };

  Bot.prototype.scroll = function () {
    this.log.scrollTop = this.log.scrollHeight;
  };

  Bot.prototype.push = function (text, kind) {
    var el = document.createElement('div');
    el.className = 'ztg-msg ' + (kind || 'bot');
    el.innerHTML = text;
    this.log.appendChild(el);
    this.scroll();
    return el;
  };

  Bot.prototype.me = function (text) {
    this.push(this.escape(text), 'me');
  };

  Bot.prototype.escape = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /** پیام ربات با مکث کوتاه، تا گفت‌وگو طبیعی خوانده شود. */
  Bot.prototype.say = function (text, kind) {
    var self = this;
    var dots = document.createElement('div');
    dots.className = 'ztg-typing';
    dots.innerHTML = '<i></i><i></i><i></i>';
    this.log.appendChild(dots);
    this.scroll();
    return new Promise(function (resolve) {
      setTimeout(function () {
        dots.remove();
        self.push(text, kind);
        resolve();
      }, Math.min(180 + String(text).length * 7, 900));
    });
  };

  Bot.prototype.clearFoot = function () {
    this.foot.innerHTML = '';
  };

  Bot.prototype.options = function (list) {
    var self = this;
    this.clearFoot();
    var wrap = document.createElement('div');
    wrap.className = 'ztg-options';
    list.forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ztg-opt';
      btn.textContent = item.label;
      btn.addEventListener('click', function () {
        self.me(item.label);
        self.clearFoot();
        item.run();
      });
      wrap.appendChild(btn);
    });
    this.foot.appendChild(wrap);
    this.scroll();
  };

  /** یک ورودی متنی می‌گیرد و پاسخ را به onValue می‌دهد. */
  Bot.prototype.ask = function (placeholder, onValue) {
    var self = this;
    this.clearFoot();
    var form = document.createElement('form');
    form.className = 'ztg-form';
    form.innerHTML =
      '<input type="text" placeholder="' + this.escape(placeholder) + '" autocomplete="off">' +
      '<button class="ztg-send" type="submit">ارسال</button>';
    this.foot.appendChild(form);
    var input = form.querySelector('input');
    input.focus();
    this.scroll();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = input.value.trim();
      if (!value) return;
      self.me(value);
      self.clearFoot();
      onValue(value);
    });
  };

  Bot.prototype.askFile = function (onFile) {
    var self = this;
    this.clearFoot();
    var form = document.createElement('form');
    form.className = 'ztg-form';
    form.innerHTML =
      '<input class="ztg-file" type="file" accept=".' + CONFIG.allowedAttachments.join(',.') + '">' +
      '<button class="ztg-send" type="submit">ادامه</button>';
    this.foot.appendChild(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var file = form.querySelector('input').files[0];
      self.me(file ? file.name : 'بدون پیوست');
      self.clearFoot();
      onFile(file || null);
    });
  };

  // ---------- اعتبارسنجی ----------

  Bot.prototype.checkName = function (value) {
    return value.replace(/\s/g, '').length >= 3
      ? null : 'نام و نام خانوادگی حداقل باید سه حرف باشد. لطفاً کامل بنویسید.';
  };

  Bot.prototype.checkPhone = function (value) {
    return /^09\d{9}$/.test(toEnDigits(value).replace(/[\s-]/g, ''))
      ? null : 'شماره تماس باید یک موبایل ۱۱ رقمی با شروع ۰۹ باشد. مثال: ۰۹۱۲۳۴۵۶۷۸۹';
  };

  Bot.prototype.checkCount = function (value) {
    var n = parseInt(toEnDigits(value).replace(/\D/g, ''), 10);
    return (n > 0 && n < 100000) ? null : 'تعداد دستگاه باید یک عدد صحیح بزرگ‌تر از صفر باشد.';
  };

  Bot.prototype.checkFile = function (file) {
    if (!file) return null;
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    if (CONFIG.allowedAttachments.indexOf(ext) === -1) {
      return 'فرمت این فایل پذیرفته نمی‌شود. فقط ' + CONFIG.allowedAttachments.join('، ').toUpperCase() + ' قابل ارسال است.';
    }
    if (file.size > CONFIG.maxAttachmentMB * 1024 * 1024) {
      return 'حجم فایل بیشتر از ' + toFa(CONFIG.maxAttachmentMB) + ' مگابایت است. لطفاً فایل کم‌حجم‌تری بفرستید.';
    }
    return null;
  };

  /** یک پرسش با اعتبارسنجی؛ تا وقتی ورودی معتبر نشود دوباره می‌پرسد. */
  Bot.prototype.askValid = function (question, placeholder, validate, onValue) {
    var self = this;
    this.say(question).then(function () {
      self.ask(placeholder, function step(value) {
        var problem = validate ? validate(value) : null;
        if (problem) {
          self.say(problem, 'warn').then(function () {
            self.ask(placeholder, step);
          });
          return;
        }
        onValue(value);
      });
    });
  };

  // ---------- گفت‌وگو ----------

  Bot.prototype.greet = function () {
    var self = this;
    var hero = document.createElement('div');
    hero.className = 'ztg-hero';
    hero.innerHTML = '<img src="' + CONFIG.avatar + '" alt="">' +
      '<b>' + CONFIG.agentName + '</b>';
    this.log.appendChild(hero);
    this.scroll();

    this.say('با عرض سلام و وقت بخیر، من ' + CONFIG.agentName + '، نماینده‌ی ' + CONFIG.engineer + ' هستم. هر سؤالی دارید من در خدمتم.')
      .then(function () {
        return self.say('می‌خواهید درباره‌ی نحوه‌ی ثبت درخواست کارشناسی یا همکاری کمکتان کنم؟ یا محاسبه‌ی میزان حق‌الزحمه‌ی کارشناسی به ازای هر دستگاه؟ و یا اگر پیغامی برای مهندس دارید بگویید تا به ایشان اطلاع بدهم.');
      })
      .then(function () { self.menu(); });
  };

  Bot.prototype.menu = function () {
    var self = this;
    this.options([
      { label: 'ثبت درخواست کارشناسی', run: function () { self.expertInfo(); } },
      { label: 'ثبت درخواست همکاری', run: function () { self.partnershipInfo(); } },
      { label: 'محاسبه‌ی حق‌الزحمه', run: function () { self.feeCalc(); } },
      { label: 'پیغام برای مهندس', run: function () { self.startFlow('message'); } },
      { label: 'سؤالات متداول', run: function () { self.faqMenu(); } }
    ]);
  };

  Bot.prototype.backMenu = function () {
    var self = this;
    this.options([
      { label: 'برگشت به منوی اصلی', run: function () { self.menu(); } }
    ]);
  };

  Bot.prototype.expertInfo = function () {
    var self = this;
    this.say(STEPS_EXPERT)
      .then(function () { return self.say(DOCS_EXPERT); })
      .then(function () {
        self.options([
          { label: 'همین‌جا درخواست را ثبت کن', run: function () { self.startFlow('expert'); } },
          { label: 'محاسبه‌ی حق‌الزحمه', run: function () { self.feeCalc(); } },
          { label: 'رفتن به فرم کامل', run: function () { self.goForm('expert-request.html'); } },
          { label: 'برگشت به منوی اصلی', run: function () { self.menu(); } }
        ]);
      });
  };

  Bot.prototype.partnershipInfo = function () {
    var self = this;
    this.say('چارچوب همکاری شامل ارائه‌ی خدمات کارشناسی و تخلیه‌ی اطلاعات، تنظیم گزارش قابل استناد، هماهنگی اجرا با واحد حراست، تعیین نحوه‌ی تسویه در جلسه‌ی فنی اولیه و حفظ محرمانگی اطلاعات پرونده‌ها است.')
      .then(function () { return self.say(DOCS_PARTNERSHIP); })
      .then(function () {
        self.options([
          { label: 'همین‌جا درخواست را ثبت کن', run: function () { self.startFlow('partnership'); } },
          { label: 'رفتن به فرم کامل', run: function () { self.goForm('partnership-request.html'); } },
          { label: 'برگشت به منوی اصلی', run: function () { self.menu(); } }
        ]);
      });
  };

  Bot.prototype.goForm = function (page) {
    var slug = this.company ? this.company.slug : '';
    window.location.href = page + (slug ? '?company=' + encodeURIComponent(slug) : '');
  };

  Bot.prototype.faqMenu = function () {
    var self = this;
    var list = FAQ.map(function (item) {
      return {
        label: item.q,
        run: function () {
          self.say(item.a).then(function () { self.faqMenu(); });
        }
      };
    });
    list.push({ label: 'برگشت به منوی اصلی', run: function () { self.menu(); } });
    this.options(list);
  };

  Bot.prototype.feeCalc = function () {
    var self = this;
    this.askValid(
      'حق‌الزحمه‌ی کارشناسی به‌ازای هر دستگاه <b>' + money(CONFIG.feePerDeviceRials) + '</b> است، با احتساب بیمه و مالیات. چند دستگاه مورد کارشناسی قرار می‌گیرد؟',
      'مثلاً ۱۲',
      function (v) { return self.checkCount(v); },
      function (value) {
        var count = parseInt(toEnDigits(value).replace(/\D/g, ''), 10);
        var total = count * CONFIG.feePerDeviceRials;
        self.say(
          'برای <b>' + toFa(count) + ' دستگاه</b>:\n' +
          toFa(count) + ' × ' + money(CONFIG.feePerDeviceRials) + ' = <b>' + money(total) + '</b>'
        ).then(function () {
          return self.say('این مبلغ حق‌الزحمه‌ی کارشناسی است. هزینه‌ی اسکان و ایاب‌وذهاب کارشناس جداگانه و بر عهده‌ی شرکت توزیع است و چون متغیر است، پس از انجام کار مشخص می‌شود.', 'note');
        }).then(function () {
          self.options([
            { label: 'ثبت درخواست کارشناسی', run: function () { self.data.deviceCount = String(count); self.startFlow('expert'); } },
            { label: 'محاسبه‌ی دوباره', run: function () { self.feeCalc(); } },
            { label: 'برگشت به منوی اصلی', run: function () { self.menu(); } }
          ]);
        });
      }
    );
  };

  // ---------- ثبت درخواست ----------

  Bot.prototype.startFlow = function (type) {
    var self = this;
    this.flow = type;
    if (!this.company && type !== 'message') {
      this.say('برای ثبت درخواست باید مشخص باشد از کدام شرکت توزیع تماس می‌گیرید. لطفاً از صفحه‌ی اصلی، شرکت خود را انتخاب کنید تا درخواست به نام همان شرکت ثبت شود.', 'warn')
        .then(function () {
          self.options([
            { label: 'رفتن به فهرست شرکت‌ها', run: function () { window.location.href = 'index.html#network'; } },
            { label: 'برگشت به منوی اصلی', run: function () { self.menu(); } }
          ]);
        });
      return;
    }
    this.askName();
  };

  Bot.prototype.askName = function () {
    var self = this;
    this.askValid('نام و نام خانوادگی شما؟', 'مثلاً علی رضایی',
      function (v) { return self.checkName(v); },
      function (value) { self.data.fullName = value; self.askRole(); });
  };

  Bot.prototype.askRole = function () {
    var self = this;
    this.say('سمت یا مسئولیت شما در شرکت توزیع؟').then(function () {
      self.ask('مثلاً کارشناس حراست', function (value) {
        self.data.role = value;
        self.askPhone();
      });
    });
  };

  Bot.prototype.askPhone = function () {
    var self = this;
    this.askValid('شماره تماس مستقیم شما؟', '۰۹xxxxxxxxx',
      function (v) { return self.checkPhone(v); },
      function (value) {
        self.data.phone = toEnDigits(value).replace(/[\s-]/g, '');
        if (self.flow === 'expert') self.askDeviceCount();
        else if (self.flow === 'partnership') self.askPartnershipNote();
        else self.askMessageText();
      });
  };

  Bot.prototype.askDeviceCount = function () {
    var self = this;
    if (this.data.deviceCount) { this.askModels(); return; }
    this.askValid('چند دستگاه مورد کارشناسی قرار می‌گیرد؟', 'مثلاً ۱۲',
      function (v) { return self.checkCount(v); },
      function (value) {
        self.data.deviceCount = toEnDigits(value).replace(/\D/g, '');
        self.askModels();
      });
  };

  Bot.prototype.askModels = function () {
    var self = this;
    this.say('مدل دستگاه‌ها را می‌دانید؟ اگر نه بنویسید «نامشخص».').then(function () {
      self.ask('مثلاً Antminer S21 Pro', function (value) {
        self.data.deviceModels = value;
        self.askLocation();
      });
    });
  };

  Bot.prototype.askLocation = function () {
    var self = this;
    this.say('دستگاه‌ها کجا نگهداری می‌شوند؟').then(function () {
      self.ask('آدرس یا محل تقریبی', function (value) {
        self.data.inspectionLocation = value;
        self.askDate();
      });
    });
  };

  Bot.prototype.askDate = function () {
    var self = this;
    this.say('تاریخ پیشنهادی شما برای اعزام کارشناس؟').then(function () {
      self.ask('مثلاً ۱۴۰۵/۰۵/۲۰', function (value) {
        self.data.inspectionDate = value;
        self.askAttachment();
      });
    });
  };

  Bot.prototype.askPartnershipNote = function () {
    var self = this;
    this.say('لطفاً زمینه‌ی همکاری و برآورد حجم پرونده‌های سالانه را کوتاه بنویسید.').then(function () {
      self.ask('مثلاً حدود ۸۰ پرونده در سال', function (value) {
        self.data.message = value;
        self.askAttachment();
      });
    });
  };

  Bot.prototype.askMessageText = function () {
    var self = this;
    this.say('پیغامتان برای ' + CONFIG.engineer + ' را بنویسید تا عیناً به ایشان برسانم.').then(function () {
      self.ask('متن پیغام', function (value) {
        self.data.message = value;
        self.submit();
      });
    });
  };

  Bot.prototype.askAttachment = function () {
    var self = this;
    var hint = this.flow === 'expert'
      ? 'اگر معرفی‌نامه یا نامه‌ی رسمی حراست را آماده دارید همین‌جا پیوست کنید؛ در غیر این صورت بدون انتخاب فایل ادامه بدهید.'
      : 'اگر فایل پیشنهاد همکاری تکمیل‌شده را دارید پیوست کنید؛ در غیر این صورت بدون انتخاب فایل ادامه بدهید.';

    this.say(hint + '\nفرمت‌های مجاز: ' + CONFIG.allowedAttachments.join('، ').toUpperCase() +
             ' — حداکثر ' + toFa(CONFIG.maxAttachmentMB) + ' مگابایت.').then(function () {
      self.askFile(function step(file) {
        var problem = self.checkFile(file);
        if (problem) {
          self.say(problem, 'warn').then(function () { self.askFile(step); });
          return;
        }
        self.data.file = file;
        self.confirm();
      });
    });
  };

  Bot.prototype.confirm = function () {
    var self = this;
    var d = this.data;
    var lines = ['<b>خلاصه‌ی درخواست شما</b>',
      'شرکت: ' + this.escape(this.companyLabel()),
      'نام: ' + this.escape(d.fullName),
      'تماس: ' + toFa(d.phone)];
    if (d.role) lines.push('سمت: ' + this.escape(d.role));
    if (d.deviceCount) {
      lines.push('تعداد دستگاه: ' + toFa(d.deviceCount));
      lines.push('برآورد حق‌الزحمه: ' + money(parseInt(d.deviceCount, 10) * CONFIG.feePerDeviceRials));
    }
    if (d.deviceModels) lines.push('مدل: ' + this.escape(d.deviceModels));
    if (d.inspectionLocation) lines.push('محل: ' + this.escape(d.inspectionLocation));
    if (d.inspectionDate) lines.push('تاریخ پیشنهادی: ' + this.escape(d.inspectionDate));
    if (d.message) lines.push('توضیحات: ' + this.escape(d.message));
    lines.push('پیوست: ' + (d.file ? this.escape(d.file.name) : 'ندارد'));

    this.say(lines.join('\n')).then(function () {
      self.options([
        { label: 'تأیید و ثبت نهایی', run: function () { self.submit(); } },
        { label: 'انصراف', run: function () { self.data = {}; self.menu(); } }
      ]);
    });
  };

  Bot.prototype.companySlug = function () {
    return this.company ? this.company.slug : 'unknown';
  };

  Bot.prototype.companyLabel = function () {
    return this.company ? this.company.label : 'نامشخص';
  };

  Bot.prototype.submit = function () {
    var self = this;
    if (this.busy) return;
    this.busy = true;
    this.clearFoot();

    var d = this.data;
    var code = trackingCode();
    var typeMap = { expert: 'expert', partnership: 'partnership', message: 'message' };
    var kind = typeMap[this.flow] || 'message';

    this.say('در حال ثبت درخواست…').then(function () {
      return Promise.all([
        window.emailjs ? Promise.resolve() : loadScript(CONFIG.emailjs.sdk),
        window.supabase ? Promise.resolve() : loadScript(CONFIG.supabase.sdk)
      ]);
    }).then(function () {
      emailjs.init({ publicKey: CONFIG.emailjs.publicKey });
      var sb = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);

      var upload = Promise.resolve('');
      if (d.file) {
        var path = self.companySlug() + '/' + Date.now() + '-' + d.file.name;
        upload = sb.storage.from(CONFIG.supabase.bucket).upload(path, d.file).then(function (res) {
          if (res.error) throw res.error;
          return sb.storage.from(CONFIG.supabase.bucket).getPublicUrl(path).data.publicUrl;
        });
      }

      return upload.then(function (attachmentUrl) {
        var note = [d.message || '', '[ثبت‌شده از طریق چت‌بات — کد پیگیری ' + code + ']']
          .filter(Boolean).join('\n');
        var payload = {
          request_type: kind,
          company_label: self.companyLabel(),
          full_name: d.fullName,
          role: d.role || '',
          phone: d.phone,
          device_count: d.deviceCount || '',
          device_models: d.deviceModels || '',
          inspection_date: d.inspectionDate || '',
          inspection_location: d.inspectionLocation || '',
          message: note,
          attachment_url: attachmentUrl,
          tracking_code: code
        };

        return emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, payload)
          .then(function () {
            return sb.from(CONFIG.supabase.table).insert({
              id: code,
              request_type: kind,
              company_slug: self.companySlug(),
              company_label: self.companyLabel(),
              full_name: d.fullName,
              role: d.role || '',
              phone: d.phone,
              device_count: d.deviceCount || '',
              device_models: d.deviceModels || '',
              inspection_date: d.inspectionDate || '',
              inspection_location: d.inspectionLocation || '',
              message: note,
              attachment_url: attachmentUrl
            });
          });
      });
    }).then(function () {
      return self.say('درخواست شما ثبت شد و به ' + CONFIG.engineer + ' اطلاع داده شد. کد پیگیری شما:' +
        '<span class="ztg-code">' + code + '</span>' +
        'لطفاً این کد را نگه دارید؛ در تماس‌های بعدی به آن استناد می‌شود.', 'note');
    }).catch(function (err) {
      console.error(err);
      return self.say('در ثبت درخواست خطایی پیش آمد. لطفاً دوباره تلاش کنید یا از طریق فرم کامل سایت اقدام کنید.', 'warn');
    }).then(function () {
      self.busy = false;
      self.data = {};
      self.flow = null;
      self.options([
        { label: 'برگشت به منوی اصلی', run: function () { self.menu(); } }
      ]);
    });
  };

  // ---------- راه‌اندازی ----------

  /** صفحه‌هایی که فهرست شرکت‌ها را جدا تعریف می‌کنند companies-data.js را بارگذاری نمی‌کنند. */
  function resolveCompany() {
    var slug = new URLSearchParams(window.location.search).get('company');
    if (!slug) return null;
    if (typeof findCompany === 'function') return findCompany(slug);
    if (typeof COMPANIES !== 'undefined' && Array.isArray(COMPANIES)) {
      return COMPANIES.filter(function (c) { return c.slug === slug; })[0] || null;
    }
    return null;
  }

  function start() {
    var company = resolveCompany();
    var bot = new Bot(company);

    // روی صفحه‌ی شرکت، گفت‌وگو به‌محض ورود باز می‌شود؛ یک‌بار در هر تب.
    // در صفحه‌های فرم باز نمی‌شود تا جلوی خود فرم را نگیرد.
    if (company && /(^|\/)province\.html$/.test(window.location.pathname)) {
      var key = 'ztg-greeted-' + company.slug;
      var seen = false;
      try { seen = sessionStorage.getItem(key) === '1'; } catch (e) { seen = false; }
      if (!seen) {
        try { sessionStorage.setItem(key, '1'); } catch (e) { /* حالت خصوصی مرورگر */ }
        setTimeout(function () { bot.open(); }, 900);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
