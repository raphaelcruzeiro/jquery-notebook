# jQuery-Notebook
**A simple, clean and elegant WYSIWYG rich text editor for web aplications**  
**Note:** Check out the fully functional demo and examples [here](http://raphaelcruzeiro.github.io/jquery-notebook/).
# Usage

**Prerequisites:** jQuery-Notebook's default styling [FontAwesome](http://fontawesome.io/) draw the icons on the _context bubble_.
You can install both FontAwesome and jQuery-Notebook through bower with the following command:

`bower install jquery-notebook font-awesome`

Alternatively, you can download FontAwesome [here](http://fontawesome.io/assets/font-awesome-4.0.3.zip) or link to the CDN.

##### Add the FontAwesome css and jQuery-Notebook css to you page _head_:

```html
<link href="http://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="src/js/jquery.notebook.css">
```

##### Add jquery and jquery-notebook.js to your page:

```html
<script type="text/javascript" src="src/js/libs/jquery-1.10.2.min.js"></script>
<script type="text/javascript" src="src/js/jquery.notebook.js"></script>
```

##### Create the editor:

```html
<div class="my-editor"></div>
```

```js
$(document).ready(function(){
    $('.my-editor').notebook();
});
```

That's it!

# Available Commands

- Ctrl/Command B - Bold
- Ctrl/Command I - Italic
- Ctrl/Command U - Underline
- Ctrl/Command F1 - Header 1
- Ctrl/Command F2 - Header 2
- Ctrl/Command Z - Undo

# Options

These are the supported options and their default values:

```js
$.fn.notebook.defaults = {
    autoFocus: false,
    placeholder: 'Your text here...',
    mode: 'multiline', // multiline or inline
    modifiers: ['bold', 'italic', 'underline', 'h1', 'h2', 'ol', 'ul', 'anchor']
};
```

# Events

- __contentChange__:
Fires every time the editor's content is modified:

```js
// Using jQuery:
$('.my-editor').on('contentChange', function(e) {
    var content = e.originalEvent.detail.content;
});

// OR using the event directly:
var editorDomElement = $('.my-editor').get(0);
editorDomElement.addEventListener('contentChange', function(e) {
    var content = e.detail.content;
});
```

# Contributing

We use Github Issues to do basically everything on this project, from feature
request to bug tracking. There are a few issues marked as _easy picking_.
These issues are ideally suited for someone who wants to start contributing as
they are fairly simple.

To contribute to this project just fork the repository,
create a branch with a descriptive but brief name and send a pull
request when ready. There is __no need__ to squash your commits
before sending a pull request. After a few accepted and merged pull requests you can
request push rights to the repository if you want to.

Please use 4 spaces for indentation. Any pull requests that has any JavaScript
code with a different indentation will be rejected.



# Contributors
[raphaelcruzeiro](https://github.com/raphaelcruzeiro/)  
[otaviosoares](https://github.com/otaviosoares/)  
[slahn](https://github.com/slahn)  
[TrevorHinesley](https://github.com/TrevorHinesley)  
[cbartlett](https://github.com/cbartlett)  
[penman](https://github.com/penman)  
