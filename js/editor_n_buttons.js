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
  
  // Check Ubuntu version.
  parseUbuntuVersions(preview);

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
document.getElementById('btn-ubu-version').addEventListener('click', () => {
  const template = '\n[UBU ]\n';
  easyInsert(template);
});
document.getElementById('btn-menu-1').addEventListener('click', () => {
  const template = '[IND]\n';
  easyInsert(template);
});
document.getElementById('btn-menu-2').addEventListener('click', () => {
  const template = '[IND-2]\n';
  easyInsert(template);
});
document.getElementById('btn-menu-3').addEventListener('click', () => {
  const template = '[IND-3]\n';
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

// ::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::: CUSTOM TAGS ::
// ::::::::::::::::::::::::::::::::::::::

/// :::::::::::::::::::::: HELPER FUNCTION "IS TAG"

/**
* Checks whether a given text tag is located within protected areas
* (such as <pre> code blocks, <code> tags, or input/textarea elements). 
*
* @param {string} tagText - The full tag to check (e.g., "[UBU 24.04]" or "[IND]")
* @param {HTMLElement} container - The preview area of ​​your editor (e.g., previewArea)
* @returns {boolean} - True if the tag is inside a code block and should be ignored; otherwise, False. 
*/

function isTagInsideCode(tagText, container) {
    if (!container || !tagText) return false;

    // Selects every blocks and element with raw text inside.
    const protectedElements = container.querySelectorAll('code, pre, textarea, input');
    
    // Checks if text is part of a protectedElements.
    for (const element of protectedElements) {
        // For input/textarea it checks `.value`. For html tags checks `.textContent``
        const content = (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') 
            ? element.value 
            : element.textContent;

        if (content && content.includes(tagText)) {
            return true; // Protected tag! It mast remain raw.
        }
    }
    
    return false; // Safe tag, it can be rendered.
}

 // :::::::::::::::::::::: TOC

function generateTableOfContents(previewArea) {
  const currentHtml = previewArea.innerHTML;
  let foundPlaceholder = "";
  let maxLevel = 3;

  if (currentHtml.includes('[IND-3]')) {
    foundPlaceholder = '[IND-3]';
    maxLevel = 3;
  } else if (currentHtml.includes('[IND-2]')) {
    foundPlaceholder = '[IND-2]';
    maxLevel = 2;
  } else if (currentHtml.includes('[IND]')) {
    foundPlaceholder = '[IND]';
    maxLevel = 1;
  }
  
  if (!foundPlaceholder) return;

  // If IND tag is found inside raw text tags, function stops.
  if (isTagInsideCode(foundPlaceholder, previewArea)) return; 

  let selectors = [];
  for (let i = 1; i <= maxLevel; i++) {
    selectors.push('h' + i);
  }
  const selectorsString = selectors.join(', ');

  const headings = previewArea.querySelectorAll(selectorsString);
  if (headings.length === 0) return;

  // Html tree initialization with <ol> tag.
  let tocHtml = '<details class="toc-container"><summary style="cursor:pointer; user-select:none;"><strong>Indice</strong></summary><ol>';
  let currentLevel = 1;

  headings.forEach((heading, index) => {
    const uniqueId = 'heading-paragraph-' + index;
    heading.id = uniqueId;

    // Extract number from tag (e.g. "h2" -> 2)
    const level = parseInt(heading.tagName.substring(1));

    // If we get down a level (e.g. h1 -> h2)
    // let's start a new ordered sub-list.
    if (level > currentLevel) {
      while (level > currentLevel) {
        tocHtml += '<ol>';
        currentLevel++;
      }
    } 
    // If we go up a level (e.g. h2 -> h1),
    // we close the open sub-lists.
    else if (level < currentLevel) {
      while (level < currentLevel) {
        tocHtml += '</ol></li>';
        currentLevel--;
      }
    } 
    // If we are at the same level of the
    // previous tag, we close the previous tag.
    else if (index > 0) {
      tocHtml += '</li>';
    }

    // Add the single voice of the list.
    tocHtml += `<li><a href="#${uniqueId}">${heading.innerText}</a>`;
  });

  // Let's close every the list at the end of the loop.
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
        detailsEl.open = false; // Close the index after click.
      });
    });
  }
}

