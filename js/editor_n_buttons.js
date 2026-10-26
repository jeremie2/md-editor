/*
You can find comprehensive documentation of the
following functions into doc/js_into_editor.md
*/

// :::::::::::::::::::::: INIT

const markdownInput = document.getElementById('markdown-input');
const preview = document.getElementById('preview');

function updatePreview() {
  const text = markdownInput.value;
  preview.innerHTML = marked.parse(text);

  // Genera il menu dinamico inserendo i link ai titoli
  generateTableOfContents(preview);

  // Prism syntax highlight
  if (typeof Prism !== 'undefined') {
    Prism.highlightAllUnder(preview);
  }
}

markdownInput.addEventListener('input', updatePreview);

markdownInput.value = '# Benvenuto!\n\nScrivi **grassetto**, *corsivo*...<br>...o `mono`.\n1. [Installare](https://duckduckgo.com) il pacchetto *firefox*:\n   ```sh\n   sudo apt install firefox\n   ```\n1. Selezionare ***File > Modifica > Chiudi*** e scrivere un *hello world* per il gusto di farlo:\n   ```rust\n   fn main() {\n      println!("ciao");\n   }\n   ```\n1. Ma un bel tabellozzo ce lo vogliamo mettere?\n   | Nome     | Cognome    | Età media |\n   | :--      | :--:       | --:       |\n   | Mario    | Rossi      | 100       |\n   | Mariella | Celandroni | 150       |';
updatePreview();

// :::::::::::::::::::::: HELPER FOR INPUT WITH UNDO (Ctrl+z)

function execInsert(newText, start, end) {
  markdownInput.setSelectionRange(start, end);
  try {
    document.execCommand('insertText', false, newText);
  } catch (e) {
    const text = markdownInput.value;
    markdownInput.value = text.substring(0, start) + newText + text.substring(end);
  }
}

// :::::::::::::::::::::: SYMMETRICAL SYMBOLS (bold, italic, tt...)

function insertMarkdown(startSymbol, endSymbol = startSymbol, placeholder = "") {
    markdownInput.focus();
    const start = markdownInput.selectionStart;
    const end = markdownInput.selectionEnd;
    const text = markdownInput.value;
    const selected = text.substring(start, end);

    let newText = "";
    let selectionOffsetStart = 0;
    let selectionOffsetEnd = 0;

    // Toggle OFF
    if (selected.startsWith(startSymbol) && selected.endsWith(endSymbol)) {
        newText = selected.substring(startSymbol.length, selected.length - endSymbol.length);
        selectionOffsetStart = start;
        selectionOffsetEnd = start + newText.length;
    } 
    // Toggle ON
    else {
        const defaultText = selected || placeholder;
        newText = startSymbol + defaultText + endSymbol;
        
        selectionOffsetStart = start;
        selectionOffsetEnd = start + newText.length;
    }

    execInsert(newText, start, end);
    markdownInput.setSelectionRange(selectionOffsetStart, selectionOffsetEnd);
    updatePreview();
}

// :::::::::::::::::::::: SINGLE SYMBOLS (heading, quote...)

function toggleLineSymbol(symbol) {
  markdownInput.focus();

  const start = markdownInput.selectionStart;
  const end = markdownInput.selectionEnd;
  const text = markdownInput.value;

  const selectionStartLineStart = text.lastIndexOf('\n', start - 1) + 1;
  let selectionEndLineEnd = text.indexOf('\n', end);
  if (selectionEndLineEnd === -1) selectionEndLineEnd = text.length;

  const fullLinesText = text.substring(selectionStartLineStart, selectionEndLineEnd);
  const lines = fullLinesText.split('\n');

  const isRemoving = lines[0].startsWith(symbol);
  
  const updatedLines = lines.map(line => {
    if (isRemoving) {
      return line.startsWith(symbol) ? line.substring(symbol.length) : line;
    } else {
      return symbol + line;
    }
  });

  const newLinesText = updatedLines.join('\n');

  execInsert(newLinesText, selectionStartLineStart, selectionEndLineEnd);

  // Only cursor case.
  if (start === end) {
    const delta = isRemoving ? -symbol.length : symbol.length;
    const newCursorPos = Math.max(selectionStartLineStart, start + delta);
    markdownInput.setSelectionRange(newCursorPos, newCursorPos);
  } else {
    // Text selection case.
    markdownInput.setSelectionRange(selectionStartLineStart, selectionStartLineStart + newLinesText.length);
  }

  updatePreview();
}

// :::::::::::::::::::::: CODE BLOCKS

