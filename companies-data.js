// فهرست ۳۹ شرکت توزیع نیروی برق + پرچم شرکت‌های همکار فعلی
const COMPANIES = [
  { slug: 'east-azerbaijan', label: 'شرکت توزیع نیروی برق استان آذربایجان شرقی', url: 'https://eaedc.ir', partner: false },
  { slug: 'tabriz', label: 'شرکت توزیع نیروی برق شهرستان تبریز', url: 'https://toztab.ir', partner: false },
  { slug: 'west-azerbaijan', label: 'شرکت توزیع نیروی برق استان آذربایجان غربی', url: 'https://waepd.ir', partner: true },
  { slug: 'ardabil', label: 'شرکت توزیع نیروی برق استان اردبیل', url: 'https://aped.ir', partner: false },
  { slug: 'isfahan', label: 'شرکت توزیع نیروی برق استان اصفهان', url: 'https://epedc.ir', partner: false },
  { slug: 'isfahan-city', label: 'شرکت توزیع نیروی برق شهرستان اصفهان', url: 'https://eepdc.ir', partner: false },
  { slug: 'alborz', label: 'شرکت توزیع نیروی برق استان البرز', url: 'https://aepdc.ir', partner: false },
  { slug: 'ilam', label: 'شرکت توزیع نیروی برق استان ایلام', url: 'https://bargh-ilam.ir', partner: false },
  { slug: 'bushehr', label: 'شرکت توزیع نیروی برق استان بوشهر', url: 'https://bedc.ir', partner: false },
  { slug: 'tehran', label: 'شرکت توزیع نیروی برق استان تهران', url: 'https://tvedc.ir', partner: true },
  { slug: 'tehran-bozorg', label: 'شرکت توزیع نیروی برق تهران بزرگ', url: 'https://tbtb.ir', partner: false },
  { slug: 'chaharmahal', label: 'شرکت توزیع نیروی برق استان چهارمحال و بختیاری', url: 'https://chb-edc.ir', partner: false },
  { slug: 'south-khorasan', label: 'شرکت توزیع نیروی برق استان خراسان جنوبی', url: 'https://skedc.ir', partner: false },
  { slug: 'razavi-khorasan', label: 'شرکت توزیع نیروی برق استان خراسان رضوی', url: 'https://kedc.ir', partner: false },
  { slug: 'mashhad', label: 'شرکت توزیع نیروی برق شهرستان مشهد', url: 'https://meedc.ir', partner: false },
  { slug: 'north-khorasan', label: 'شرکت توزیع نیروی برق استان خراسان شمالی', url: 'https://nkedc.ir', partner: false },
  { slug: 'khuzestan', label: 'شرکت توزیع نیروی برق استان خوزستان', url: 'https://kepdc.co.ir', partner: true },
  { slug: 'ahvaz', label: 'شرکت توزیع نیروی برق شهرستان اهواز', url: 'https://aepdco.ir', partner: true },
  { slug: 'zanjan', label: 'شرکت توزیع نیروی برق استان زنجان', url: 'https://zedc.ir', partner: false },
  { slug: 'semnan', label: 'شرکت توزیع نیروی برق استان سمنان', url: 'https://semepd.ir', partner: false },
  { slug: 'sistan-baluchestan', label: 'شرکت توزیع نیروی برق استان سیستان و بلوچستان', url: 'https://sbepdc.ir', partner: false },
  { slug: 'fars', label: 'شرکت توزیع نیروی برق استان فارس', url: 'https://farsedc.ir', partner: false },
  { slug: 'shiraz', label: 'شرکت توزیع نیروی برق شهرستان شیراز', url: 'https://shirazedc.co.ir', partner: false },
  { slug: 'qazvin', label: 'شرکت توزیع نیروی برق استان قزوین', url: 'https://qazvin-ed.co.ir', partner: false },
  { slug: 'qom', label: 'شرکت توزیع نیروی برق استان قم', url: 'https://qepd.co.ir', partner: true },
  { slug: 'kurdistan', label: 'شرکت توزیع نیروی برق استان کردستان', url: 'https://kurdelectric.ir', partner: true },
  { slug: 'south-kerman', label: 'شرکت توزیع نیروی برق جنوب استان کرمان', url: 'https://sked.co.ir', partner: false },
  { slug: 'north-kerman', label: 'شرکت توزیع نیروی برق شمال استان کرمان', url: 'https://nked.co.ir', partner: false },
  { slug: 'kermanshah', label: 'شرکت توزیع نیروی برق استان کرمانشاه', url: 'https://kpedc.ir', partner: false },
  { slug: 'kohgiluyeh', label: 'شرکت توزیع نیروی برق استان کهگیلویه و بویراحمد', url: 'https://kbepdco.ir', partner: false },
  { slug: 'golestan', label: 'شرکت توزیع نیروی برق استان گلستان', url: 'https://ped-golestan.ir', partner: false },
  { slug: 'gilan', label: 'شرکت توزیع نیروی برق استان گیلان', url: 'https://gilanpdc.ir', partner: false },
  { slug: 'lorestan', label: 'شرکت توزیع نیروی برق استان لرستان', url: 'https://ledc.ir', partner: false },
  { slug: 'mazandaran', label: 'شرکت توزیع نیروی برق استان مازندران', url: 'https://maztozi.ir', partner: false },
  { slug: 'west-mazandaran', label: 'شرکت توزیع نیروی برق غرب مازندران', url: 'https://bargh-gmaz.ir', partner: false },
  { slug: 'markazi', label: 'شرکت توزیع نیروی برق استان مرکزی', url: 'https://mpedc.ir', partner: true },
  { slug: 'hormozgan', label: 'شرکت توزیع نیروی برق استان هرمزگان', url: 'https://site.hedc.co.ir', partner: false },
  { slug: 'hamedan', label: 'شرکت توزیع نیروی برق استان همدان', url: 'https://edch.ir', partner: true },
  { slug: 'yazd', label: 'شرکت توزیع نیروی برق استان یزد', url: 'https://yed.co.ir', partner: false },
];

function findCompany(slug){
  return COMPANIES.find(c => c.slug === slug) || null;
}

function getCompanyParam(){
  return new URLSearchParams(window.location.search).get('company');
}
