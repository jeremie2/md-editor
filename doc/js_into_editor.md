# Intro

This document explains the functionality inside `buttons_editor.js`. It might not been up to date, some functions might be changed over the time, but the "big picture" should remain the same.

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

Changing text using just `markdownInput.value = newText` will drop the history of previous steps, loosing the ability to revert them pressing **Ctrl+z** .

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

- **newText**: new text that we want to modify as `**text**`, `- raw`, etc. Let's take the string `ciao` as example and pretend it is first string inside the input area.

# WORK IN PROGRESS...

- **start**: numerical index position of the first character, from which we'll apply the change. In our example the character `c` will be in **position 0**.

- **end**: numerical index position of the last character + 1. Character `o` is in **position 3**. To include the last character we need to set the next one, so that **end** will be **4**.