function toggleCodeBlock() {
  markdownInput.focus();

  const start = markdownInput.selectionStart;
  const end = markdownInput.selectionEnd;
  const text = markdownInput.value;
  const selected = text.substring(start, end);

  let newText = "";
  let selectionOffsetStart = 0;
  let selectionOffsetEnd = 0;

  const isCodeBlock = selected.startsWith("```\n") && selected.endsWith("\n```");

  if (isCodeBlock) {
    newText = selected.substring(4, selected.length - 4);
    selectionOffsetStart = start;
    selectionOffsetEnd = start + newText.length;
  } else {
    const defaultText = selected || "scrivi qui il codice";
    newText = "```\n" + defaultText + "\n```";
    selectionOffsetStart = start + 4;
    selectionOffsetEnd = start + 4 + defaultText.length;
  }

  execInsert(newText, start, end);
  markdownInput.setSelectionRange(selectionOffsetStart, selectionOffsetEnd);
  updatePreview();
}

// :::::::::::::::::::::: NOTE, WARNING...

function insertNote(header, message) {
  markdownInput.focus();
  const start = markdownInput.selectionStart;
  const end = markdownInput.selectionEnd;
  const text = header + message
  
  execInsert(text, start, end);
  
  const selectStart = start + header.length;
  markdownInput.setSelectionRange(selectStart, selectStart + message.length);
  updatePreview();
}

// :::::::::::::::::::::: EASY INSERT
// No need for text selection at the end.
// It's used for tables.

function easyInsert(template) {
  markdownInput.focus();
  const start = markdownInput.selectionStart;
  const end = markdownInput.selectionEnd;
  const text = template;
  
  execInsert(text, start, end);
  updatePreview();
}

// :::::::::::::::::::::: EVENT LISTENERS

document.getElementById('btn-bold').addEventListener('click', () => insertMarkdown('**', '**', ''));
document.getElementById('btn-italic').addEventListener('click', () => insertMarkdown('*', '*', ''));
document.getElementById('btn-tt').addEventListener('click', () => insertMarkdown('`', '`', ''));
document.getElementById('btn-codeblock').addEventListener('click', toggleCodeBlock);
document.getElementById('btn-br').addEventListener('click', () => insertMarkdown('', '<br>', ''));
document.getElementById('btn-comment').addEventListener('click', () => insertMarkdown('<!--', '-->', 'testo'));

document.getElementById('btn-bullet').addEventListener('click', () => toggleLineSymbol('- '));
document.getElementById('btn-num').addEventListener('click', () => toggleLineSymbol('1. '));
document.getElementById('btn-quote').addEventListener('click', () => toggleLineSymbol('> '));

document.getElementById('btn-h1').addEventListener('click', () => toggleLineSymbol('# '));
document.getElementById('btn-h2').addEventListener('click', () => toggleLineSymbol('## '));
document.getElementById('btn-h3').addEventListener('click', () => toggleLineSymbol('### '));

document.getElementById('btn-link').addEventListener('click', () => {
    markdownInput.focus();
    const start = markdownInput.selectionStart;
    const end = markdownInput.selectionEnd;
    const selected = markdownInput.value.substring(start, end);
    
    const label = selected || 'Testo';
    const template = `[${label}](https://example.com)`;
    
    execInsert(template, start, end);
    
    // The URL example will be immediately selected to 
    // change it quickly.
    const offsetStart = start + label.length + 3;
    markdownInput.setSelectionRange(offsetStart, offsetStart + 19);
    updatePreview();
});

document.getElementById('btn-anchor').addEventListener('click', () => insertMarkdown('', '<a id="nome_anchor"></a>', ''));

document.getElementById('btn-img').addEventListener('click', () => {
    markdownInput.focus();
    const start = markdownInput.selectionStart;
    const end = markdownInput.selectionEnd;
    
    const template = '\n<div align="center">\n  <img src="img.png" width="400">\n</div>\n';
    execInsert(template, start, end);
    
    // The `img.png` string will be immediately selected to
    // change it quickly. 
    const offsetStart = start + 34;
    markdownInput.setSelectionRange(offsetStart, offsetStart + 7);
    updatePreview();
});
document.getElementById('btn-table').addEventListener('click', () => {
  const template = '\n| Header 1 | Header 2 | Header 3 |\n| :---     | :---:    | ---:     |\n| Cella    | Cella    | Cella    |\n';
  easyInsert(template);
});
document.getElementById('btn-menu-1').addEventListener('click', () => {
  const template = '[TOC]\n';
  easyInsert(template);
});
document.getElementById('btn-menu-2').addEventListener('click', () => {
  const template = '[TOC-2]\n';
  easyInsert(template);
});
document.getElementById('btn-menu-3').addEventListener('click', () => {
  const template = '[TOC-3]\n';
  easyInsert(template);
});
document.getElementById('btn-note').addEventListener('click', () => {
    const header = '\n> 📝 **Nota**<br>\n';
    const message = 'Scrivi qui la tua nota.\n';
    insertNote(header, message);
});
document.getElementById('btn-tip').addEventListener('click', () => {
    const header = '\n>💡 **Suggerimento**<br>\n';
    const message = 'Scrivi qui il tuo suggerimento.\n';
    insertNote(header, message);
});
document.getElementById('btn-warning').addEventListener('click', () => {
    const header = '\n> ⚠️ **Avviso!**<br>\n';
    const message = 'Scrivi qui il tuo avviso.\n';
    insertNote(header, message);
});

