# grunt-templater

Universal template compiler task for Grunt. It uses [Consolidate](https://github.com/visionmedia/consolidate.js) under the hood.

## Supported template engines

  - [dust](https://github.com/akdubya/dustjs) [(website)](http://akdubya.github.com/dustjs/)
  - [eco](https://github.com/sstephenson/eco)
  - [ejs](https://github.com/visionmedia/ejs)
  - [haml](https://github.com/visionmedia/haml.js) [(website)](http://haml-lang.com/)
  - [haml-coffee](https://github.com/9elements/haml-coffee) [(website)](http://haml-lang.com/)
  - [handlebars](https://github.com/wycats/handlebars.js/) [(website)](http://handlebarsjs.com/)
  - [hogan](https://github.com/twitter/hogan.js) [(website)](http://twitter.github.com/hogan.js/)
  - [jade](https://github.com/visionmedia/jade) [(website)](http://jade-lang.com/)
  - [jazz](https://github.com/shinetech/jazz)
  - [jqtpl](https://github.com/kof/node-jqtpl) [(website)](http://api.jquery.com/category/plugins/templates/)
  - [liquor](https://github.com/chjj/liquor)
  - [mustache](https://github.com/janl/mustache.js)
  - [QEJS](https://github.com/jepso/QEJS)
  - [swig](https://github.com/paularmstrong/swig) [(website)](http://paularmstrong.github.com/swig/)
  - [underscore](https://github.com/documentcloud/underscore) [(website)](http://documentcloud.github.com/underscore/)
  - [walrus](https://github.com/jeremyruppel/walrus) [(website)](http://documentup.com/jeremyruppel/walrus/)
  - [whiskers](https://github.com/gsf/whiskers.js/tree/)

## Getting Started
    
install via npm

    npm install grunt-templater

install the template engine you intend to use. For example, if using Jade:
  
    npm install jade

and in your grunt.js file:

    grunt.loadNpmTasks('grunt-templater');

## Usage
    
Create a `template` task in your grunt config. Templater will guess the intended template engine based on the `src` filename. Pass the `engine` option to force a specific engine. 

    grunt.initConfig({
      template: {
        dev: {
          src: 'app/homepage.jade',
          dest: 'dev.html',
          variables: {
            css_url: 'app.css'
            title: 'Hello World'
            pretty: true
          }
        },
        dist: {
          src: 'app/homepage.jade',
          dest: 'dist/index.html',
          variables: {
            css_url: 'app.min.css'
            title: 'Hello Production'
          }
        }
      },
      ...
    });

run with:
      
    grunt template

or for a specific target:

    grunt template:dev

`src`, `dest`, and `variables` are required. Engine specific options can also be passed through the `variables` option. In the case of Jade, `pretty: true` adds pretty-indentation whitespace to its output.