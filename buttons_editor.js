// :::::::::::::::::::::: INIT

const markdownInput = document.getElementById('markdown-input');
const preview = document.getElementById('preview');

function updatePreview() {
  const text = markdownInput.value;
  preview.innerHTML = marked.parse(text);
}

markdownInput.addEventListener('input', updatePreview);

markdownInput.value = '# Benvenuto!\n\nScrivi **grassetto**, *corsivo*...<br>...o `mono`.\n1. [Installare](https://duckduckgo.com) il pacchetto *firefox*:\n   ```\n   sudo apt install firefox\n   ```\n1. Selezionare ***File > Modifica > Chiudi*** e scrivere un *hello world* per il gusto di farlo:\n   ```\n   fn main() {\n      println!("ciao");\n   }\n   ```\n1. Ma un bel tabellozzo ce lo vogliamo mettere?\n   | Nome     | Cognome    | Età media |\n   | :--      | :--:       | --:       |\n   | Mario    | Rossi      | 100       |\n   | Mariella | Celandroni | 150       |';
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

  if (start === end) {
    // Se era solo un cursore singolo (senza selezione), spostalo in modo naturale
    const delta = isRemoving ? -symbol.length : symbol.length;
    const newCursorPos = Math.max(selectionStartLineStart, start + delta);
    markdownInput.setSelectionRange(newCursorPos, newCursorPos);
  } else {
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

// :::::::::::::::::::::: FUNZIONI PER STRUTTURE COMPLESSE

function insertBlock(template, placeholderLength = 0, offsetFromStart = 0) {
  markdownInput.focus();
  const start = markdownInput.selectionStart;
  const end = markdownInput.selectionEnd;
  
  execInsert(template, start, end);
  
  const selectStart = start + offsetFromStart;
  markdownInput.setSelectionRange(selectStart, selectStart + placeholderLength);
  updatePreview();
}

// :::::::::::::::::::::: EVENT LISTENERS

document.getElementById('btn-bold').addEventListener('click', () => insertMarkdown('**', '**', ''));
document.getElementById('btn-italic').addEventListener('click', () => insertMarkdown('*', '*', ''));
document.getElementById('btn-tt').addEventListener('click', () => insertMarkdown('`', '`', ''));
document.getElementById('btn-codeblock').addEventListener('click', toggleCodeBlock);
document.getElementById('btn-quote').addEventListener('click', () => toggleLineSymbol('> '));
document.getElementById('btn-br').addEventListener('click', () => insertMarkdown('', '<br>', ''));
document.getElementById('btn-comment').addEventListener('click', () => insertMarkdown('<!--', '-->', 'testo'));

document.getElementById('btn-bullet').addEventListener('click', () => toggleLineSymbol('- '));
document.getElementById('btn-num').addEventListener('click', () => toggleLineSymbol('1. '));

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
  const tableTemplate = '\n| Header 1 | Header 2 | Header 3 |\n| :---     | :---:    | ---:     |\n| Cella    | Cella    | Cella    |\n';
  insertBlock(tableTemplate, 0, tableTemplate.length);
});
document.getElementById('btn-note').addEventListener('click', () => {
    const template = '\n> 📝 **Nota**<br>\nScrivi qui la tua nota.\n';
    insertBlock(template, 23, 19);
});
document.getElementById('btn-tip').addEventListener('click', () => {
    const template = '\n> 💡 **Suggerimento**<br>\nScrivi qui il tuo suggerimento.\n';
    insertBlock(template, 31, 27);
});
document.getElementById('btn-warning').addEventListener('click', () => {
    const template = '\n> ⚠️ **Avviso!**<br>\nScrivi qui il tuo avviso.\n';
    insertBlock(template, 25, 21);
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
