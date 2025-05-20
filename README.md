# EPEditor v1.2

jQuery tabanlı, WYSIWYG + Markdown + HTML kod görünümü destekli gelişmiş editör.

## Özellikler
- Markdown toggle desteği
- HTML kod görünümü (syntax highlight)
- `getData()` ve `setData()` metodları
- Otomatik mod geçişi (`setData`, `paste`)
- Aktif moda göre toolbar yönetimi (buton devre dışı/görsel)

## Kullanım
```html
<textarea id="editorum" class="editorum"></textarea>

<script>
  $('.editorum').EPEditor({
    autoSave: true,
    autoSaveTriggerLength: 5,
    restoreIfExists: true
  });

  // veri alma
  const data = $('#editorum')[0].getData();

  // veri yükleme
  $('#editorum')[0].setData('<h1>Merhaba</h1>');
</script>
