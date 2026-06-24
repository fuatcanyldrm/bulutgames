# Cloudflare Pages — Bulut Games

## Panel ayarları (Workers & Pages → bulutgames → Settings → Builds)

| Alan | Değer |
|------|--------|
| Build command | `npm ci && npm run predeploy` |
| Build output directory | `public` |
| Deploy command | *(boş)* |

`predeploy` Labirent için Vite build alır, `public/` ve `oyunlar/labirent/` altına üretilmiş dosyaları yazar.

## Oyun yolları

| Oyun | URL |
|------|-----|
| Ana sayfa | `/` |
| Oda Kırma | `/oyunlar/oda-kirma/` |
| Labirent Puzzle | `/oyunlar/labirent/` |

Kaynak kod: `kaynak/labirent/` (build edilmez HTML değil).
