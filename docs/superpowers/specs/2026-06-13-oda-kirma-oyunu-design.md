# Oda Kırma Oyunu — MVP Tasarımı

**Tarih**: 2026-06-13
**Hedef kitle**: 9 yaşında çocuk
**Platform**: Web (tarayıcı), tek `index.html` dosyası

## Genel Bakış

Birinci şahıs (first-person) 3D oda içinde, oyuncu elinde kazma ile odadaki
eşyaları kırar. 60 saniyelik süre içinde ne kadar eşya kırdığı sayılır.

## Teknik Yaklaşım

- Tek `index.html` dosyası: HTML + CSS + JS bir arada
- Three.js, CDN üzerinden import (npm/build adımı yok)
- Fizik motoru kullanılmaz — kırılan parçalar için basit Euler integration
  (manuel velocity + gravity)

## Sahne Yapısı

- Kapalı oda: ~10x10 birim, taban + tavan + 4 duvar, düz renkli materyaller
- Kamera = oyuncu gözü (first-person), pointer-lock ile mouse bakış
- Kazma: kamera köşesinde sabit basit geometri (kutu/silindir kombinasyonu)

## Kırılabilir Objeler

~8-10 adet, basit geometrik şekillerle (BoxGeometry, CylinderGeometry,
SphereGeometry), odada dağınık yerleşim:

- Vazo (kırmızı silindir)
- Masa (kahverengi kutu)
- Sandalye (sarı kutu)
- Resim çerçevesi (duvara yapışık ince kutu)
- Lamba (mavi silindir+küre)
- Kutu/sandık (gri küp)

Her obje `userData.breakable = true` ile işaretlenir.

## Kontroller & Kırma Mekaniği

- **Hareket**: W/A/S/D, basit AABB sınır kontrolü ile oda içinde kalır
- **Bakış**: Mouse (pointer-lock API)
- **Sallama**: Sol click veya Space — kazma kısa animasyonla öne savrulur
- **Kırma tespiti**: Click anında kamera yönünde raycast, menzil ~3 birim.
  Menzildeki `breakable` obje kırılır
- **Geri bildirim**: Vuruşta kısa "thud" sesi (Web Audio osilatör, dosya
  gerekmez) + 100ms kamera shake efekti

## Kırılma Efekti

- Obje kırılınca orijinal mesh kaldırılır
- Yerine 6-10 küçük küp parçası (objenin rengiyle) spawn olur
- Her parça rastgele yön+hız ile fırlar, yerçekimi uygulanır
  (`velocity.y -= gravity * dt`)
- Zemine değince durur veya 2 saniye sonra fade-out + remove

## Süre, Skor & UI

- **Başlangıç ekranı**: "Başla" butonu — tıklayınca pointer-lock aktif olur,
  oyun başlar
- **HUD**: sol üst köşede `Süre: 00:60` ve `Skor: 0`, her kırılan objede
  skor +1
- **Süre bitince**: pointer-lock kapanır, overlay: "Oyun Bitti! Skorun:
  X / 10" + "Tekrar Oyna" butonu
- **Tekrar Oyna**: sahneyi resetler (objeler yeniden spawn, süre/skor
  sıfırlanır)

## Kapsam Dışı (MVP sonrası)

- Birden fazla oda / seviye geçişi
- Ses dosyaları (gerçek ses efektleri)
- Mobil/touch kontrolleri
- Gerçek fizik motoru (cannon.js / rapier)
