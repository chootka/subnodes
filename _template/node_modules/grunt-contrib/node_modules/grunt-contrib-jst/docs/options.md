##### files ```object```

This defines what files this task will process and should contain key:value pairs.

The key (destination) should be an unique filepath (supports [grunt.template](https://github.com/gruntjs/grunt/blob/master/docs/api_template.md)) and the value (source) should be a filepath or an array of filepaths (supports [minimatch](https://github.com/isaacs/minimatch)).

Note: Values are precompiled to the namespaced JST array in the order passed.

##### options ```object```

This controls how this task (and its helpers) operate and should contain key:value pairs, see options below.

#### Options

##### namespace ```string```

The namespace in which the precompiled templates will be asssigned (default is JST).  *Use dot notation (e.g. App.Templates) for nested namespaces.*

Example:
```js
options: {
  namespace: 'JST'
}
```
##### prettify ```boolean```

When doing a quick once-over of your compiled template file, it's nice to see
an easy-to-read format that has one line per template. This will accomplish
that.

Example:
```javascript
options: {
  prettify: true
}
```

##### amdWrapper ```boolean```

With Require.js and a pre-compiled template.js you want the templates to be
wrapped in a define. This will wrap the output in:
``` javascript
define(function() {
  //Templates
  return this["NAMESPACE"];
});
```

Example:
``` javascript
options: {
  amdWrapper: true
}
```

##### processName ```function```

This option accepts a function which takes one argument (the template filepath) and returns a string which will be used as the key for the precompiled template object.  The example below stores all templates on the default JST namespace in capital letters.

```js
options: {
  processName: function(filename) {
    return filename.toUpperCase();
  }
}
```

##### templateSettings ```object```

The settings passed to underscore when compiling templates.

#### Config Examples

```js
jst: {
  compile: {
    options: {
      templateSettings: {
        interpolate : /\{\{(.+?)\}\}/g
      }
    },
    files: {
      "path/to/compiled/templates.js": ["path/to/source/**/*.html"]
    }
  }
}
```
