# Intro

This document explains the functionality inside `buttons_editor.js`. It might not be up to date, some functions might be changed over the time, but the "big picture" should remain the same.

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

  - **const text = markdownInput.value**
    It gets the raw text of the markdown we write in the input area.
    The value is stored into `text` variable.
  - **preview.innerHTML = marked.parse(text)**
    An external *marked.js* library feature that parse *markdown*
    into *html*.
    **preview.innerHTML**  overwrites the content in the preview area
    with the new html code that has just been generated.

- **markdownInput.addEventListener('input', updatePreview)**

  The browser intercepts any change in the text area and immediately updates the preview area via **updatePreview**.

  > - Please note... **'input'** is a keyword that refers to the specific event inside text/input areas, it isn't a variable or just a string. There are many others ('click', 'submit', etc..).
  > - **updatePreview** is passed to the function without parenthesis (). This because this way the function is not immediately run, but it will run just when the *input* event occours.

- **markdownInput.value = 'bla bla bla... default markdown code'**

  We update the  the text area with a default markdown code, using the **.value** method as already seen.

- **updatePreview()** 

  It's called again to actualize the rendered text in the preview area.

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

- **start** & **end**

  > Both **start** & **end** will be set in the following functions that will use **execInsert()** as helper function by **markdownInput.selectionStart** and **markdownInput.selectionEnd**.

  * **start**: numerical index position of the first character, from which we'll apply the change. In our example the character `c` will be in **position 0**.

  * **end**: numerical index position of the last character + 1. Character `o` is in **position 3**. To include the last character we need to set the next one, so that **end** will be **4**.

- If a user has selected a string, **.setSelectionRange(start, end)** makes so that this string is selected from the firs to the last character. If there isn't any selection then **start** and **end** get the same value.

- **document.execCommand('insertText', false, newText)** instead of replacing some text it simulates the user typing or pasting the content of **newText** over the area selected with **setSelectionRange()**.

  - **'insertText'** is a *command name* that tells the browser what action is involved.
  - **false** is a boolean referred to `showDefaultUI` a functionality that allows pop up text area (for instance to insert a link, an image...) not used anymore and deactivated in any browser.

* **catch (e)** is triggered if **execCommand()** doesn't work.
* In case of error as fall-back method we take the entire **markdownInput.value**:
  1. We cut the part before the selection  **text.substring(0, start)**.
  2. We paste the **newText**.
  3. We add the remaining part of the selected area **text.substring(end)**.

Let's see a practical example with the string `not bad yeah. We want to target the word bed` to insert the **Bold**: symbols `**` around the word: `**bad**`:

```
index:  0123456789...
chars:  not bad yeah
            | ||
            4 6|
               7 -> index of first position after `bad`
```

We want to target the word **bad**.

- `selectionStart` = 4   ... position of character `b`
- `selectionEnd` = 7  ... one position right after character `d`

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

Befor doing anything **markdownInput.focus()** forces the focus into the input area. Then some costants are set:

- **start** and **end**: integers that define the beginning `markdownInput.selectionStart` and the end `markdownInput.selectionEnd` of a text selection. More precisely the index of the firs character and the index of the last character +1.  If there is no selection, then **start** will be equal **end**.
- **text** and **selected**: the whole content `markdownInput.value` and the part of the content selected by the user `text.substring(start, end)`.

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

- **selectionOffsetStart = start**
- **selectionOffsetEnd = start + newText.length**

## Toggle ON

If markdown symbols are not present the **else** block will add them.

- **const defaultText = selected || placeholder**: if there is a selected text, it will be used, otherwise the **placeholder** will be used instead.

  > At this stage the function signature shows `placeholder = ""`. It could be removed but it has been decided to leave it as it is just in case in future evolution we decide to set e default string, like for instance: `"text"`.

- **newText = startSymbol + defaultText + endSymbol**: the markdown symbols are added at the edges of the selected text.
- The new selection will be stored into variables:
  - **selectionOffsetStart = start**
  - **selectionOffsetEnd = start + newText.length**

# work in progress!

