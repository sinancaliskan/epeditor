# EPEditor

**Hafif, bağımlılıksız WYSIWYG HTML editör — jQuery ile çalışır.**

> © 2025–2026 Polar Bilgisayar Ltd. · [entegre.pro](https://entegre.pro)

---

## Özellikler

| Özellik | Açıklama |
|---|---|
| 3 Görünüm Modu | WYSIWYG · Kod (HTML) · Markdown |
| Syntax Highlight | Tag, attribute, class, href renklendirmesi |
| Kod Katlama | Code view'da ▼/▶ ile tag bloklarını aç/kapat |
| Undo / Redo | Kendi snapshot stack'i — Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z |
| AutoSave | localStorage'a otomatik kayıt, sayfa yenilenince geri yükle |
| Resim Ekleme | URL veya dosyadan (base64), clipboard Ctrl+V desteği |
| Bağlantı Ekleme | URL + metin + yeni sekmede aç seçeneği |
| Tablo Oluşturucu | Hover grid ile satır/sütun seç, thead + tbody üretir |
| Bul & Değiştir | Ctrl+F · Önceki/Sonraki · Değiştir · Tümünü Değiştir |
| Karakter/Kelime Sayacı | Editör altında anlık gösterim |
| XSS Koruması | DOMPurify entegrasyonu (opsiyonel) |
| Tam Ekran | Wrapper'ı viewport'a yayar, tüm modlar desteklenir |
| Responsive | Mobilde kompakt toolbar, butonlar otomatik küçülür |
| onChange Callback | İçerik değişince minify edilmiş HTML döner |

---

## Kurulum

```html
<!-- jQuery -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

<!-- Font Awesome (toolbar ikonları için) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

<!-- EPEditor -->
<link rel="stylesheet" href="EPEditor.css">
<script src="epeditor.js"></script>
```

XSS koruması kullanılacaksa DOMPurify de eklenmeli:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.5/purify.min.js"></script>
```

---

## Temel Kullanım

```html
<textarea id="myeditor">İlk içerik buraya</textarea>

<script>
  $('#myeditor').EPEditor();
</script>
```

---

## Seçenekler

```js
$('#myeditor').EPEditor({
  autoSave: true,                  // localStorage'a otomatik kaydet (varsayılan: true)
  autoSaveTriggerLength: 5,        // Kaç karakterden sonra kaydetsin (varsayılan: 5)
  restoreIfExists: true,           // Sayfa açılışında draft varsa geri yükle (varsayılan: true)
  sanitize: false,                 // DOMPurify ile XSS temizliği (varsayılan: false)
  wordCount: true,                 // Alt çubukta karakter/kelime sayacı (varsayılan: true)
  onChange: null                   // function(html) — içerik her değiştiğinde tetiklenir
});
```

### Örnek: onChange callback

```js
$('#myeditor').EPEditor({
  onChange: function(html) {
    console.log('Güncel HTML:', html);
    // Sunucuya göndermek, önizleme güncellemek vb.
  }
});
```

### Örnek: XSS korumalı kurulum

```js
$('#myeditor').EPEditor({
  sanitize: true  // DOMPurify yüklü olmalı
});
```

---

## API

### getData()

Editördeki içeriği **minify edilmiş HTML** olarak döndürür.

```js
const html = $('#myeditor')[0].getData();
// "<p>Merhaba <strong>dünya</strong></p>"
```

Markdown modundaysa ham markdown metni döner.

### setData(content)

Editöre içerik yükler. HTML veya Markdown otomatik algılanır.

```js
$('#myeditor')[0].setData('<h1>Başlık</h1><p>Paragraf</p>');

// Markdown da desteklenir
$('#myeditor')[0].setData('# Başlık\n\nParagraf metni');
```

---

## Görünüm Modları

### WYSIWYG
Varsayılan mod. Bold, italic, liste, hizalama, tablo, resim, bağlantı toolbar butonlarıyla kullanılır.

### Kod Görünümü (`</>`)
HTML kaynak kodu syntax highlight ile gösterilir. Her açılış tag'i ▼ butonu ile katlanabilir. WYSIWYG'e dönünce kod minify edilerek uygulanır.

### Markdown Görünümü (`MD`)
İçerik Markdown'a dönüştürülerek düzenlenebilir textarea'da gösterilir. WYSIWYG'e geri dönüldüğünde **orijinal HTML korunur** — Markdown dönüşümünden kayıp olmaz.

---

## Kısayollar

| Kısayol | İşlev |
|---|---|
| `Ctrl+Z` | Geri Al |
| `Ctrl+Y` / `Ctrl+Shift+Z` | İleri Al |
| `Ctrl+F` | Bul & Değiştir panelini aç/kapat |
| `Ctrl+V` | Metin veya resim yapıştır (clipboard resim → base64) |
| `ESC` | Açık modalı kapat |

---

## Tablo Oluşturucu

Toolbar'daki tablo ikonuna tıklayın. Hover ile satır/sütun seçin, tıklayarak ekleyin.

Üretilen HTML saf yapıdadır — inline stil içermez, kendi CSS'inizle stillendirebilirsiniz:

```html
<table>
  <thead>
    <tr><th>Başlık 1</th><th>Başlık 2</th></tr>
  </thead>
  <tbody>
    <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
  </tbody>
</table>
```

---

## Resim Ekleme

**URL ile:** Resim linki yapıştırın, anlık önizleme görünür.

**Dosyadan:** Dosya seçin, base64 olarak HTML'e gömülür — sunucu upload gerekmez.

**Clipboard:** Ekran görüntüsü veya kopyalanmış resmi Ctrl+V ile yapıştırın, otomatik base64'e dönüşür.

---

## XSS Koruması

`sanitize: true` ile DOMPurify aktif hale gelir. Bu seçenek şu noktalarda temizlik yapar:

- `setData()` ile dışarıdan gelen içerik
- Markdown modundan WYSIWYG'e geçiş
- Kod görünümünden WYSIWYG'e geçiş
- localStorage'dan geri yükleme

> **Not:** DOMPurify CDN'de yüklü değilse console'a uyarı yazılır ve sanitize atlanır.

---

## AutoSave

`autoSave: true` ile içerik her `autoSaveTriggerLength` karakterde bir localStorage'a yazılır.

`restoreIfExists: true` ile sayfa yenilendiğinde kaydedilmiş draft varsa otomatik yüklenir.

Draft'ı manuel temizlemek için:

```js
const key = 'epeditor-autosave-myeditor';
localStorage.removeItem(key);
localStorage.removeItem(key + '_hasDraft');
```

---

## Bağımlılıklar

| Kütüphane | Zorunlu | Açıklama |
|---|---|---|
| jQuery 3.x | ✅ | Plugin altyapısı |
| Font Awesome 6 | ✅ | Toolbar ikonları |
| DOMPurify 3.x | ⚠️ Opsiyonel | `sanitize: true` için gerekli |

---

## Lisans

**Ücretsiz Kullanım:** Kişisel projeler ve açık kaynak yazılımlarda serbesttir.

**Ticari Lisans:** Ticari ürün, SaaS veya kurumsal uygulamalarda kullanım için ayrı lisans gerekmektedir. Lisans ve fiyatlandırma bilgisi için [entegre.pro](https://entegre.pro) adresini ziyaret edin veya iletişime geçin.

---

## Versiyon Geçmişi

| Versiyon | Tarih | Notlar |
|---|---|---|
| v2.0 | 2026 | Tablo, Bul&Değiştir, Undo stack, onChange, XSS koruması, resim/link modal |
| v1.9 | 2025 | Yükseklik senkronizasyonu, scroll, syntax highlight |

---

*EPEditor — Entegre.pro · Polar Bilgisayar Ltd.*
