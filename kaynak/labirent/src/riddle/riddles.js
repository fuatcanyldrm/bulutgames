export const RIDDLES = [
  {
    question: 'Gündüzleri kapılarını açar, geceleri kapatır; ne mum ne de ateş, ama her evde bulunur. Nedir?',
    answer: 'göz',
    options: ['Göz', 'Kapı', 'Pencere', 'El'],
  },
  {
    question: 'Dağlardan doğar, vadilerden geçer; hiç yürümez ama hep akar. Nedir?',
    answer: 'nehir',
    options: ['Nehir', 'Rüzgar', 'Yol', 'Gölge'],
  },
  {
    question: 'Ne kadar çok alırsan o kadar çok bırakırsın. Nedir?',
    answer: 'ayak izi',
    options: ['Ayak izi', 'Gölge', 'Fotoğraf', 'Delik'],
  },
  {
    question: 'Konuşur ama dili yok, yüzü var ama gözü yok. Nedir?',
    answer: 'ayna',
    options: ['Ayna', 'Resim', 'Kitap', 'Saat'],
  },
  {
    question: 'Uçabilir ama kanadı yok, ağlayabilir ama gözü yok. Nedir?',
    answer: 'bulut',
    options: ['Bulut', 'Kuş', 'Balon', 'Duman'],
  },
  {
    question: 'Herkes önünde durur, kimse arkasında. Nedir?',
    answer: 'gelecek',
    options: ['Gelecek', 'Geçmiş', 'Ayna', 'Yol'],
  },
  {
    question: 'Kırılgan ama sesi çok güçlü; düşünceyle de kırılabilir. Nedir?',
    answer: 'sessizlik',
    options: ['Sessizlik', 'Cam', 'Zil', 'Müzik'],
  },
  {
    question: 'Ejderhanın nefesi gibi sıcak, ama elinle tutamazsın. Nedir?',
    answer: 'ateş',
    options: ['Ateş', 'Buz', 'Su', 'Rüzgar'],
  },
  {
    question: 'Bir adımı vardır ama yürüyemez; herkes ona basar ama o kıpırdamaz. Nedir?',
    answer: 'merdiven',
    options: ['Merdiven', 'Köprü', 'Kapı', 'Sandalye'],
  },
  {
    question: 'Karanlıkta parlar, gündüzde saklanır; büyücüler onunla yol bulur. Nedir?',
    answer: 'yıldız',
    options: ['Yıldız', 'Ay', 'Güneş', 'Meşale'],
  },
];

export function getRandomRiddle() {
  const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
  return {
    ...riddle,
    shuffledOptions: shuffle([...riddle.options]),
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeAnswer(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function checkAnswer(riddle, userAnswer) {
  const normalized = normalizeAnswer(userAnswer);
  if (!normalized) return false;
  return normalized === normalizeAnswer(riddle.answer);
}