// ::::::::::::::::::::::::::::::::::::::
// :::::::::::::::::::::: UBU VERSIONS ::
// ::::::::::::::::::::::::::::::::::::::

// :::::::::::::: Constant templates

const CONTRIB_LINK = ' <a href="#contribuisci" class="btn-contrib">Clicca qui!</a>';

const ALERT_TEMPLATES = {
    error: (version) => `
        <div class="ubuntu-alert alert-error">
            🛑 <strong>Errore nel tag UBU:</strong> La versione di Ubuntu "<strong>${version}</strong>" non esiste. Per favore, verificare i dati inseriti.
        </div>`,
    
    active: (versionsList) => `
        <div class="ubuntu-alert alert-active">
            <strong>Guida verificata con Ubuntu</strong><br>${versionsList}
        </div>`,
    
    pro: (versionsString) => `
        <div class="ubuntu-alert alert-pro">
            ⚠️ <strong>Guida non verificata da molto tempo.</strong> Può contenere informazioni utili per la versione Ubuntu Pro ${versionsString}. Vuoi contribuire ad aggiornarla?${CONTRIB_LINK}
        </div>`,
    
    obsolete: () => `
        <div class="ubuntu-alert alert-obsolete">
            🛑 <strong>Guida verificata con versioni obsolete di Ubuntu</strong>, potrebbe non essere più valida. Vuoi contribuire ad aggiornarla?${CONTRIB_LINK}
        </div>`
};

// :::::::::::::: helper functions

// Update set list of Ubuntu versions.
function generaSetVersioniUbuntu() {
    const releases = [
        '6.06',  '6.10',   '7.04',  '7.10',  '8.04',  '8.10',
        '9.04',  '9.10',  '12.04', '12.10', '13.04', '13.10',
        '14.04', '14.10', '15.04', '15.10', '10.04', '10.10',
        '11.04', '11.10', '16.04', '16.10', '17.04', '17.10',
        '18.04', '18.10', '19.04', '19.10', '20.04', '20.10',
        '21.04', '21.10', '22.04', '22.10', '23.04', '23.10',
        '24.04', '24.10', '25.04', '25.10', '26.04', '26.10'
    ];

    const currentYear = new Date().getFullYear();
    const lastTwoCorrectDigits = currentYear % 100;  // E.g.: 2026 -> 26
    // From last year element in `releases` it gets the year:
    // '25.10' -> 25 as int
    const lastElementYear = parseInt(releases.at(-1).split('.')[0], 10);
    // 3. Generiamo i rilasci standard dal 2016 (anno 16) in poi
    for (let year = lastElementYear; year + 1 <= lastTwoCorrectDigits; year++) {
        
        // `.04` always released in the first half of the year.
        if (year < lastTwoCorrectDigits || (year === lastTwoCorrectDigits && new Date().getMonth() >= 3)) {
            releases.push(`${year}.04`);
        }

        // `.10` it is added only if the year has passed or if
        // we are already in October or later (month >= 9 in JS)
        if (year < lastTwoCorrectDigits || (year === lastTwoCorrectDigits && new Date().getMonth() >= 9)) {
            releases.push(`${year}.10`);
        }
    }

    return new Set(releases);
}

function validateVersions(versionsArray, validVersionsSet) {
    let invalidVersion = null;

    for (const ver of versionsArray) {
        if (!ver) continue;
        // Se la versione non esiste nel Set ufficiale, cattura l'errore
        if (!validVersionsSet.has(ver)) {
            invalidVersion = ver;
            break;
        }
    }

    return {
        isValid: invalidVersion === null,
        invalidVersion: invalidVersion
    };
}

