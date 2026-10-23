# Intro

This document explains the functionality inside `editor_n_buttons.js`. It might not be up to date, some functions might be changed over the time, but the "big picture" should remain the same.

# Startup phase

1. An initial text is assigned.
2. In the meantime, let’s set the browser to listen to the input area.
3. We impose a first html rendering with a default markdown text.

```js
const markdownInput = document.getElementById('markdown-input');
const preview = document.getElementById('preview');

function updatePreview() {
  const text = markdownInput.value;
  preview.innerHTML = marked.parse(text);
}

markdownInput.addEventListener('input', updatePreview);

markdownInput.value = 'bla bla some pre-formatted text';
updatePreview();
````

- **markdownInput**
  Reference to the text area where we write our markdown code. 

- **preview**:
  Reference to the area where the html is parsed from markdown.

- **updatePreview()**

  - `const text = markdownInput.value`
    It gets the raw text of the markdown we write in the input area.
    The value is stored into `text` variable.
  - `preview.innerHTML = marked.parse(text)`
    An external *marked.js* library feature that parse *markdown*
    into *html*.
    **preview.innerHTML**  overwrites the content in the preview area
    with the new html code that has just been generated.

- `markdownInput.addEventListener('input', updatePreview)`

  The browser intercepts any change in the text area and immediately updates the preview area via **updatePreview**.

  > - Please note... **'input'** is a keyword that refers to the specific event inside text/input areas, it isn't a variable or just a string. There are many others ('click', 'submit', etc..).
  > - **updatePreview** is passed to the function without parenthesis (). This because this way the function is not immediately run, but it will run just when the *input* event occours.

- `markdownInput.value = 'bla bla bla... default markdown code'`

- We update the  the text area with a default markdown code, using the **.value** method as already seen.

- **updatePreview()** 

  It's called again to actualize the rendered text in the preview area.

<a id="common"></a>

# A common pattern

Most of the following functions will start like this:

- **markdownInput.focus()**: it makes sure the input text area takes the focus.

- `const text = markdownInput.value`: represents the whole text inside the input text area.

- **Start & end of a selection**

  - `const start = markdownInput.selectionStart`: define the begin of selected text. It is an integer that represents the position of the **first char** of the selected text.

  - `const end = markdownInput.selectionEnd`: define the end of selected text. But the integer represent the position of the **last char + 1**.

  Let's see a practical example with the string `not bad yeah`. If we select the word `bad` it will be:

  - **const start = 4**   ... position of character b
  - **const end = 7**   ... one position right after character d

  ```
  index:  0123456789...
  chars:  not bad yeah
              |  |
              4  |
                 7 -> index of first position after `bad`
  ```

- `const selected = text.substring(start, end)`: represents the actual selected string. In the previous example `text.substring(4, 7)` is exactly the word `bad`.

<a id="helper"></a>

# Helper function for Ctrl+z

Changing text using just `markdownInput.value = newText` will drop the history of previous steps, loosing the ability to revert pressing **Ctrl+z** . We try to use `document.execCommand()` instead which preserve the **Ctrl+z** revert action.

 > ⚠️ `execCommand()` has been deprecated and there isn't any easygoing replacement. Browsers should maintain it for a long time because of retro-compatibility, but we must keep in mind soon or later this might change. As a workaround we use *try/catch*. First we try  `document.execCommand()` and if it fails we use `markdownInput.value` as a fall-back method.


```js
function execInsert(newText, start, end) {
  markdownInput.setSelectionRange(start, end);
  try {
    document.execCommand('insertText', false, newText);
  } catch (e) {
    const text = markdownInput.value;
    markdownInput.value = text.substring(0, start) + newText + text.substring(end);
  }
}
```

- **newText**: new text that we want to modify as `**text**`, `- raw`, etc. Let's take the string `ciao` as example and pretend it is first string at the beginning of the input area. 

- **start** & **end**: both will be set in every function that will use **execInsert()** as helper function, and they will represent the index of the **first char** and **last char + 1** of a text selection.

  > 💡See the [common pattern](#common) section for more details.

- If a user has selected a string, **.setSelectionRange(start, end)** makes so that this string is selected from the first to the last character. If there isn't any selection then **start** and **end** get the same value.

- `document.execCommand('insertText', false, newText)` instead of replacing some text simulates the user typing or pasting the content of **newText** over the area selected with **setSelectionRange()**.

  - **'insertText'** is a *command name* that tells the browser what action is involved.
  - **false** is a boolean referred to `showDefaultUI` a functionality that allows pop up text area (for instance to insert a link, an image...) not used anymore and deactivated in any browser.

* **catch (e)** is triggered if **execCommand()** doesn't work.
* In case of error as fall-back method we take the entire **markdownInput.value**:
  1. We cut the part before the selection  **text.substring(0, start)**.
  2. We paste the **newText**.
  3. We add the remaining part of the selected area **text.substring(end)**.

Let's see a practical example with the string `not bad yeah`. We want to target the word bed to insert the **Bold**: symbols `**` around the word so it becomes: `**bad**`:

```
index:  0123456789...
chars:  not bad yeah
            | ||
            4 6|
               7 -> index of first position after `bad`
