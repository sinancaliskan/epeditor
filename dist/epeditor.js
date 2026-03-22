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
(function ($) {
    // Sanitize yardımcı fonksiyonu — sanitize:true ise DOMPurify kullanır
    function epSanitize(html, opts) {
        if (!opts || !opts.sanitize) return html;
        if (typeof DOMPurify === 'undefined') {
            console.warn('EPEditor: sanitize:true ayarlandı ama DOMPurify yüklü değil. https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.5/purify.min.js');
            return html;
        }
        return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    }

    function updateToolbarState(wrapper, mode) {
        const allBtns = wrapper.querySelectorAll('.ep-btn');
        const markdownBtn = wrapper.querySelector('[data-cmd="toggleMarkdown"]');
        const codeBtn = wrapper.querySelector('[data-cmd="viewSource"]');

        allBtns.forEach(btn => {
            const isModeBtn = btn === markdownBtn || btn === codeBtn;
            if (mode === 'wysiwyg') {
                btn.removeAttribute('disabled');
                btn.classList.remove('opacity-50');
            } else {
                if (!isModeBtn) {
                    btn.setAttribute('disabled', 'disabled');
                    btn.classList.add('opacity-50');
                }
            }
        });

        if (markdownBtn) {
            markdownBtn.classList.toggle('bg-gray-300', mode === 'markdown');
        }
        if (codeBtn) {
            codeBtn.classList.toggle('bg-gray-300', mode === 'code');
        }
    }




    $.fn.EPEditor = function (userOptions) {

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


        return this.each(function () {
            this.setData = function (content) {
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


                if (isMarkdown && mdView) {
                    // setData ile markdown geldiğinde mevcut HTML'i yedekle
                    if (editor.innerHTML.trim()) {
                        editor.dataset.htmlBackup = editor.innerHTML;
                    }
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
                    const _opts = wrapper._epOptions || {};
                    editor.innerHTML = epSanitize(content, _opts);
                }
            };
            this.getData = function () {
                const editorId = 'epeditor_' + this.id;
                const editor = document.getElementById(editorId);
                if (!editor) return '';

                const wrapper = editor.closest('.epeditor-wrapper');
                const container = editor.closest('.epeditor-container');
                const mdView = wrapper.querySelector('.ep-md-view');

                if (mdView && mdView.style.display === 'block') {
                    return mdView.value.trim();
                }

                if (editor.dataset.viewsource === 'true') {
                    const pre = container.querySelector('pre.ep-code-view');
                    const raw = pre ? pre.textContent.trim() : '';
                    return raw ? minifyHTML(htmlDecode(raw)) : '';
                } else {
                    // Revize span'larını temizle — sadece içerik kalsın
                    const clone = editor.cloneNode(true);
                    clone.querySelectorAll('.ep-revize-span').forEach(span => {
                        span.replaceWith(document.createTextNode(span.textContent));
                    });
                    return minifyHTML(clone.innerHTML.trim());
                }
            };

            this.getRevize = function () {
                const editorId = 'epeditor_' + this.id;
                const editor = document.getElementById(editorId);
                if (!editor) return [];
                const result = [];
                editor.querySelectorAll('.ep-revize-span').forEach(span => {
                    result.push({
                        id: span.dataset.rvId,
                        text: span.textContent,
                        note: span.dataset.rvNote,
                        user: span.dataset.rvUser,
                        date: span.dataset.rvDate,
                        status: span.dataset.rvStatus || 'pending'
                    });
                });
                return result;
            };

            this.setRevize = function (revizeList) {
                // Revizeleri DOM'a uygula — mevcut span'ları temizle, sonra yeniden işaretle
                const editorId = 'epeditor_' + this.id;
                const editor = document.getElementById(editorId);
                if (!editor || !Array.isArray(revizeList)) return;
                // Önce varolan span'ları unwrap et
                editor.querySelectorAll('.ep-revize-span').forEach(span => {
                    span.replaceWith(document.createTextNode(span.textContent));
                });
                editor.normalize();
                // Her revize için text node'da ara ve span'a sar
                revizeList.forEach(rv => {
                    epMarkRevizeInDom(editor, rv);
                });
            };
            const textarea = this;

            const defaultOptions = {
                autoSave: true,
                autoSaveKey: 'epeditor-autosave-' + textarea.id,
                autoSaveTriggerLength: 5,
                restoreIfExists: true,
                sanitize: false,
                onChange: null,
                wordCount: true,
                revize: false,
                preview: false   // true veya { css: ['/extra.css'] } — preview butonunu aktif eder
            };
            const options = Object.assign({}, defaultOptions, userOptions);
            const wrapper = document.createElement('div');
            wrapper.classList.add('epeditor-wrapper');
            wrapper._epOptions = options;
            textarea.parentNode.insertBefore(wrapper, textarea);
            textarea.style.display = 'none';

            const editorId = 'epeditor_' + textarea.id;

            createToolbar(wrapper, editorId, options);
            createEditor(wrapper, editorId, epSanitize(textarea.value, options), options);

            const editor = document.getElementById(editorId);

            // Karakter/kelime sayacı
            let wordCountBar = null;
            if (options.wordCount) {
                wordCountBar = document.createElement('div');
                wordCountBar.className = 'ep-word-count';
                wordCountBar.innerHTML = '<span class="ep-wc-chars">0 karakter</span><span class="ep-wc-sep">·</span><span class="ep-wc-words">0 kelime</span>';
                wrapper.appendChild(wordCountBar);
                updateWordCount(editor, wordCountBar);
            }

            // Undo/Redo stack başlat
            initUndoStack(editor, wrapper);

            // Ctrl+F → Find & Replace
            editor.addEventListener('keydown', e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    showFindReplaceModal(editorId);
                }
            });

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
                            // Markdown'a GİRERKEN: mevcut HTML'i yedekle
                            editor.dataset.htmlBackup = editor.innerHTML;
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
                            // Markdown'dan ÇIKARKEN: yedek varsa geri yükle, yoksa dönüştür
                            if (editor.dataset.htmlBackup !== undefined) {
                                editor.innerHTML = epSanitize(editor.dataset.htmlBackup, options);
                                delete editor.dataset.htmlBackup;
                            } else {
                                editor.innerHTML = epSanitize(markdownToHtml(mdView.value), options);
                            }
                            updateToolbarState(wrapper, 'wysiwyg');
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


            wrapper.querySelector('.ep-format').addEventListener('change', function () {
                execCmd(editorId, 'formatBlock', this.value);
            });

            editor.addEventListener('input', () => {
                if (!editor.dataset.viewsource) {
                    textarea.value = editor.innerHTML;
                } else {
                    textarea.value = editor.textContent;
                }

                if (options.autoSave && textarea.value.length >= options.autoSaveTriggerLength) {
                    localStorage.setItem(options.autoSaveKey, textarea.value);
                    localStorage.setItem(options.autoSaveKey + '_hasDraft', 'true');
                }

                if (options.onChange && typeof options.onChange === 'function') {
                    options.onChange(minifyHTML(editor.innerHTML.trim()));
                }

                if (wordCountBar) {
                    updateWordCount(editor, wordCountBar);
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
                const wrapper = editor.closest('.epeditor-wrapper');
                const mdView = wrapper.querySelector('.ep-md-view');

                // Resim paste kontrolü — WYSIWYG modunda
                if (!editor.dataset.viewsource && !(mdView && mdView.style.display === 'block')) {
                    const items = (e.clipboardData || window.clipboardData).items;
                    if (items) {
                        for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf('image') !== -1) {
                                e.preventDefault();
                                const file = items[i].getAsFile();
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    const img = `<img src="${ev.target.result}" alt="" style="max-width:100%;height:auto;" />`;
                                    insertHtmlAtCursor(img);
                                };
                                reader.readAsDataURL(file);
                                return;
                            }
                        }
                    }
                }

                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');

                // 1) Markdown view açıksa
                if (mdView && mdView.style.display === 'block') {
                    const start = mdView.selectionStart ?? mdView.value.length;
                    const end = mdView.selectionEnd ?? mdView.value.length;
                    mdView.value = mdView.value.slice(0, start) + text + mdView.value.slice(end);
                    mdView.selectionStart = mdView.selectionEnd = start + text.length;
                    return;
                }

                // 2) Code view açıksa
                if (editor.dataset.viewsource === 'true') {
                    const pre = editor.querySelector('pre');
                    if (!pre) return;
                    try {
                        document.execCommand('insertText', false, text);
                    } catch {
                        insertHtmlAtCursor(htmlEncode(text));
                    }
                    return;
                }

                // 3) WYSIWYG: düz metin
                insertHtmlAtCursor(text);
            });




            if (options.restoreIfExists && localStorage.getItem(options.autoSaveKey + '_hasDraft') === 'true') {
                const saved = localStorage.getItem(options.autoSaveKey);
                if (saved) {
                    editor.innerHTML = epSanitize(saved, options);
                    textarea.value = saved;
                }
            }

            // Fullscreen button
            const fullscreenBtn = document.createElement('button');
            fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>&nbsp;<span class="ep-fs-text">Tam Ekran</span>';
            fullscreenBtn.title = "Düzenlemeyi Tam Ekranda Yap";
            fullscreenBtn.setAttribute('type', 'button');
            fullscreenBtn.className = 'ep-btn ep-fullscreen-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100';
            fullscreenBtn.onclick = () => toggleFullScreen(wrapper);
            wrapper.querySelector('.ep-toolbar .btn-group').appendChild(fullscreenBtn);

            // Info button
            const infoBtn = document.createElement('button');
            infoBtn.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
            infoBtn.title = "EPEditor Hakkında";
            infoBtn.setAttribute('type', 'button');
            infoBtn.className = 'ep-btn ep-info-btn';
            infoBtn.onclick = () => showAboutModal();
            wrapper.querySelector('.ep-toolbar .btn-group').appendChild(infoBtn);

            // Preview butonu
            if (options.preview) {
                const previewBtn = document.createElement('button');
                previewBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
                previewBtn.title = 'Önizleme (yeni pencere)';
                previewBtn.setAttribute('type', 'button');
                previewBtn.className = 'ep-btn ep-preview-btn';
                previewBtn.onclick = () => openPreview(editorId, options);
                wrapper.querySelector('.ep-toolbar .btn-group').appendChild(previewBtn);
            }

            // Revize butonu — sadece revize: true/object ise göster
            if (options.revize) {
                const isOperator = typeof options.revize === 'object' && options.revize.operator;

                if (!isOperator) {
                    // Revize modu: editör readonly
                    editor.contentEditable = 'false';
                    editor.style.cursor = 'default';
                    editor.style.userSelect = 'text';
                    // Tüm toolbar butonlarını disable et (revize butonları hariç)
                    wrapper.querySelectorAll('.ep-btn:not(.ep-revize-btn):not(.ep-revize-list-btn):not(.ep-fullscreen-btn):not(.ep-info-btn)').forEach(btn => {
                        btn.setAttribute('disabled', 'disabled');
                        btn.classList.add('opacity-50');
                    });
                    wrapper.querySelector('.ep-format')?.setAttribute('disabled', 'disabled');
                }

                const revizeBtn = document.createElement('button');
                revizeBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
                revizeBtn.title = isOperator ? 'Revizeleri Gör' : 'Revize Ekle (metin seçin)';
                revizeBtn.setAttribute('type', 'button');
                revizeBtn.className = 'ep-btn ep-revize-btn';
                revizeBtn.dataset.cmd = isOperator ? 'showRevizePanel' : 'addRevize';
                wrapper.querySelector('.ep-toolbar .btn-group').appendChild(revizeBtn);

                const revizeListBtn = document.createElement('button');
                revizeListBtn.innerHTML = '<i class="fa-solid fa-list-check"></i>';
                revizeListBtn.title = 'Revize Listesi';
                revizeListBtn.setAttribute('type', 'button');
                revizeListBtn.className = 'ep-btn ep-revize-list-btn';
                revizeListBtn.dataset.cmd = 'showRevizePanel';
                wrapper.querySelector('.ep-toolbar .btn-group').appendChild(revizeListBtn);

                // Operator modunda buton başlıklarını güncelle
                if (isOperator) {
                    revizeBtn.style.display = 'none'; // listBtn yeterli
                }

                // Tooltip container
                const tooltip = document.createElement('div');
                tooltip.className = 'ep-revize-tooltip';
                tooltip.style.display = 'none';
                document.body.appendChild(tooltip);
                wrapper._epRevizeTooltip = tooltip;
                wrapper._epIsOperator = isOperator;

                initRevizeTooltip(editor, tooltip);
            }
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
        <button title="Tablo Ekle" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="insertTable"><i class="fa-solid fa-table"></i></button>
        <button title="Bağlantı Ekle" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="insertLink"><i class="fa-solid fa-link"></i></button>
        <button title="Resim Ekle" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="insertImage"><i class="fa-solid fa-image"></i></button>
        <button title="Metin / Kod Editörüne Geç" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="viewSource"><i class="fa-solid fa-code"></i></button>
        <button title="Bul & Değiştir (Ctrl+F)" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100" data-cmd="findReplace"><i class="fa-solid fa-magnifying-glass"></i></button>
        <button title="Markdown Görünüm" type="button" class="ep-btn px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100 hide" data-cmd="toggleMarkdown"><i class="fa-brands fa-markdown"></i></button>

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
        const wrapper = editor.closest('.epeditor-wrapper');
        if (wrapper && wrapper.querySelector('.ep-md-view')?.style.display === 'block') return; // ❌ Markdown modunda işlem yapma

        editor.focus();
        if (command === 'viewSource') {
            const wrapper = editor.closest('.epeditor-wrapper');
            const mdView = wrapper.querySelector('.ep-md-view');
            const codeBtn = wrapper.querySelector('[data-cmd="viewSource"]');
            const mdBtn = wrapper.querySelector('[data-cmd="toggleMarkdown"]');
            if (mdView && mdView.style.display === 'block') {
                if (codeBtn) codeBtn.classList.remove('bg-gray-300');
                return;
            }
            toggleSourceView(editorId);
        } else if (command === 'insertImage') {
            showImageModal(editorId);
        } else if (command === 'insertLink') {
            showLinkModal(editorId);
        } else if (command === 'insertTable') {
            if (editor.dataset.viewsource === 'true') return;
            showTableModal(editorId);
        } else if (command === 'findReplace') {
            showFindReplaceModal(editorId);
        } else if (command === 'addRevize') {
            const _opts = wrapper._epOptions || {};
            if (!_opts.revize) return;
            showRevizeModal(editorId, _opts);
        } else if (command === 'showRevizePanel') {
            showRevizePanel(editorId);
        } else {
            document.execCommand(command, false, value);
        }
    }


    // ---- Kelime/Karakter Sayacı ----
    function updateWordCount(editor, bar) {
        const text = editor.innerText || editor.textContent || '';
        const chars = text.replace(/\s/g, '').length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        bar.querySelector('.ep-wc-chars').textContent = chars.toLocaleString('tr') + ' karakter';
        bar.querySelector('.ep-wc-words').textContent = words.toLocaleString('tr') + ' kelime';
    }

    // ---- Tablo Modal ----
    function showTableModal(editorId) {
        const editor = document.getElementById(editorId);
        const sel = window.getSelection();
        let savedRange = null;
        if (sel && sel.rangeCount > 0) savedRange = sel.getRangeAt(0).cloneRange();

        const existing = document.getElementById('ep-table-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'ep-table-modal';
        modal.innerHTML = `
            <div class="ep-modal-backdrop"></div>
            <div class="ep-modal-box">
                <div class="ep-modal-title"><i class="fa-solid fa-table"></i> Tablo Ekle<button class="ep-fr-close ep-modal-cancel" title="Kapat">&times;</button></div>
                <div class="ep-table-grid-wrap">
                    <div class="ep-table-grid" id="ep-tbl-grid"></div>
                    <div class="ep-table-grid-label" id="ep-tbl-label">1 × 1</div>
                </div>
                <div class="ep-modal-actions">
                    <button class="ep-modal-btn ep-modal-insert" id="ep-tbl-insert"><i class="fa-solid fa-check"></i> Ekle</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const COLS = 8, ROWS = 6;
        let selRow = 1, selCol = 1;
        const grid = modal.querySelector('#ep-tbl-grid');
        const label = modal.querySelector('#ep-tbl-label');
        grid.style.gridTemplateColumns = `repeat(${COLS}, 24px)`;

        for (let r = 1; r <= ROWS; r++) {
            for (let c = 1; c <= COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'ep-tbl-cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                grid.appendChild(cell);
            }
        }

        function highlight(r, c) {
            selRow = r; selCol = c;
            grid.querySelectorAll('.ep-tbl-cell').forEach(cell => {
                cell.classList.toggle('ep-tbl-cell-active',
                    parseInt(cell.dataset.r) <= r && parseInt(cell.dataset.c) <= c);
            });
            label.textContent = `${r} × ${c}`;
        }

        grid.addEventListener('mouseover', e => {
            const cell = e.target.closest('.ep-tbl-cell');
            if (cell) highlight(parseInt(cell.dataset.r), parseInt(cell.dataset.c));
        });

        grid.addEventListener('click', e => {
            const cell = e.target.closest('.ep-tbl-cell');
            if (cell) insertTable();
        });

        function insertTable() {
            let html = '<table><thead><tr>';
            for (let c = 0; c < selCol; c++) {
                html += `<th>Başlık ${c + 1}</th>`;
            }
            html += '</tr></thead><tbody>';
            for (let r = 0; r < selRow; r++) {
                html += '<tr>';
                for (let c = 0; c < selCol; c++) {
                    html += '<td>&nbsp;</td>';
                }
                html += '</tr>';
            }
            html += '</tbody></table><p><br></p>';
            if (savedRange) {
                const s = window.getSelection();
                s.removeAllRanges();
                s.addRange(savedRange);
            }
            insertHtmlAtCursor(html);
            closeModal();
        }

        function closeModal() { modal.remove(); }
        modal.querySelector('.ep-modal-backdrop').addEventListener('click', closeModal);
        modal.querySelector('.ep-modal-cancel').addEventListener('click', closeModal);
        modal.querySelector('#ep-tbl-insert').addEventListener('click', insertTable);
        modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
        highlight(1, 1);
    }

    // ---- Find & Replace ----
    function showFindReplaceModal(editorId) {
        const editor = document.getElementById(editorId);
        const existing = document.getElementById('ep-fr-modal');
        if (existing) { existing.remove(); return; } // toggle

        const modal = document.createElement('div');
        modal.id = 'ep-fr-modal';
        modal.innerHTML = `
            <div class="ep-fr-box">
                <div class="ep-fr-title"><i class="fa-solid fa-magnifying-glass"></i> Bul & Değiştir
                    <button class="ep-fr-close" title="Kapat">×</button>
                </div>
                <div class="ep-fr-row">
                    <input class="ep-modal-input" type="text" id="ep-fr-find" placeholder="Bul..." />
                    <button class="ep-modal-btn ep-modal-insert" id="ep-fr-prev" title="Önceki">‹</button>
                    <button class="ep-modal-btn ep-modal-insert" id="ep-fr-next" title="Sonraki">›</button>
                </div>
                <div class="ep-fr-row">
                    <input class="ep-modal-input" type="text" id="ep-fr-replace" placeholder="Değiştir..." />
                    <button class="ep-modal-btn ep-modal-insert" id="ep-fr-replace-one">Değiştir</button>
                    <button class="ep-modal-btn ep-modal-insert" id="ep-fr-replace-all">Tümünü</button>
                </div>
                <div class="ep-fr-status" id="ep-fr-status"></div>
            </div>
        `;
        // Find&Replace paneli body'e eklenir — wrapper layout'unu bozmaz
        const wrapper = editor.closest('.epeditor-wrapper');
        document.body.appendChild(modal);

        // Paneli wrapper'ın sağ üstüne pozisyonla
        function positionPanel() {
            const rect = wrapper.getBoundingClientRect();
            modal.querySelector('.ep-fr-box').style.cssText =
                `position:fixed;top:${rect.top + 8}px;right:${window.innerWidth - rect.right + 8}px;z-index:9999;`;
        }
        positionPanel();
        window.addEventListener('scroll', positionPanel, { passive: true });
        window.addEventListener('resize', positionPanel, { passive: true });

        let matches = [], currentIdx = 0;

        function clearHighlights() {
            // outerHTML yerine replaceWith kullan — daha güvenli
            editor.querySelectorAll('.ep-fr-highlight').forEach(el => {
                el.replaceWith(document.createTextNode(el.textContent));
            });
            // Bitişik text node'ları birleştir
            editor.normalize();
            matches = []; currentIdx = 0;
        }

        function findMatches() {
            clearHighlights();
            const term = modal.querySelector('#ep-fr-find').value;
            if (!term) return;
            const escaped = escapeRegex(term);

            const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
            const nodes = [];
            let node;
            while ((node = walker.nextNode())) nodes.push(node);

            nodes.forEach(textNode => {
                const parent = textNode.parentNode;
                if (parent.classList && parent.classList.contains('ep-fr-highlight')) return;
                const text = textNode.textContent;
                // Her node için yeni regex — lastIndex sorunu olmaz
                const regex = new RegExp(escaped, 'gi');
                if (!regex.test(text)) return;
                regex.lastIndex = 0;
                const frag = document.createDocumentFragment();
                let last = 0, m;
                while ((m = regex.exec(text)) !== null) {
                    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
                    const span = document.createElement('mark');
                    span.className = 'ep-fr-highlight';
                    span.textContent = m[0];
                    frag.appendChild(span);
                    last = regex.lastIndex;
                }
                if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
                parent.replaceChild(frag, textNode);
            });

            matches = Array.from(editor.querySelectorAll('.ep-fr-highlight'));
            updateStatus();
        }

        function escapeRegex(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function updateStatus() {
            const status = modal.querySelector('#ep-fr-status');
            if (!matches.length) {
                status.textContent = modal.querySelector('#ep-fr-find').value ? 'Bulunamadı' : '';
            } else {
                status.textContent = `${currentIdx + 1} / ${matches.length}`;
            }
        }

        function scrollTo(idx) {
            if (!matches.length) return;
            matches.forEach((m, i) => m.style.background = i === idx ? '#f59e0b' : '#fef08a');
            matches[idx].scrollIntoView({ block: 'nearest' });
            currentIdx = idx;
            updateStatus();
        }

        modal.querySelector('#ep-fr-find').addEventListener('input', () => { findMatches(); if (matches.length) scrollTo(0); });
        modal.querySelector('#ep-fr-next').addEventListener('click', () => {
            if (!matches.length) { findMatches(); }
            if (matches.length) scrollTo((currentIdx + 1) % matches.length);
        });
        modal.querySelector('#ep-fr-prev').addEventListener('click', () => {
            if (matches.length) scrollTo((currentIdx - 1 + matches.length) % matches.length);
        });
        modal.querySelector('#ep-fr-replace-one').addEventListener('click', () => {
            if (!matches.length) { findMatches(); }
            if (!matches.length) return;
            const replaceVal = modal.querySelector('#ep-fr-replace').value;
            matches[currentIdx].outerHTML = replaceVal;
            editor.normalize();
            if (editor._epSnapshot) editor._epSnapshot();
            matches = Array.from(editor.querySelectorAll('.ep-fr-highlight'));
            if (currentIdx >= matches.length) currentIdx = Math.max(0, matches.length - 1);
            if (matches.length) scrollTo(currentIdx);
            else updateStatus();
        });
        modal.querySelector('#ep-fr-replace-all').addEventListener('click', () => {
            if (!matches.length) findMatches();
            const replaceVal = modal.querySelector('#ep-fr-replace').value;
            editor.querySelectorAll('.ep-fr-highlight').forEach(el => { el.outerHTML = replaceVal; });
            editor.normalize();
            if (editor._epSnapshot) editor._epSnapshot();
            matches = []; currentIdx = 0;
            modal.querySelector('#ep-fr-status').textContent = 'Tümü değiştirildi';
        });

        function closeModal() {
            clearHighlights();
            modal.remove();
            window.removeEventListener('scroll', positionPanel);
            window.removeEventListener('resize', positionPanel);
        }
        modal.querySelector('.ep-fr-close').addEventListener('click', closeModal);
        modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
        setTimeout(() => modal.querySelector('#ep-fr-find').focus(), 50);
    }

    // ---- Undo/Redo Stack ----
    function initUndoStack(editor, wrapper) {
        const stack = [];
        let pos = -1;
        let ignoreNext = false;

        function snapshot() {
            const html = editor.innerHTML;
            if (pos >= 0 && stack[pos] === html) return;
            stack.splice(pos + 1);
            stack.push(html);
            if (stack.length > 100) stack.shift();
            else pos++;
        }

        function undo() {
            if (pos <= 0) return;
            pos--;
            ignoreNext = true;
            editor.innerHTML = stack[pos];
        }

        function redo() {
            if (pos >= stack.length - 1) return;
            pos++;
            ignoreNext = true;
            editor.innerHTML = stack[pos];
        }

        // İlk snapshot
        snapshot();

        // Dışarıdan çağrılabilir — find/replace gibi DOM değiştiren işlemler için
        editor._epSnapshot = snapshot;

        editor.addEventListener('input', () => {
            if (ignoreNext) { ignoreNext = false; return; }
            snapshot();
        });

        editor.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                redo();
            }
        });

        // Toolbar undo/redo butonlarını da bağla
        wrapper.addEventListener('click', e => {
            const cmd = e.target.closest('.ep-btn')?.dataset?.cmd;
            if (cmd === 'undo') { e.stopImmediatePropagation(); undo(); }
            if (cmd === 'redo') { e.stopImmediatePropagation(); redo(); }
        }, true); // capture phase — execCmd'den önce yakala
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


    // ---- Code View Fold Sistemi ----

    // Satırları parse edip her açılış-kapanış tag çiftini foldable bloğa çevir
    function buildFoldableCodeView(highlightedHtml) {
        const lines = highlightedHtml.split('\n');
        const result = [];
        const stack = [];
        const plainLines = lines.map(l => l.replace(/<[^>]+>/g, '').trim());

        // Sadece block-level elementler fold'lanabilir
        const BLOCK_TAGS = new Set([
            'div','section','article','main','aside','header','footer','nav',
            'ul','ol','li','dl','dt','dd',
            'table','thead','tbody','tfoot','tr','th','td','caption','colgroup',
            'form','fieldset','figure','figcaption','blockquote','details','summary',
            'dialog','template','head','body','html',
            'h1','h2','h3','h4','h5','h6','p','pre','address',
            'select','option','optgroup','datalist','textarea',
            'script','style','noscript','iframe','object','video','audio','picture','canvas','map'
        ]);

        // Self-closing / void elementler — bunlar asla fold'lanmaz
        const VOID_TAGS = new Set([
            'br','hr','img','input','link','meta','area','base','col',
            'embed','param','source','track','wbr'
        ]);

        for (let i = 0; i < lines.length; i++) {
            const plain = plainLines[i];

            // Kapanış tag mi?
            const isClose = /^&lt;\/([a-zA-Z][\w-]*)/.test(plain);
            const closeMatch = plain.match(/^&lt;\/([a-zA-Z][\w-]*)/);
            const closeTag = closeMatch ? closeMatch[1].toLowerCase() : null;

            // Açılış tag mi?
            const openTagMatch = plain.match(/^&lt;([a-zA-Z][\w-]*)/);
            const openTag = openTagMatch ? openTagMatch[1].toLowerCase() : null;
            const isSelfClosing = plain.match(/\/&gt;$/) || (openTag && VOID_TAGS.has(openTag));
            const isOpenBlock = openTag && BLOCK_TAGS.has(openTag) && !isSelfClosing && !isClose;

            if (isClose && stack.length > 0) {
                stack.pop();
            }

            if (isOpenBlock) {
                const blockId = 'epfold_' + i + '_' + Math.random().toString(36).slice(2, 6);
                result.push(
                    `<span class="ep-fold-toggle ep-fold-open" data-fold="${blockId}" title="Bloğu Kapat">▼</span>` +
                    lines[i] + '\n'
                );
                stack.push({ blockId, tag: openTag });
                result.push(`<span class="ep-fold-block" data-fold-block="${blockId}">`);
            } else if (isClose) {
                result.push(`</span>` + lines[i] + '\n');
            } else {
                result.push(lines[i] + '\n');
            }
        }

        while (stack.length > 0) {
            result.push('</span>');
            stack.pop();
        }

        return result.join('');
    }

    function attachFoldHandlers(pre) {
        pre.addEventListener('click', function (e) {
            const toggle = e.target.closest('.ep-fold-toggle');
            if (!toggle) return;
            e.preventDefault();
            e.stopPropagation();

            const blockId = toggle.dataset.fold;
            const block = pre.querySelector(`[data-fold-block="${blockId}"]`);
            if (!block) return;

            const isOpen = toggle.classList.contains('ep-fold-open');
            if (isOpen) {
                block.style.display = 'none';
                toggle.textContent = '▶';
                toggle.title = 'Bloğu Aç';
                toggle.classList.remove('ep-fold-open');
                toggle.classList.add('ep-fold-closed');
            } else {
                block.style.display = '';
                toggle.textContent = '▼';
                toggle.title = 'Bloğu Kapat';
                toggle.classList.remove('ep-fold-closed');
                toggle.classList.add('ep-fold-open');
            }
        });

        // Copy event — fold toggle karakterlerini temizle
        pre.addEventListener('copy', function (e) {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) return;

            const range = sel.getRangeAt(0);
            const frag = range.cloneContents();

            // fold-toggle span'larını kaldır
            frag.querySelectorAll('.ep-fold-toggle').forEach(t => t.remove());

            // fold-block wrapper'larını unwrap et
            frag.querySelectorAll('.ep-fold-block').forEach(block => {
                while (block.firstChild) block.parentNode.insertBefore(block.firstChild, block);
                block.remove();
            });

            e.clipboardData.setData('text/plain', frag.textContent);
            e.preventDefault();
        });
    }

    function toggleSourceView(editorId) {
        const editor = document.getElementById(editorId);
        const wrapper = editor.closest('.epeditor-wrapper');
        const container = editor.closest('.epeditor-container');
        const codeBtn = wrapper.querySelector('[data-cmd="viewSource"]');
        const mdBtn = wrapper.querySelector('[data-cmd="toggleMarkdown"]');

        if (!editor.dataset.viewsource) {
            editor.dataset.originalContent = editor.innerHTML;

            let raw = editor.innerHTML.trim();
            raw = raw.replace(/<div><br><\/div>/gi, '').trim();

            const pre = document.createElement('pre');
            pre.className = 'ep-code-view';
            pre.contentEditable = 'true';
            pre.dataset.codeViewFor = editorId;

            if (!(raw === '' || raw === '<br>' || raw === '<div><br></div>')) {
                const encoded = htmlEncode(raw);
                const formatted = formatHtml(encoded);
                const highlighted = colorizeHtml(formatted);
                const foldable = buildFoldableCodeView(highlighted);
                pre.innerHTML = foldable;
                attachFoldHandlers(pre);
            }

            // editor'ı gizle, pre'yi container'a ekle (markdown modundaki gibi)
            editor.style.display = 'none';
            container.appendChild(pre);
            editor.dataset.viewsource = 'true';

            wrapper.querySelectorAll('.ep-btn:not([data-cmd="viewSource"])').forEach(btn => {
                btn.setAttribute('disabled', 'disabled');
                btn.classList.add('opacity-50');
            });
            if (codeBtn) codeBtn.classList.add('bg-gray-300');
            if (mdBtn) mdBtn.classList.remove('bg-gray-300');
        } else {
            const pre = container.querySelector('pre.ep-code-view');

            // fold toggle ve block'ları temizle
            if (pre) {
                pre.querySelectorAll('.ep-fold-toggle').forEach(t => t.remove());
                pre.querySelectorAll('.ep-fold-block').forEach(block => {
                    block.style.display = '';
                    while (block.firstChild) block.parentNode.insertBefore(block.firstChild, block);
                    block.remove();
                });
            }

            let code = pre ? pre.textContent : '';
            code = code.trim();
            if (code === '' || /^<[^>]*>\s*<\/[^>]*>$/.test(code)) code = '';
            code = minifyHTML(htmlDecode(code).trim());

            // pre'yi kaldır, editor'ı geri göster
            if (pre) pre.remove();
            editor.style.display = '';
            const _opts = wrapper._epOptions || {};
            editor.innerHTML = epSanitize(code, _opts);
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
        wrapper.classList.toggle('epeditor-fullscreen');
        const isFullscreen = wrapper.classList.contains('epeditor-fullscreen');
        const fullscreenBtn = wrapper.querySelector('.ep-fullscreen-btn');
        const editorContainer = wrapper.querySelector('.epeditor-container');

        if (isFullscreen) {
            wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background:#fff;display:flex;flex-direction:column;overflow:hidden;padding:12px;box-sizing:border-box;';
            if (editorContainer) editorContainer.style.cssText = 'flex:1 1 auto;display:flex;flex-direction:column;min-height:0;overflow:hidden;';
            if (fullscreenBtn) fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>&nbsp;<span class="ep-fs-text">Tam Ekrandan Çık</span>';
        } else {
            wrapper.removeAttribute('style');
            if (editorContainer) editorContainer.removeAttribute('style');
            if (fullscreenBtn) fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>&nbsp;<span class="ep-fs-text">Tam Ekran</span>';
        }
    }
    // ================================================================
    // REVİZE SİSTEMİ
    // ================================================================

    function epRevizeId() {
        return 'rv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    }

    // Metin seçimini span ile işaretle
    function epWrapSelectionWithRevize(rv) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'ep-revize-span';
        span.dataset.rvId = rv.id;
        span.dataset.rvNote = rv.note;
        span.dataset.rvUser = rv.user;
        span.dataset.rvDate = rv.date;
        span.dataset.rvStatus = 'pending';
        span.contentEditable = 'false';
        try {
            range.surroundContents(span);
        } catch (e) {
            // Kısmi seçim varsa (tag ortası) — sadece extract et
            const frag = range.extractContents();
            span.appendChild(frag);
            range.insertNode(span);
        }
        sel.removeAllRanges();
        return true;
    }

    // setRevize için DOM'da text ara ve işaretle
    function epMarkRevizeInDom(editor, rv) {
        if (!rv.text) return;
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        const nodes = [];
        let node;
        while ((node = walker.nextNode())) nodes.push(node);

        for (const textNode of nodes) {
            const idx = textNode.textContent.indexOf(rv.text);
            if (idx === -1) continue;
            const before = textNode.textContent.slice(0, idx);
            const after = textNode.textContent.slice(idx + rv.text.length);
            const span = document.createElement('span');
            span.className = 'ep-revize-span';
            span.dataset.rvId = rv.id;
            span.dataset.rvNote = rv.note || '';
            span.dataset.rvUser = rv.user || '';
            span.dataset.rvDate = rv.date || '';
            span.dataset.rvStatus = rv.status || 'pending';
            span.contentEditable = 'false';
            span.textContent = rv.text;
            const parent = textNode.parentNode;
            const frag = document.createDocumentFragment();
            if (before) frag.appendChild(document.createTextNode(before));
            frag.appendChild(span);
            if (after) frag.appendChild(document.createTextNode(after));
            parent.replaceChild(frag, textNode);
            break; // ilk eşleşme
        }
    }

    // Tooltip hover sistemi
    function initRevizeTooltip(editor, tooltip) {
        editor.addEventListener('mouseover', e => {
            const span = e.target.closest('.ep-revize-span');
            if (!span) return;
            const rect = span.getBoundingClientRect();
            tooltip.innerHTML = `
                <div class="ep-rv-tt-header">
                    <i class="fa-solid fa-comment-pen"></i>
                    <strong>${span.dataset.rvUser || 'Anonim'}</strong>
                    <span class="ep-rv-tt-date">${span.dataset.rvDate ? new Date(span.dataset.rvDate).toLocaleDateString('tr-TR') : ''}</span>
                </div>
                <div class="ep-rv-tt-note">${span.dataset.rvNote || ''}</div>
            `;
            tooltip.style.display = 'block';
            tooltip.style.left = rect.left + window.scrollX + 'px';
            tooltip.style.top = (rect.bottom + window.scrollY + 6) + 'px';
        });
        editor.addEventListener('mouseout', e => {
            const span = e.target.closest('.ep-revize-span');
            if (span && !e.relatedTarget?.closest('.ep-revize-span')) {
                tooltip.style.display = 'none';
            }
        });
        document.addEventListener('scroll', () => { tooltip.style.display = 'none'; }, { passive: true });
    }

    // Revize ekleme modalı
    function showRevizeModal(editorId, options) {
        const editor = document.getElementById(editorId);
        const sel = window.getSelection();

        if (!sel || sel.isCollapsed) {
            alert('Lütfen önce revize eklemek istediğiniz metni seçin.');
            return;
        }
        const selectedText = sel.toString().trim();
        if (!selectedText) return;

        // Seçimi kaydet
        const range = sel.getRangeAt(0).cloneRange();

        const existing = document.getElementById('ep-revize-modal');
        if (existing) existing.remove();

        const userName = (typeof options.revize === 'object' && options.revize.user) ? options.revize.user : 'Kullanıcı';

        const modal = document.createElement('div');
        modal.id = 'ep-revize-modal';
        modal.innerHTML = `
            <div class="ep-modal-backdrop"></div>
            <div class="ep-modal-box">
                <div class="ep-modal-title">
                    <i class="fa-solid fa-comment-pen"></i> Revize Ekle
                    <button class="ep-fr-close" title="Kapat">&times;</button>
                </div>
                <div class="ep-rv-selected-text">"${selectedText.slice(0, 80)}${selectedText.length > 80 ? '…' : ''}"</div>
                <textarea class="ep-modal-input ep-rv-note-input" placeholder="Revize notunuzu yazın..." rows="3"></textarea>
                <div class="ep-rv-meta">
                    <i class="fa-solid fa-user"></i> ${userName}
                    &nbsp;·&nbsp;
                    <i class="fa-solid fa-calendar"></i> ${new Date().toLocaleDateString('tr-TR')}
                </div>
                <div class="ep-modal-actions">
                    <button class="ep-modal-btn ep-modal-insert" id="ep-rv-save"><i class="fa-solid fa-check"></i> Kaydet</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        function closeModal() { modal.remove(); }
        modal.querySelector('.ep-modal-backdrop').addEventListener('click', closeModal);
        modal.querySelector('.ep-fr-close').addEventListener('click', closeModal);
        modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

        const noteInput = modal.querySelector('.ep-rv-note-input');
        setTimeout(() => noteInput.focus(), 50);

        modal.querySelector('#ep-rv-save').addEventListener('click', () => {
            const note = noteInput.value.trim();
            if (!note) { noteInput.focus(); return; }

            // Seçimi geri yükle
            sel.removeAllRanges();
            sel.addRange(range);

            const rv = {
                id: epRevizeId(),
                note,
                user: userName,
                date: new Date().toISOString(),
                status: 'pending'
            };

            const ok = epWrapSelectionWithRevize(rv);
            if (ok && editor._epSnapshot) editor._epSnapshot();
            closeModal();
        });
    }

    // Revize listesi paneli
    function showRevizePanel(editorId) {
        const editor = document.getElementById(editorId);
        const existing = document.getElementById('ep-revize-panel');
        if (existing) { existing.remove(); return; }

        const wrapper = editor.closest('.epeditor-wrapper');
        const isOperator = wrapper._epIsOperator || false;
        const spans = Array.from(editor.querySelectorAll('.ep-revize-span'));

        const panel = document.createElement('div');
        panel.id = 'ep-revize-panel';

        if (spans.length === 0) {
            panel.innerHTML = `<div class="ep-fr-box"><div class="ep-fr-title"><i class="fa-solid fa-list-check"></i> Revizeler <button class="ep-fr-close">&times;</button></div><div class="ep-rv-empty">Henüz revize yok.</div></div>`;
        } else {
            const acceptLabel = isOperator ? '<i class="fa-solid fa-check"></i> Tamam' : '<i class="fa-solid fa-check"></i> Kabul Et';
            const rejectLabel = isOperator ? '<i class="fa-solid fa-xmark"></i> Atla' : '<i class="fa-solid fa-xmark"></i> Reddet';

            const items = spans.map(span => `
                <div class="ep-rv-item" data-rv-id="${span.dataset.rvId}">
                    <div class="ep-rv-item-text">"${span.textContent.slice(0, 50)}${span.textContent.length > 50 ? '…' : ''}"</div>
                    <div class="ep-rv-item-note">${span.dataset.rvNote}</div>
                    <div class="ep-rv-item-meta">
                        <span><i class="fa-solid fa-user"></i> ${span.dataset.rvUser}</span>
                        <span><i class="fa-solid fa-calendar"></i> ${span.dataset.rvDate ? new Date(span.dataset.rvDate).toLocaleDateString('tr-TR') : ''}</span>
                        <span class="ep-rv-status ep-rv-status-${span.dataset.rvStatus}">${span.dataset.rvStatus === 'pending' ? 'Bekliyor' : span.dataset.rvStatus === 'accepted' ? 'Kabul' : 'Reddedildi'}</span>
                    </div>
                    <div class="ep-rv-item-actions">
                        <button class="ep-modal-btn ep-rv-accept" data-rv-id="${span.dataset.rvId}">${acceptLabel}</button>
                        <button class="ep-modal-btn ep-rv-reject" data-rv-id="${span.dataset.rvId}">${rejectLabel}</button>
                        <button class="ep-modal-btn ep-rv-goto" data-rv-id="${span.dataset.rvId}"><i class="fa-solid fa-arrow-right"></i> Git</button>
                    </div>
                    ${isOperator ? `<div class="ep-rv-operator-hint">Metni düzenleyin, sonra "Tamam" basın — revize işaretlenir.</div>` : ''}
                </div>
            `).join('');

            panel.innerHTML = `<div class="ep-fr-box ep-rv-panel-box">
                <div class="ep-fr-title"><i class="fa-solid fa-list-check"></i> Revizeler (${spans.length}) <button class="ep-fr-close">&times;</button></div>
                ${isOperator ? '<div class="ep-rv-operator-banner"><i class="fa-solid fa-circle-info"></i> Operatör modu — metni düzenleyin, revizeleri işaretleyin.</div>' : ''}
                <div class="ep-rv-list">${items}</div>
            </div>`;
        }

        document.body.appendChild(panel);

        // Pozisyonla
        const rect = wrapper.getBoundingClientRect();
        panel.querySelector('.ep-fr-box').style.cssText =
            `position:fixed;top:${rect.top + 8}px;right:${window.innerWidth - rect.right + 8}px;z-index:9999;`;

        function closePanel() { panel.remove(); }
        panel.querySelector('.ep-fr-close').addEventListener('click', closePanel);

        // Kabul Et / Tamam — span kaldır, metin kalır
        panel.querySelectorAll('.ep-rv-accept').forEach(btn => {
            btn.addEventListener('click', () => {
                const span = editor.querySelector(`.ep-revize-span[data-rv-id="${btn.dataset.rvId}"]`);
                if (!span) return;
                span.replaceWith(document.createTextNode(span.textContent));
                editor.normalize();
                if (editor._epSnapshot) editor._epSnapshot();
                closePanel();
                showRevizePanel(editorId);
            });
        });

        // Reddet / Atla — span kaldır, metin de kaldır (revize modunda), operator modunda sadece span'ı kaldır
        panel.querySelectorAll('.ep-rv-reject').forEach(btn => {
            btn.addEventListener('click', () => {
                const span = editor.querySelector(`.ep-revize-span[data-rv-id="${btn.dataset.rvId}"]`);
                if (!span) return;
                if (isOperator) {
                    // Operator: "Atla" — sadece işareti kaldır, metin kalır
                    span.replaceWith(document.createTextNode(span.textContent));
                } else {
                    // Revize modu: "Reddet" — span ve metin kaldırılır
                    span.remove();
                }
                editor.normalize();
                if (editor._epSnapshot) editor._epSnapshot();
                closePanel();
                showRevizePanel(editorId);
            });
        });

        // Git
        panel.querySelectorAll('.ep-rv-goto').forEach(btn => {
            btn.addEventListener('click', () => {
                const span = editor.querySelector(`.ep-revize-span[data-rv-id="${btn.dataset.rvId}"]`);
                if (span) span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    }

    // ================================================================
    // PREVİEW — Yeni pencerede açar, sayfanın CSS'lerini taşır
    // ================================================================

    function openPreview(editorId, options) {
        const editor = document.getElementById(editorId);
        if (!editor) return;

        // getData ile temiz HTML al (revize span'ları temizlenmiş)
        const editorEl = document.getElementById(editorId);
        const container = editorEl.closest('.epeditor-container');
        const wrapper = editorEl.closest('.epeditor-wrapper');
        const mdView = wrapper.querySelector('.ep-md-view');

        let html = '';
        if (mdView && mdView.style.display === 'block') {
            html = mdView.value.trim();
        } else if (editorEl.dataset.viewsource === 'true') {
            const pre = container.querySelector('pre.ep-code-view');
            html = pre ? minifyHTML(htmlDecode(pre.textContent.trim())) : '';
        } else {
            const clone = editorEl.cloneNode(true);
            clone.querySelectorAll('.ep-revize-span').forEach(span => {
                span.replaceWith(document.createTextNode(span.textContent));
            });
            html = minifyHTML(clone.innerHTML.trim());
        }

        // Sayfadaki tüm CSS linklerini otomatik topla
        const autoLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => link.href)
            .filter(href => href && !href.includes('EPEditor')); // EPEditor'ın kendi CSS'ini hariç tut

        // Kullanıcının ek verdiği CSS URL'leri
        const extraCss = (typeof options.preview === 'object' && Array.isArray(options.preview.css))
            ? options.preview.css : [];

        const allCss = [...autoLinks, ...extraCss];
        const cssLinks = allCss.map(href => `<link rel="stylesheet" href="${href}">`).join('\n');

        // Sayfadaki inline style'ları da al
        const inlineStyles = Array.from(document.querySelectorAll('style'))
            .map(s => `<style>${s.textContent}</style>`)
            .join('\n');

        const previewHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Önizleme — EPEditor</title>
    ${cssLinks}
    ${inlineStyles}
    <style>
        body { padding: 24px; box-sizing: border-box; }
        .ep-preview-badge {
            position: fixed;
            bottom: 16px;
            right: 16px;
            background: #1e293b;
            color: #fff;
            font-family: Arial, sans-serif;
            font-size: 11px;
            padding: 5px 10px;
            border-radius: 20px;
            opacity: 0.7;
            pointer-events: none;
        }
    </style>
</head>
<body>
    ${html}
    <div class="ep-preview-badge">EPEditor Önizleme</div>
</body>
</html>`;

        // Yeni pencerede aç
        const previewWin = window.open('', '_blank', 'width=1024,height=768,menubar=no,toolbar=no,location=no');
        if (!previewWin) {
            alert('Popup engellendi. Lütfen tarayıcınızın popup engelleyicisine izin verin.');
            return;
        }
        previewWin.document.open();
        previewWin.document.write(previewHtml);
        previewWin.document.close();
    }

    function showAboutModal() {
        const existing = document.getElementById('ep-about-modal');
        if (existing) { existing.remove(); return; }

        const modal = document.createElement('div');
        modal.id = 'ep-about-modal';
        modal.innerHTML = `
            <div class="ep-modal-backdrop"></div>
            <div class="ep-modal-box ep-about-box">
                <div class="ep-modal-title">
                    <span class="ep-about-logo"><i class="fa-solid fa-pen-nib"></i></span>
                    EPEditor
                    <button class="ep-fr-close" title="Kapat">&times;</button>
                </div>
                <div class="ep-about-meta">
                    <span class="ep-about-version">v2.0</span>
                    <span class="ep-about-sep">·</span>
                    <span>WYSIWYG HTML Editör</span>
                </div>
                <div class="ep-about-desc">
                    Tarayıcı tabanlı, bağımlılıksız zengin metin editörü. jQuery ile çalışır, hafif ve genişletilebilir yapıdadır.
                </div>
                <div class="ep-about-features">
                    <div class="ep-about-feature"><i class="fa-solid fa-check"></i> WYSIWYG / Kod / Markdown görünümü</div>
                    <div class="ep-about-feature"><i class="fa-solid fa-check"></i> Syntax highlight & kod katlama</div>
                    <div class="ep-about-feature"><i class="fa-solid fa-check"></i> Resim & bağlantı ekleme, clipboard yapıştırma</div>
                    <div class="ep-about-feature"><i class="fa-solid fa-check"></i> Tablo oluşturucu</div>
                    <div class="ep-about-feature"><i class="fa-solid fa-check"></i> Bul & Değiştir</div>
                    <div class="ep-about-feature"><i class="fa-solid fa-check"></i> Undo/Redo stack, AutoSave</div>
                    <div class="ep-about-feature"><i class="fa-solid fa-check"></i> DOMPurify XSS koruması desteği</div>
                    <div class="ep-about-feature"><i class="fa-solid fa-check"></i> Tam ekran & responsive</div>
                </div>
                <div class="ep-about-license">
                    <div class="ep-about-license-title">Lisans</div>
                    <div class="ep-about-license-body">
                        <strong>Ücretsiz Kullanım:</strong> Kişisel ve açık kaynak projelerde serbesttir.<br>
                        <strong>Ticari Lisans:</strong> Ticari ürün veya hizmetlerde kullanım için lisans gerekmektedir.
                        Lisans bilgisi için <a href="https://entegre.pro" target="_blank" rel="noopener">entegre.pro</a> adresini ziyaret edin.
                    </div>
                </div>
                <div class="ep-about-footer">
                    <span>&copy; 2025–2026 <strong>Polar Bilgisayar Ltd.</strong> — Tüm hakları saklıdır.</span>
                    <a href="https://entegre.pro" target="_blank" rel="noopener">entegre.pro</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        function closeModal() { modal.remove(); }
        modal.querySelector('.ep-modal-backdrop').addEventListener('click', closeModal);
        modal.querySelector('.ep-fr-close').addEventListener('click', closeModal);
        modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    }

    function showImageModal(editorId) {
        const editor = document.getElementById(editorId);

        // Seçimi kaydet — modal açılınca focus kaybolur
        const sel = window.getSelection();
        let savedRange = null;
        if (sel && sel.rangeCount > 0) {
            savedRange = sel.getRangeAt(0).cloneRange();
        }

        // Varsa eski modalı kaldır
        const existing = document.getElementById('ep-image-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'ep-image-modal';
        modal.innerHTML = `
            <div class="ep-modal-backdrop"></div>
            <div class="ep-modal-box">
                <div class="ep-modal-title"><i class="fa-solid fa-image"></i> Resim Ekle<button class="ep-fr-close ep-modal-cancel" title="Kapat">&times;</button></div>
                <div class="ep-modal-tabs">
                    <button class="ep-modal-tab ep-modal-tab-active" data-tab="url">URL</button>
                    <button class="ep-modal-tab" data-tab="upload">Dosyadan</button>
                </div>
                <div class="ep-modal-panel" data-panel="url">
                    <input class="ep-modal-input" type="text" placeholder="https://example.com/resim.jpg" id="ep-img-url" />
                    <div class="ep-modal-preview-wrap"><img id="ep-img-preview" style="display:none;max-width:100%;max-height:120px;border-radius:4px;margin-top:8px;" /></div>
                </div>
                <div class="ep-modal-panel" data-panel="upload" style="display:none">
                    <label class="ep-upload-label">
                        <i class="fa-solid fa-upload"></i> Dosya Seç
                        <input type="file" accept="image/*" id="ep-img-file" style="display:none" />
                    </label>
                    <div class="ep-modal-preview-wrap"><img id="ep-img-file-preview" style="display:none;max-width:100%;max-height:120px;border-radius:4px;margin-top:8px;" /></div>
                </div>
                <div class="ep-modal-alt-row">
                    <input class="ep-modal-input" type="text" placeholder="Alt metin (isteğe bağlı)" id="ep-img-alt" />
                </div>
                <div class="ep-modal-actions">
                    <button class="ep-modal-btn ep-modal-insert"><i class="fa-solid fa-check"></i> Ekle</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        let currentTab = 'url';
        let base64Data = null;

        // Tab geçişi
        modal.querySelectorAll('.ep-modal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                currentTab = tab.dataset.tab;
                modal.querySelectorAll('.ep-modal-tab').forEach(t => t.classList.remove('ep-modal-tab-active'));
                tab.classList.add('ep-modal-tab-active');
                modal.querySelectorAll('.ep-modal-panel').forEach(p => {
                    p.style.display = p.dataset.panel === currentTab ? '' : 'none';
                });
            });
        });

        // URL önizleme
        const urlInput = modal.querySelector('#ep-img-url');
        const urlPreview = modal.querySelector('#ep-img-preview');
        urlInput.addEventListener('input', () => {
            const val = urlInput.value.trim();
            if (val) { urlPreview.src = val; urlPreview.style.display = 'block'; }
            else urlPreview.style.display = 'none';
        });

        // Dosya önizleme → base64
        const fileInput = modal.querySelector('#ep-img-file');
        const filePreview = modal.querySelector('#ep-img-file-preview');
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                base64Data = ev.target.result;
                filePreview.src = base64Data;
                filePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });

        function closeModal() { modal.remove(); }

        // Backdrop tıklama
        modal.querySelector('.ep-modal-backdrop').addEventListener('click', closeModal);
        modal.querySelector('.ep-modal-cancel').addEventListener('click', closeModal);

        // Ekle butonu
        modal.querySelector('.ep-modal-insert').addEventListener('click', () => {
            const alt = modal.querySelector('#ep-img-alt').value.trim();
            let src = '';

            if (currentTab === 'url') {
                src = urlInput.value.trim();
            } else {
                src = base64Data || '';
            }

            if (!src) { urlInput.focus(); return; }

            // Seçimi geri yükle
            if (savedRange) {
                const s = window.getSelection();
                s.removeAllRanges();
                s.addRange(savedRange);
            }

            const img = `<img src="${src}" alt="${alt}" style="max-width:100%;height:auto;" />`;
            insertHtmlAtCursor(img);
            closeModal();
        });

        // ESC ile kapat
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
        setTimeout(() => urlInput.focus(), 50);
    }

    function showLinkModal(editorId) {
        const editor = document.getElementById(editorId);

        // Seçili metni al
        const sel = window.getSelection();
        let savedRange = null;
        let selectedText = '';
        if (sel && sel.rangeCount > 0) {
            savedRange = sel.getRangeAt(0).cloneRange();
            selectedText = sel.toString().trim();
        }

        const existing = document.getElementById('ep-link-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'ep-link-modal';
        modal.innerHTML = `
            <div class="ep-modal-backdrop"></div>
            <div class="ep-modal-box">
                <div class="ep-modal-title"><i class="fa-solid fa-link"></i> Bağlantı Ekle<button class="ep-fr-close ep-modal-cancel" title="Kapat">&times;</button></div>
                <input class="ep-modal-input" type="text" placeholder="https://example.com" id="ep-link-url" />
                <input class="ep-modal-input" type="text" placeholder="Link metni" id="ep-link-text" value="${selectedText.replace(/"/g, '&quot;')}" />
                <label class="ep-link-newtab-label">
                    <input type="checkbox" id="ep-link-newtab" checked />
                    Yeni sekmede aç
                </label>
                <div class="ep-modal-actions">
                    <button class="ep-modal-btn ep-modal-insert"><i class="fa-solid fa-check"></i> Ekle</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        function closeModal() { modal.remove(); }

        modal.querySelector('.ep-modal-backdrop').addEventListener('click', closeModal);
        modal.querySelector('.ep-modal-cancel').addEventListener('click', closeModal);
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        modal.querySelector('.ep-modal-insert').addEventListener('click', () => {
            const url = modal.querySelector('#ep-link-url').value.trim();
            const text = modal.querySelector('#ep-link-text').value.trim();
            const newTab = modal.querySelector('#ep-link-newtab').checked;

            if (!url) { modal.querySelector('#ep-link-url').focus(); return; }

            const linkText = text || url;
            const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
            const html = `<a href="${url}"${target}>${linkText}</a>`;

            if (savedRange) {
                const s = window.getSelection();
                s.removeAllRanges();
                s.addRange(savedRange);
            }

            // Seçili metin varsa üzerine yaz, yoksa imlece ekle
            if (selectedText) {
                savedRange.deleteContents();
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const frag = document.createDocumentFragment();
                let lastNode;
                while (temp.firstChild) lastNode = frag.appendChild(temp.firstChild);
                savedRange.insertNode(frag);
                if (lastNode) {
                    const newRange = document.createRange();
                    newRange.setStartAfter(lastNode);
                    newRange.collapse(true);
                    const s = window.getSelection();
                    s.removeAllRanges();
                    s.addRange(newRange);
                }
            } else {
                insertHtmlAtCursor(html);
            }

            closeModal();
        });

        setTimeout(() => modal.querySelector('#ep-link-url').focus(), 50);
    }

    function insertHtmlAtCursor(html) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const frag = document.createDocumentFragment();
        let lastNode;
        while (temp.firstChild) lastNode = frag.appendChild(temp.firstChild);
        range.insertNode(frag);
        if (lastNode) {
            const newRange = document.createRange();
            newRange.setStartAfter(lastNode);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
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
        // 1) Yorumlar
        html = html.replace(/&lt;!--([\s\S]*?)--&gt;/g, '<span class="comment">&lt;!--$1--&gt;</span>');

        // --- İç fonksiyon: attribute tokenizer (bozulmayı önler) ---
        function highlightAttrs(attrText) {
            if (!attrText) return '';

            // attr = "..." | '...' | boolean attr
            const re = /([\w:-]+)(?:\s*=\s*(".*?"|'.*?'))?/g;
            let out = '';
            let last = 0;
            let m;

            while ((m = re.exec(attrText)) !== null) {
                // aradaki boşluk/ham parçayı aynen geçir (zaten HTML-escaped)
                out += attrText.slice(last, m.index);

                const name = m[1];
                const value = m[2]; // tırnaklı değer veya undefined (boolean)

                if (name.toLowerCase() === 'class' && value) {
                    out += `<span class="attr-name class-attr">class</span>=<span class="attr-value class-value">${value}</span>`;
                } else if (name.toLowerCase() === 'href' && value) {
                    out += `<span class="attr-name href-attr">href</span>=<span class="attr-value href-value">${value}</span>`;
                } else if (value != null) {
                    out += `<span class="attr-name">${name}</span>=<span class="attr-value">${value}</span>`;
                } else {
                    // boolean attribute (ör: disabled, checked)
                    out += `<span class="attr-name">${name}</span>`;
                }

                last = re.lastIndex;
            }

            // kalan kısmı ekle
            out += attrText.slice(last);
            return out;
        }

        // 2) Tag + Attribute ayrıştırma (attrs ayrı işlenecek)
        return html.replace(/(&lt;\/?)([a-zA-Z][\w-]*)([\s\S]*?)(&gt;)/g, function (_, open, tag, attrs, close) {
            return `<span class="tag">${open}${tag}</span>${highlightAttrs(attrs)}<span class="tag">${close}</span>`;
        });
    }


})(jQuery);