// ::::::::::: KEYBOARD SHORTCUTS
// Could break browser's shortcut with focus on input area.

markdownInput.addEventListener('keydown', (e) => {
    // Check key Ctrl (Cmd on Mac) is pressed.
    const isModifier = e.ctrlKey || e.metaKey;

    if (isModifier) {
        switch (e.key.toLowerCase()) {
            // Bold
            case 'b':  
                e.preventDefault(); // Stop browser behaviour
                insertMarkdown('**', '**', '');
                break;
            // Italic   
            case 'i':
                e.preventDefault();
                insertMarkdown('*', '*', '');
                break;
            // Fixed-width text  
            case '`': 
                e.preventDefault();
                insertMarkdown('`', '`', '');
                break;
        }
    }
});

// :::::::::::::::::::::: VIEWS (Split, Input, Preview)

const editorWrapper = document.getElementById('editor-wrapper');
const btnSplit = document.getElementById('btn-view-split');
const btnInput = document.getElementById('btn-view-input');
const btnPreview = document.getElementById('btn-view-preview');

function changeView(viewClass, activeButton) {
    // Clean up every classes and add the selected class.
    editorWrapper.classList.remove('split-view', 'only-input', 'only-preview');
    editorWrapper.classList.add(viewClass);
    
    [btnSplit, btnInput, btnPreview].forEach(btn => btn.classList.remove('active'));
    activeButton.classList.add('active');
    
    // It forces "focus out" from input.
    if (viewClass === 'only-preview') {
        markdownInput.blur();
    } else {
        markdownInput.focus();
    }
}

btnSplit.addEventListener('click', () => changeView('split-view', btnSplit));
btnInput.addEventListener('click', () => changeView('only-input', btnInput));
btnPreview.addEventListener('click', () => changeView('only-preview', btnPreview));

 // :::::::::::::::::::::: TOC

function generateTableOfContents(previewArea) {
  const currentHtml = previewArea.innerHTML;
  let foundPlaceholder = "";
  let maxLevel = 3;

  if (currentHtml.includes('[TOC-3]')) {
    foundPlaceholder = '[TOC-3]';
    maxLevel = 3;
  } else if (currentHtml.includes('[TOC-2]')) {
    foundPlaceholder = '[TOC-2]';
    maxLevel = 2;
  } else if (currentHtml.includes('[TOC]')) {
    foundPlaceholder = '[TOC]';
    maxLevel = 1;
  }

  if (!foundPlaceholder) return;

  let selectors = [];
  for (let i = 1; i <= maxLevel; i++) {
    selectors.push('h' + i);
  }
  const selectorsString = selectors.join(', ');

  const headings = previewArea.querySelectorAll(selectorsString);
  if (headings.length === 0) return;

  // 1. Inizializziamo l'albero HTML usando tag <ol> per la numerazione nativa
  let tocHtml = '<details class="toc-container"><summary style="cursor:pointer; user-select:none;"><strong>Indice</strong></summary><ol>';
  let currentLevel = 1;

  headings.forEach((heading, index) => {
    const uniqueId = 'heading-paragraph-' + index;
    heading.id = uniqueId;

    // Estraiamo il numero dal tag (es: "h2" diventa il numero 2)
    const level = parseInt(heading.tagName.substring(1));

    // Se scendiamo di livello (es. da h1 a h2), apriamo una nuova sotto-lista numerata
    if (level > currentLevel) {
      while (level > currentLevel) {
        tocHtml += '<ol>';
        currentLevel++;
      }
    } 
    // Se saliamo di livello (es. da h3 a h1), chiudiamo le sotto-liste aperte
    else if (level < currentLevel) {
      while (level < currentLevel) {
        tocHtml += '</ol></li>';
        currentLevel--;
      }
    } 
    // Se siamo allo stesso livello del titolo precedente, chiudiamo il tag del punto precedente
    else if (index > 0) {
      tocHtml += '</li>';
    }

    // Aggiungiamo la singola voce dell'elenco
    tocHtml += `<li><a href="#${uniqueId}">${heading.innerText}</a>`;
  });

  // Chiudiamo tutte le liste rimaste aperte alla fine del ciclo
  while (currentLevel > 0) {
    tocHtml += '</ol>';
    if (currentLevel > 1) tocHtml += '</li>';
    currentLevel--;
  }
  
  tocHtml += '</details>';

  const freshHtml = previewArea.innerHTML;

  if (freshHtml.includes(`<p>${foundPlaceholder}</p>`)) {
    previewArea.innerHTML = freshHtml.replace(`<p>${foundPlaceholder}</p>`, tocHtml);
  } else {
    previewArea.innerHTML = freshHtml.replace(foundPlaceholder, tocHtml);
  }

  const detailsEl = previewArea.querySelector('.toc-container');
  if (detailsEl) {
    detailsEl.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        detailsEl.open = false; // Chiude l'indice al clic su un link
      });
    });
  }
}