```

1. Clicking the **B** button after selecting the word, it will be called:

   ```js
   execInsert("**bad**", 4, 7);
   ```

1. Variables will be passed to:

   ```js
   markdownInput.setSelectionRange(4, 7);
   ```

   and then:

   ```js
   document.execCommand('insertText', false, "**bad**");
   ```

   which will work as a *paste* function where `bad` is replaced by `**bad**`.

The situation is now:

```
index:  0123456789...
chars:  not **bad** yeah
```

`execInsert()` has finished its work. The main function will now lead the game and place the cursor in a new position.

# Insert markdown

We set **insertMarkdown()** function so that it **append** markdown symbols around a text or an empty string, but it will also check if those symbols are already there. In that case it will **remove** them. It definitely works as a *toggle*. 

- **startSymbol**: initial symbol (for instance `**` for bold).
- **endSymbol**: obviously must be equal to the firs one and is set `= startSymbol`.
- **placeholder**: optionally some text insert as example.

Before doing anything **markdownInput.focus()** forces the focus into the input area and some constant  (**start**, **end**, **text**...) that define the text selection are set.

> 💡 See the [common pattern](#common) for more details.

```js
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
```

## Get ready for the text

We need to build the new text with markdown symbols added on both sides. Therefore we prepare **newText** as empty string and **selectionOffsetStart** and **selectionOffsetEnd** as the new *start* and *end* ones they get built.

## Toggle OFF

The **if** block checks whether the selected text start already with markdown symbols:

```sh
 if selected.startsWith(startSymbol) && selected.endsWith(endSymbol)
```

If that is true they will be removed setting **newText** as:

```js
selected.substring(startSymbol.length, selected.length - endSymbol.length)
```

For instance let's take the string `**ciao**` made of 8 chars: **startSymbol.length** (symbols `**` take 2 chars) move the beginning of the substring to character **c**.
 **endSymbol.length** takes 2 chars too and we subtract it from **selected.length**. After cutting the `**` from the edges of the selected text, what remains is just: `ciao`.

At this point we store the position of the new selection updating variables:

- `selectionOffsetStart = start`
- `selectionOffsetEnd = start + newText.length`

## Toggle ON

If markdown symbols are not present, the **else** block will add them.

- **const defaultText = selected || placeholder**: if there is a selected text, it will be used, otherwise a **placeholder** will be used instead.

  > At this stage the function signature shows `placeholder = ""`. It could be removed but it has been decided to leave it just in case in future evolution we decide to set e default string, like for instance: `"text"`.

- `newText = startSymbol + defaultText + endSymbol`: the markdown symbols are added at the edges of the selected text.

- The new selection will be stored into variables:

  - `selectionOffsetStart = start`
  - `selectionOffsetEnd = start + newText.length`

## Applying changes

- `execInsert(newText, start, end)`: our helper function insert the new text into the input taking the place of the old text and preserving the `Ctrl+z` functionality.
- `markdownInput.setSelectionRange(selectionOffsetStart, selectionOffsetEnd)`; sets the new selection so that the user can click on the button again to revert the action.
- **updatePreview()**: the preview gets rendered as *html*.

# Line symbol

**toggleLineSymbol()** takes care of Title (`#` ), quote (`>` ), list (`-` ) and other symbols that work on a line or block of lines. There is just a "*start symbol*" at the beginning of a line.