function getHighestSupportStatus(versionsArray) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Gennaio è 0 -> +1
    const currentTotalMonths = (currentYear * 12) + currentMonth;

    let maxStatus = 0;

    versionsArray.forEach(ver => {
        if (!ver) return;
        const parts = ver.split('.');
        if (parts.length !== 2) return;

        const releaseYear = parseInt("20" + parts[0], 10);
        const releaseMonth = parseInt(parts[1], 10);

        // Controllo se è LTS (Aprile degli anni pari)
        const isLTS = (releaseMonth === 4 && releaseYear % 2 === 0);

        const releaseTotalMonths = (releaseYear * 12) + releaseMonth;
        const standardSupportDuration = isLTS ? (5 * 12) : 9;
        const proSupportDuration = isLTS ? (10 * 12) : 9;

        const endStandardMonths = releaseTotalMonths + standardSupportDuration;
        const endProMonths = releaseTotalMonths + proSupportDuration;

        if (currentTotalMonths <= endStandardMonths) {
            if (maxStatus < 2) maxStatus = 2;
        } else if (isLTS && currentTotalMonths <= endProMonths) {
            if (maxStatus < 1) maxStatus = 1;
        }
    });

    return maxStatus;
}

// :::::::::::::: main function

function parseUbuntuVersions(previewArea) {
  const currentHtml = previewArea.innerHTML;
  
  // Intercept tag [UBU XY.ZW AB.CD ...]
  const versionRegex = /\[UBU\s+([^\]]+)\]/gi;

  // `exec()` searches the given pattern (versionRegex)
  // into `currentHtml`. It returns `null` id it doesn't find it.
  // Otherwise it returns an array where:
  // match[0]: the whole tag like [UBU 24.04 24.10].
  // match[0]: text inside [UBU ] like "24.04 24.10".
  const match = versionRegex.exec(currentHtml);
  
  if (!match) return; // Exit if there is NO tag.
  
  const fullTag = match[0];        // E.g. "[UBU 24.04 26.10]"
  const versionsString = match[1]; // E.g. "24.04 26.10"
  
  // It makes UBU tag usable inside raw text tags.
  if (isTagInsideCode(fullTag, previewArea)) return;

  // Ubu versions array which needs to be checked.
  const versions = versionsString.trim().split(/\s+/);
  
  // :::::::::::::::::::::::: ok till here
  
  // 2. Generazione del Set ufficiale di controllo
  const validUbuntuVersions = generaSetVersioniUbuntu();
  
  // 3. PROCESSO DI VALIDAZIONE
  const validation = validateVersions(versions, validUbuntuVersions);
  
  let alertBoxHtml = '';

  if (!validation.isValid) {
      // Se non è valida, usa il template di errore
      alertBoxHtml = ALERT_TEMPLATES.error(validation.invalidVersion);
  } else {
      // 4. DEDUZIONE DEL SUPPORTO STANDARD / PRO
      const maxStatus = getHighestSupportStatus(versions);
      
      // 5. SELEZIONE DEL TEMPLATE IN BASE ALLO STATO
      if (maxStatus === 2) {
          alertBoxHtml = ALERT_TEMPLATES.active(versions.join(', '));
      } else if (maxStatus === 1) {
          alertBoxHtml = ALERT_TEMPLATES.pro(versionsString);
      } else {
          alertBoxHtml = ALERT_TEMPLATES.obsolete();
      }
  }
  
  // 6. Iniezione finale nel DOM
  const freshHtml = previewArea.innerHTML;
  if (freshHtml.includes(`<p>${fullTag}</p>`)) {
      previewArea.innerHTML = freshHtml.replace(`<p>${fullTag}</p>`, alertBoxHtml);
  } else {
      previewArea.innerHTML = freshHtml.replace(fullTag, alertBoxHtml);
  }
}
