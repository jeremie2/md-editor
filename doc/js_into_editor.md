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