## Setting text selections

```js
function toggleLineSymbol(symbol) {
  markdownInput.focus();

  const start = markdownInput.selectionStart;
  const end = markdownInput.selectionEnd;
  const text = markdownInput.value;
  const selectionStartLineStart = text.lastIndexOf('\n', start - 1) + 1;
  
  let selectionEndLineEnd = text.indexOf('\n', end);
  if (selectionEndLineEnd === -1) selectionEndLineEnd = text.length;

  const fullLinesText = text.substring(selectionStartLineStart, selectionEndLineEnd);
  
  // END OF THE FIRST PART
```

- Before doing anything **markdownInput.focus()** forces the focus into the input area and constant  **text**, **start** and **end** that define the text selection are set.

  > 💡 See the [common pattern](#common) for more details.

- **const selectionStartLineStart**:
  It is set as `text.lastIndexOf('\n', start - 1) + 1` but first let's see how **lastIndexOf()** works because it could looks tricky. It search the last occurrence of a char or string slice, but it does going **from right to left**.

  Let's take this example: `my_string = "x or y? x"` 

  ```
  0123456789  <-- index
  x or y? x   <-- my_string
  ```

  `my_string.lastIndexOf('x')` returns **8** because starting from the end it intercepts the last **x** character.

  We can set a specific index from which starting the research `my_string.lastIndexOf(string, index)`.

  `my_string.lastIndexOf('x', 3)` returns **0** because starting from index **3** it will intercept the first occurrence of **x**.

  Let's take in consideration our specific case: `text.lastIndexOf('\n', start - 1) + 1`.

  We start from index `start - 1` which means an index **before our selection**. The method find the first occurrence of the `\n` new line character. But adding **+1** we actually get the first position of our current line.

  > 📝 If it doesn't find any **\n** it will return **-1** but adding adding **+1** we get the beginning of our current line anyway!

- **const selectionEndLineEnd**: this time we simply use the **indexOf()** method: `text.indexOf('\n', end)` which will find (if it exists) the index of next `\n`, otherwise it takes the full text length with the next step:

  ```js
  if (selectionEndLineEnd === -1) selectionEndLineEnd = text.length;
  ```

  > 📝 We have checked for `\n` around our selection. Inside our selection there could be `\n` symbols and it's fine! Our button will work also on a multi-line selection, from this:
  >
  > ```
  > bla bla
  > bla
  > ```
  >
  > to this:
  >
  > ```
  > # bla bla
  > # bla
  > ```

- **fullLinesText**: is the actual text selection `text.substring(selectionStartLineStart, selectionEndLineEnd)`

- **const lines = fullLinesText.split('\n')**: selected text is split into lines.

## Adding symbols

```js
  // 2nd PART
  
  const lines = fullLinesText.split('\n');
    
  // Toggle function: if symbols are present, they will be removed.
  // Otherwise symbols will be added.
  const isRemoving = lines[0].startsWith(symbol);
  const updatedLines = lines.map(line => {
    if (isRemoving) {
      return line.startsWith(symbol) ? line.substring(symbol.length) : line;
    } else {
      return symbol + line;
    }
  });

  const newLinesText = updatedLines.join('\n');
```

Selected text will be split in a array of **lines**: `const lines = fullLinesText.split('\n')`

- **isRemoving**: gets a boolean value checking whether the first character of a line is already the symbol we want to add: `lines[0].startsWith(symbol)`.

- **updateLines**: is a new array of lines built via `lines.map()`. Inside it we check the condition **isRemoving** and if a line has already got a symbol, it will be removed and the new array will just have lines without symbol:

  ```js
  return line.startsWith(symbol) ? line.substring(symbol.length) : line
  ```

  If every line has not got any symbol, then symbols will be added in the else block:

  ```js 
  return symbol + line
  ```

- **newLinesText**: Finally we join the new formatted lines **updatedLines.join('\n')**.

## Inserting the new text

```js
 // PART 3

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
```

# WORK IN PROGRESS
