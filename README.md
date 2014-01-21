# jQuery-Notebook
**A simple, clean and elegant WYSIWYG rich text editor for web aplications**
**Note:** Check out the fully functional demo and examples [here](http://raphaelcruzeiro.github.io/jquery-notebook/).
# Usage
**Prerequisites:** jQury-Notebook's default styling uses [FontAwesome](http://fontawesome.io/) draw the icons on the _context bubble_. You can download FontAwesome [here](http://fontawesome.io/assets/font-awesome-4.0.3.zip) or link to the CDN.
1. Add the FontAwesome css and jQuery-Notebook css to you page _head_:   

```
<link href="http://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="src/js/jquery.notebook.css">
```

2. Add jquery and jquery-notebook.js to your page: 

```
<script type="text/javascript" src="src/js/libs/jquery-1.10.2.min.js"></script>
<script type="text/javascript" src="src/js/jquery.notebook.js"></script>
```

3. Create the editor:   

```
<div class="my-editor"></div>
```   

```
$(document).ready(function(){
    $('.my-editor').notebook();
});
```   

That's it!  

# Contributors
[raphaelcruzeiro](https://github.com/raphaelcruzeiro/)   
[otaviosoares](https://github.com/otaviosoares/)
