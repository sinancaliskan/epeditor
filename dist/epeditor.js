/* Entegre Pro Editör : epeditor.js */
/* Kullanımı : $('.editorum').EPEditor({
  autoSave: true, 
  autoSaveTriggerLength: 5,
  restoreIfExists: true
});

 Get Data : $('#editorum')[0].getData();
 Set Data : $('#editorum')[0].setData('<div>www.entegre.pro</div>');

 Copyright : Sinan ÇALIŞKAN 2025

*/
(function($) {
  $.fn.EPEditor = function(userOptions) {	  
  
  function markdownToHtml(md) {
  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/\n/g, '<br />');
}
function htmlToMarkdown(html) {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '') // en son kalan tag'leri temizle
    .trim();
}


    return this.each(function() {      
      this.setData = function(content) {
        const editorId = 'epeditor_' + this.id;
        const editor = document.getElementById(editorId);
        if (!editor) return;

        const wrapper = editor.closest('.epeditor-wrapper');
        const mdView = wrapper.querySelector('.ep-md-view');
        const mdBtn = wrapper.querySelector('[data-cmd="toggleMarkdown"]');
        const codeBtn = wrapper.querySelector('[data-cmd="viewSource"]');

        // İçeriğin Markdown olup olmadığını basit regex ile test et
const mdHint = content.trim().slice(0, 500);
const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(mdHint);
const isLikelyMarkdown = /(^#{1,3}\s|[*_`]{1,2}.+?[*_`]{1,2}|^\s*>|\n\s*\n)/m.test(mdHint);
const isMarkdown = isLikelyMarkdown && !hasHtmlTags;
        const isHtml = /<[^>]+>/g.test(content.trim());

        if (isMarkdown && mdView) {
          wrapper.querySelectorAll('.ep-btn:not([data-cmd="toggleMarkdown"])').forEach(btn => {
            btn.setAttribute('disabled', 'disabled');
            btn.classList.add('opacity-50');
          });
          if (mdBtn) {
            mdBtn.classList.add('bg-gray-300');
          }
          if (codeBtn) {
            codeBtn.classList.remove('bg-gray-300');
          }
          // Markdown moduna geç
          editor.style.display = 'none';
          editor.contentEditable = false;
          mdView.style.display = 'block';
          mdView.value = content;
          if (mdBtn) mdBtn.classList.add('bg-gray-300');
          if (codeBtn) codeBtn.classList.remove('bg-gray-300');
          return;
        }

        if (mdView && mdView.style.display === 'block') {
          mdView.value = content;
          return;
        }

        if (editor.dataset.viewsource === 'true') {
          const pre = editor.querySelector('pre');
          if (pre) pre.innerText = content;
        } else {
          editor.innerHTML = content;
        }
      };
      this.getData = function() {
        const editorId = 'epeditor_' + this.id;
        const editor = document.getElementById(editorId);
        if (!editor) return '';

        const mdView = editor.closest('.epeditor-wrapper').querySelector('.ep-md-view');
        if (mdView && mdView.style.display === 'block') {
          return mdView.value.trim(); // markdown modundaysa textarea içeriğini döndür
        }

        if (editor.dataset.viewsource === 'true') {
          const pre = editor.querySelector('pre');
          return pre ? pre.innerText.trim() : '';
        } else {
          return editor.innerHTML.trim();
        }
      };
      const textarea = this;	
  
      const defaultOptions = {
        autoSave: true,
        autoSaveKey: 'epeditor-autosave-' + textarea.id,
        autoSaveTriggerLength: 5,
        restoreIfExists: true
      };
      const options = Object.assign({}, defaultOptions, userOptions);
      const wrapper = document.createElement('div');
      wrapper.classList.add('epeditor-wrapper');
      textarea.parentNode.insertBefore(wrapper, textarea);
      textarea.style.display = 'none';

      const editorId = 'epeditor_' + textarea.id;

      createToolbar(wrapper, editorId, options);
      createEditor(wrapper, editorId, textarea.value);

      const editor = document.getElementById(editorId);

       wrapper.addEventListener('click', e => {
  if (e.target.closest('.ep-btn')) {
    const cmd = e.target.closest('.ep-btn').getAttribute('data-cmd');

    if (cmd === 'toggleMarkdown') {
  const mdBtn = wrapper.querySelector('[data-cmd="toggleMarkdown"]');
  const codeBtn = wrapper.querySelector('[data-cmd="viewSource"]');
  const mdView = wrapper.querySelector('.ep-md-view');

  if (editor.dataset.viewsource === 'true') {
    if (mdBtn) mdBtn.classList.remove('bg-gray-300');
    return;
  }

  if (!mdView) return;

  if (mdView.style.display === 'none') {
    wrapper.querySelectorAll('.ep-btn:not([data-cmd="toggleMarkdown"])').forEach(btn => {
      btn.setAttribute('disabled', 'disabled');
      btn.classList.add('opacity-50');
    });
    mdView.value = htmlToMarkdown(editor.innerHTML.trim());
    editor.style.display = 'none';
    editor.contentEditable = false;
    mdView.style.display = 'block';
    if (mdBtn) mdBtn.classList.add('bg-gray-300');
    if (codeBtn) codeBtn.classList.remove('bg-gray-300');
  } else {
    editor.innerHTML = markdownToHtml(mdView.value);
    wrapper.querySelectorAll('.ep-btn').forEach(btn => {
      btn.removeAttribute('disabled');
      btn.classList.remove('opacity-50');
    });
    mdView.style.display = 'none';
    editor.style.display = 'block';
    editor.contentEditable = true;
    if (mdBtn) mdBtn.classList.remove('bg-gray-300');
  }
  return;
}

    execCmd(editorId, cmd);
  }
});


      wrapper.querySelector('.ep-format').addEventListener('change', function() {
        execCmd(editorId, 'formatBlock', this.value);
      });

      editor.addEventListener('input', () => {
	  
        if (!editor.dataset.viewsource) {
    wrapper.querySelectorAll('.ep-btn:not([data-cmd="viewSource"])').forEach(btn => {
      btn.setAttribute('disabled', 'disabled');
      btn.classList.add('opacity-50');
    });
    if (codeBtn) codeBtn.classList.add('bg-gray-300');
    if (mdBtn) mdBtn.classList.remove('bg-gray-300');
          textarea.value = editor.innerHTML;
        } else {
          textarea.value = editor.textContent;
        }

        if (options.autoSave && textarea.value.length >= options.autoSaveTriggerLength) {
          localStorage.setItem(options.autoSaveKey, textarea.value);
          localStorage.setItem(options.autoSaveKey + '_hasDraft', 'true');
        }
      });

      function insertHtmlAtSelectionOrCursor(html) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  range.deleteContents(); // seçili metni sil

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const frag = document.createDocumentFragment();
  let node, lastNode;

  while ((node = temp.firstChild)) {
    lastNode = frag.appendChild(node);
  }

  range.insertNode(frag);

  // İmleci son eklenen öğenin sonrasına taşı
  if (lastNode) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
}

    editor.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');

  const wrapper = editor.closest('.epeditor-wrapper');
  const mdView = wrapper.querySelector('.ep-md-view');
  const mdBtn = wrapper.querySelector('[data-cmd="toggleMarkdown"]');
  const codeBtn = wrapper.querySelector('[data-cmd="viewSource"]');

  const isMarkdown = /(^#{1,3}\s|[*_`]|^\s*>|\n\n)/m.test(text.trim());

  if (editor.dataset.viewsource === 'true') {
    if (isMarkdown && mdView) {
      // Markdown moduna geçmeden önce kod görünümünü kapat
      delete editor.dataset.viewsource;
      delete editor.dataset.originalContent;
    wrapper.querySelectorAll('.ep-btn').forEach(btn => {
      btn.removeAttribute('disabled');
      btn.classList.remove('opacity-50');
    });
    wrapper.querySelectorAll('.ep-btn').forEach(btn => {
      btn.removeAttribute('disabled');
      btn.classList.remove('opacity-50');
    });
      editor.innerHTML = '';
      editor.style.display = 'none';
      editor.contentEditable = false;
      mdView.style.display = 'block';
      mdView.value = text;
    wrapper.querySelectorAll('.ep-btn:not([data-cmd="toggleMarkdown"])').forEach(btn => {
      btn.setAttribute('disabled', 'disabled');
      btn.classList.add('opacity-50');
    });
    if (mdBtn) {
      mdBtn.classList.add('bg-gray-300');
      mdBtn.classList.add('ring');
      mdBtn.classList.add('ring-blue-400');
    }
    if (codeBtn) {
      codeBtn.classList.remove('bg-gray-300');
      codeBtn.classList.remove('ring');
      codeBtn.classList.remove('ring-blue-400');
    }
      if (mdBtn) mdBtn.classList.add('bg-gray-300');
      if (codeBtn) codeBtn.classList.remove('bg-gray-300');
    } else {
      const encoded = htmlEncode(text);
      const formatted = formatHtml(encoded);
      const highlighted = colorizeHtml(formatted);
      const pre = editor.querySelector('pre');
      if (pre) insertHtmlAtSelectionOrCursor(highlighted);
    }
  } else if (isMarkdown && mdView) {
    editor.style.display = 'none';
    editor.contentEditable = false;
    mdView.style.display = 'block';
    mdView.value = text;
    if (mdBtn) mdBtn.classList.add('bg-gray-300');
    if (codeBtn) codeBtn.classList.remove('bg-gray-300');
  } else {
    insertHtmlAtSelectionOrCursor(text);
  }
});



      if (options.restoreIfExists && localStorage.getItem(options.autoSaveKey + '_hasDraft') === 'true') {
        const saved = localStorage.getItem(options.autoSaveKey);
        if (saved) {
          editor.innerHTML = saved;
          textarea.value = saved;
        }
      }

      // Fullscreen button
      const fullscreenBtn = document.createElement('button');      
	  fullscreenBtn.innerHTML  = '<i class="fa-solid fa-expand"></i>&nbsp;Tam Ekran';
      fullscreenBtn.title = "Düzenlemeyi Tam Ekranda Yap";
      fullscreenBtn.setAttribute('type', 'button');
      fullscreenBtn.className = 'px-3 py-1 btn btn-outline-primary ms-2 text-sm text-gray-700';
      fullscreenBtn.onclick = () => toggleFullScreen(wrapper);
      wrapper.querySelector('.ep-toolbar .btn-group').appendChild(fullscreenBtn);
    });
  };

  function createToolbar(container, editorId, options) {
    const toolbar = document.createElement('div');
    toolbar.className = 'btn-toolbar ep-toolbar mb-3';
    toolbar.role = 'toolbar';
    toolbar.innerHTML = `<div class="btn-group me-2" role="group">
        <button title="Geri Al" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="undo"><i class="fa-solid fa-rotate-left"></i></button>
        <button title="İleri Al" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="redo"><i class="fa-solid fa-rotate-right"></i></button>
        <button title="Koyu Yap" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="bold"><i class="fa-solid fa-bold"></i></button>
        <button title="Yatık Yap" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="italic"><i class="fa-solid fa-italic"></i></button>
        <button title="Altını Çiz" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="underline"><i class="fa-solid fa-underline"></i></button>
        <button title="Üstünü Çiz" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="strikeThrough"><i class="fa-solid fa-strikethrough"></i></button>
        <button title="Sola Yasla" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="justifyLeft"><i class="fa-solid fa-align-left"></i></button>
        <button title="Ortala" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="justifyCenter"><i class="fa-solid fa-align-center"></i></button>
        <button title="Sağa Yasla" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="justifyRight"><i class="fa-solid fa-align-right"></i></button>
        <button title="Madde İşaretli Liste" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="insertUnorderedList"><i class="fa-solid fa-list-ul"></i></button>
        <button title="Numaralı Liste" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="insertOrderedList"><i class="fa-solid fa-list-ol"></i></button>
        <button title="Metin / Kod Editörüne Geç" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="viewSource"><i class="fa-solid fa-code"></i></button>
        <button title="Markdown Görünüm" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="toggleMarkdown"><i class="fa-brands fa-markdown"></i></button>

	 </div>
      <div class="btn-group me-2 " role="group">
        <select title="Yazım Stili Değiştir" class="form-select ep-format px-2 py-1 border text-gray-700  hover:bg-gray-100 rounded text-sm">
          <option value=''>Stil</option>
          <option value='p'>Paragraf p</option>
          <option value='h1'>Başlık h1</option>
          <option value='h2'>Başlık h2</option>
          <option value='h3'>Başlık h3</option>          
        </select>
      </div>`;
    container.appendChild(toolbar);
  }

  function createEditor(container, editorId, content) {
    const editorContainer = document.createElement('div');
    editorContainer.className = 'epeditor-container';

    const editor = document.createElement('div');
    editor.id = editorId;
    editor.className = 'ep-editor';
    editor.contentEditable = true;
    editor.innerHTML = content || '';

    editorContainer.appendChild(editor);
    container.appendChild(editorContainer);
	const mdView = document.createElement('textarea');
mdView.className = 'ep-md-view';
mdView.style.display = 'none';
mdView.style.width = '100%';
mdView.style.height = '300px';
editorContainer.appendChild(mdView);

  }

  function execCmd(editorId, command, value = null) {
  const editor = document.getElementById(editorId);
  if (editor.querySelector('.ep-md-view')?.style.display === 'block') return; // ❌ Markdown modunda işlem yapma

  editor.focus();
  if (command === 'viewSource') {
    const wrapper = editor.closest('.epeditor-wrapper');
    const mdView = wrapper.querySelector('.ep-md-view');
    const codeBtn = wrapper.querySelector('[data-cmd="viewSource"]');
    const mdBtn = wrapper.querySelector('[data-cmd="toggleMarkdown"]');
    if (mdView && mdView.style.display === 'block') {
      if (codeBtn) codeBtn.classList.remove('bg-gray-300');
      return;
    } // Markdown modundayken kod görünümüne geçme

    toggleSourceView(editorId);
  } else {
    document.execCommand(command, false, value);
  }
}


   function minifyHTML(rawHtml) {
  // 1. Decode HTML entities (örn: &lt; → <)
  const textarea = document.createElement('textarea');
  textarea.innerHTML = rawHtml;
  const decodedHtml = textarea.value;

  // 2. Minify işlemi:
  const minified = decodedHtml
    .replace(/\n/g, '')                      // Satır sonlarını kaldır
    .replace(/\r/g, '')                      // Windows-style CR'leri kaldır
    .replace(/>\s+</g, '><')                 // Etiketler arası boşlukları sil
    .replace(/\s{2,}/g, ' ')                 // Çoklu boşlukları teke indir
    .replace(/^\s+|\s+$/g, '');              // Baştaki ve sondaki boşlukları sil

  return minified;
}

   
  function toggleSourceView(editorId) {
  const editor = document.getElementById(editorId);
  const wrapper = editor.closest('.epeditor-wrapper');
  const codeBtn = wrapper.querySelector('[data-cmd="viewSource"]');
  const mdBtn = wrapper.querySelector('[data-cmd="toggleMarkdown"]');

  if (!editor.dataset.viewsource) {
    editor.dataset.originalContent = editor.innerHTML;

    let raw = editor.innerHTML.trim();
    raw = raw.replace(/<div><br><\/div>/gi, '').trim();

    if (raw === '' || raw === '<br>' || raw === '<div><br></div>') {
      editor.innerHTML = '<pre class="ep-code-view" contenteditable="true"></pre>';
    } else {
      const encoded = htmlEncode(raw);
      const formatted = formatHtml(encoded);
      const highlighted = colorizeHtml(formatted);
      editor.innerHTML = '<pre class="ep-code-view" contenteditable="true">' + highlighted + '</pre>';
    }

    editor.dataset.viewsource = 'true';
    wrapper.querySelectorAll('.ep-btn:not([data-cmd="viewSource"])').forEach(btn => {
      btn.setAttribute('disabled', 'disabled');
      btn.classList.add('opacity-50');
    });
    if (codeBtn) codeBtn.classList.add('bg-gray-300');
    if (mdBtn) mdBtn.classList.remove('bg-gray-300');
  } else {
    let pre = editor.querySelector('pre');
    let code = pre ? pre.textContent : '';
    code = code.trim();
    if (code === '' || /^<[^>]*>\s*<\/[^>]*>$/.test(code)) {
      code = '';
    }
    code = minifyHTML(htmlDecode(code).trim());
    editor.innerHTML = code;
    delete editor.dataset.viewsource;
    delete editor.dataset.originalContent;
    wrapper.querySelectorAll('.ep-btn').forEach(btn => {
      btn.removeAttribute('disabled');
      btn.classList.remove('opacity-50');
    });
    if (codeBtn) codeBtn.classList.remove('bg-gray-300');
  }
}


    function toggleFullScreen(wrapper) {
      // todo : Buton Text "Tam Ekrandan Çık" olacak
    wrapper.classList.toggle('epeditor-fullscreen');
    const isFullscreen = wrapper.classList.contains('epeditor-fullscreen');
    if (isFullscreen) {
      wrapper.style.position = 'fixed';
      wrapper.style.top = '0';
      wrapper.style.left = '0';
      wrapper.style.width = '100vw';
      wrapper.style.height = '100vh';
      wrapper.style.zIndex = '9999';
      wrapper.style.backgroundColor = '#fff';
      wrapper.style.overflow = 'auto';
      const editor = wrapper.querySelector('.ep-editor');
      editor.style.height = 'calc(100% - 50px)';
      editor.style.overflow = 'auto';
    } else {
      wrapper.removeAttribute('style');
      const editor = wrapper.querySelector('.ep-editor');
      editor.removeAttribute('style');
    }
  }
  function htmlEncode(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
  }

  function htmlDecode(str) {
    return str.replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&');
  }

  function formatHtml(html, indentSize = 4) {
	  html = htmlDecode(html);
  const indentChar = ' '.repeat(indentSize);
  const lines = [];
  let indentLevel = 0;

  // HTML'yi etiketlere ayır
  const tokens = html
    .replace(/>\s+</g, '><') // Etiketler arası boşlukları temizle
    .replace(/</g, '\n<')    // Etiketlerin başına yeni satır koy
    .split('\n')
    .filter(line => line.trim() !== '');

  tokens.forEach((token) => {
    const trimmed = token.trim();

    // Kapanış etiketi
    if (trimmed.match(/^<\/.+>/)) {
      indentLevel = Math.max(indentLevel - 1, 0);
    }

    // Satırı girintile ve ekle
    lines.push(indentChar.repeat(indentLevel) + trimmed);

    // Açılış etiketi ama self-closing veya kapanış değilse indent artır
    if (
      trimmed.match(/^<[^!?/].*[^/]>$/) &&
      !trimmed.includes('</') &&
      !trimmed.startsWith('<!--')
    ) {
      indentLevel++;
    }
  });
  return htmlEncode(lines.join('\n'));
}

  function colorizeHtml(html) {
    return html.replace(/&lt;!--([\s\S]*?)--&gt;/g, match => {
        return `<span style="color:#6a9955;">${match}</span>`;
      })
      .replace(/(&lt;\/?\w+)([^&]*?)(&gt;)/g, (match, p1, p2, p3) => {
        return `<span style="color:#569cd6;">${p1}</span>` +
               `<span style="color:#9cdcfe;">${p2}</span>` +
               `<span style="color:#569cd6;">${p3}</span>`;
      });
  }
})(jQuery);
