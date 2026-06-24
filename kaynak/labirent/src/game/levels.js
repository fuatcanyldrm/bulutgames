export const LEVELS = [
  {
    level: 1,
    pieces: 10,
    cols: 5,
    rows: 2,
    timer: 60,
    mazeSize: 31,
    title: 'Ejderha Kalesi',
    theme: 'castle',
  },
  {
    level: 2,
    pieces: 25,
    cols: 5,
    rows: 5,
    timer: 90,
    mazeSize: 41,
    title: 'Büyülü Orman',
    theme: 'forest',
  },
  {
    level: 3,
    pieces: 50,
    cols: 10,
    rows: 5,
    timer: 120,
    mazeSize: 51,
    title: 'Sualtı Krallığı',
    theme: 'ocean',
  },
  {
    level: 4,
    pieces: 100,
    cols: 10,
    rows: 10,
    timer: 180,
    mazeSize: 61,
    title: 'Gökyüzü Şatosu',
    theme: 'sky',
  },
  {
    level: 5,
    pieces: 250,
    cols: 25,
    rows: 10,
    timer: 300,
    mazeSize: 81,
    title: 'Kozmik Taht',
    theme: 'cosmic',
  },
];

export function getLevelConfig(level) {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0];
}

export function getMaxLevel() {
  return LEVELS.length;
}

export function isFinalLevel(level) {
  return level >= getMaxLevel();
}
