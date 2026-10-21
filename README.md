# md-editor

Testing/learning how to insert and customize a markdown editor into a `html` page.

> ⚠️ At the moment is just a learning project, NOT super tasted... take it in consideration before use it in production.

# How to test it

1. Download the repo folder.
2. Clic on the `index.html` file or open this file with your browser.

While writing into the left edit area, you will immediately see the result into the right preview area. 

# Some details

- Expectations: use as less javascript as possible.
  - The `marked.umd.js` [file](https://cdn.jsdelivr.net/npm/marked@latest/lib/) from the [marked.js](https://marked.js.org/) project is used as *markdown to html* parser.
  - Inside `buttons_editor.js` are all the custom functions to initialize the editor and makes every button works.
  - (Still work in progress!) Inside the [doc](https://github.com/jeremie2/md-editor/tree/main/doc) folder you'll find all the functions documented line by line.
- Except for the `js` files, then there are just an `index.html` and `style.css`... end of the game.
- The page theme follows the system theme:
  - Dark:
    ![dark](img/md_dark.png)
  - Light:
    ![light](img/md_light.png)  




