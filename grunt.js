// This is the main application configuration file.  It is a Grunt
// configuration file, which you can learn more about here:
// https://github.com/cowboy/grunt/blob/master/docs/configuring.md
//
module.exports = function(grunt) {
  var SRC_CSS   = 'css/src/',
      SRC_JS    = 'js/src/',
      SRC_TMP   = 'docs/templates/',
      BUILD_CSS = 'css/bin/',
      BUILD_JS  = 'js/bin/',
      BUILD_TMP = 'docs/', 
      im = require( 'imagemagick' ),
      _ = require( 'underscore' ),
      exec = require("child_process").exec,
      prompt = require( 'prompt' ),
      VERSION = grunt.file.readJSON('package.json').version,
      templateData = _.extend( grunt.file.readJSON(SRC_TMP + '../data/common.json'), {'version': VERSION } );

  prompt.message = '[' + '?'.green + ']';
  prompt.delimiter = ' ';

  grunt.initConfig({
    // The clean task ensures all files are removed from the dist/ directory so
    // that no files linger from previous builds.
    clean: {
      docs: ["docs/assets/img/_*"],
      release: ["dist/"]
    },

    // copy all our compiled files into the dist folder
    copy: {
      uiToDocs: {
        files: [
          {
            src: BUILD_CSS + '*.css',
            dest: 'docs/assets/css/bin/'
          },
          {
            src: BUILD_JS + '*.js',
            dest: 'docs/assets/js/bin/'
          },
          {
            src: 'img/**',
            dest: 'docs/assets/img/'
          }
        ]
      },
      release: {
        files: [
          {
            src: 'css/bin/ge.ui.css',
            dest: "dist/release-" + VERSION + "/code/css/ge.ui-" + VERSION + ".css"
          },
          {
            src: 'js/bin/ge.ui.js',
            dest: "dist/release-" + VERSION + "/code/js/ge.ui-" + VERSION + ".js"
          },
          {
            src: 'css/bin/ge.ui.min.css',
            dest: "dist/release-" + VERSION + "/code/css/ge.ui-" + VERSION + ".min.css"
          },
          {
            src: 'js/bin/ge.ui.min.js',
            dest: "dist/release-" + VERSION + "/code/js/ge.ui-" + VERSION + ".min.js"
          },
          {
            src: 'img/**',
            dest: "dist/release-" + VERSION + "/code/img/"
          }
        ]
      },
      releaseDocs: {
        files: [
          {
            src: 'docs/*.html',
            dest: "dist/release-" + VERSION + "/docs/"
          },
          {
            src: 'docs/assets/**',
            dest: "dist/release-" + VERSION + "/docs/assets/"
          }
        ]
      },
      uiToTemplates: {
        files: [
          {
            src: 'css/bin/*',
            dest: '../ge-com-templates/app/assets/css/bin/'
          },
          {
            src: 'js/bin/*',
            dest: '../ge-com-templates/app/assets/js/bin/'
          },
          {
            src: 'img/**',
            dest: '../ge-com-templates/app/assets/img/'
          }
        ]
      }
    },
    // The lint task will run the build configuration and the application
    // JavaScript through JSHint and report any errors.  You can change the
    // options for this task, by reading this:
    // https://github.com/cowboy/grunt/blob/master/docs/task_lint.md
    lint: {
      files: [
        "js/src/**/*.js", "docs/assets/js/src/**/*.js"
      ]
    },

    // The jshint option for scripturl is set to lax, because the anchor
    // override inside main.js needs to test for them so as to not accidentally
    // route.
    jshint: {
      options: {
        scripturl: true
      }
    },

    // This task uses the MinCSS Node.js project to take all your CSS files in
    // order and concatenate them into a single CSS file named index.css.  It
    // also minifies all the CSS as well.  This is named index.css, because we
    // only want to load one stylesheet in index.html.
    mincss: {
      ui: {
        files: {
          "css/bin/ge.ui.min.css": "css/bin/ge.ui.css"
        }
      }
    },

    // Takes the built require.js file and minifies it for filesize benefits.
    min: {
      ui: {
        src: "js/bin/ge.ui.js",
        dest: "js/bin/ge.ui.min.js"
      }
    },
    less: {
      ui: {
        src: BUILD_CSS + 'ge.ui.less',  
        dest: BUILD_CSS + 'ge.ui.css'
      },
      docs: {
        src: 'docs/assets/css/bin/ge.ui.docs.less',  
        dest: 'docs/assets/css/bin/ge.ui.docs.css'
      }
    },
    watch: {
      js: {
        files: ['<config:concat.JS.src>', '<config:concat.docsJS.src>'],
        tasks: 'devUpdateJS'
      },
      less: {
        files: ['<config:concat.less.src>', '<config:concat.docsLess.src>'],
        tasks: 'devUpdateCSS'
      },
      template: {
        files: [SRC_TMP + '*.dust', SRC_TMP + 'shared/*.dust', SRC_TMP + '../data/*.json'],
        tasks: 'template'
      }
    },
    pkg: '<json:package.json>',
    meta: {
      banner: ['/*!', 
               '* GE UI Kit v<%= pkg.version %>', 
               '*',
               '* Copyright 2012 GE',
               '* Generated <%= grunt.template.today("yyyy-mm-dd") %>',
               '* With thanks to Twitter Bootstrap, jQuery and various open source contributors',
               '*/'].join('\n ')
    },
    concat: {
      less: {
        src: [SRC_CSS + 'vendor/bootstrap.css',
              SRC_CSS + 'vendor/bootstrap.responsive.css',
              SRC_CSS + 'vendor/elements.less',
              SRC_CSS + 'ge.vars.less',
              SRC_CSS + 'ge.colors.less',
              SRC_CSS + 'ge.mixins.less',
              SRC_CSS + 'ge.sprites.less',
              SRC_CSS + 'ge.layout.less',
              SRC_CSS + 'ge.geometry.less',
              SRC_CSS + 'ge.forms.less',
              SRC_CSS + 'ge.type.less',
              SRC_CSS + 'ge.buttons.less',
              SRC_CSS + 'ge.heroCarousel.less',
              SRC_CSS + 'ge.videoplayer.less',
              SRC_CSS + 'ge.timeline.less',
              SRC_CSS + 'ge.flipFlop.less',
              SRC_CSS + 'ge.cardGrid.less',
              SRC_CSS + 'ge.misc.less'],
        dest: BUILD_CSS + 'ge.ui.less'
      },
      uiLess: {
        src: ['<banner>', 
              BUILD_CSS + 'ge.ui.less'],
        dest: BUILD_CSS + 'ge.ui.less'
      },
      uiCSS: {
        src: [BUILD_CSS + 'ge.ui.css'],
        dest: BUILD_CSS + 'ge.ui.css'
      },
      JS: {
        src: [SRC_JS + 'vendor/almond.js',
              SRC_JS + 'vendor/lodash.js',
              SRC_JS + 'vendor/harvey.js',
              SRC_JS + 'vendor/jquery.textUtilities.js',
              SRC_JS + 'vendor/jquery.ytVideo.js',
              SRC_JS + 'vendor/bootstrap-transition.js',
              SRC_JS + 'vendor/bootstrap-collapse.js',
              SRC_JS + 'vendor/bootstrap-tooltip.js',
              SRC_JS + 'vendor/bootstrap-popover.js',
              SRC_JS + 'vendor/bootstrap-affix.js',
              SRC_JS + 'vendor/jquery.selectBox.js',
              SRC_JS + 'vendor/rfc3339date.js',
              SRC_JS + 'ge.base.js',
              SRC_JS + 'ge.track.js',
              SRC_JS + 'ge.tools.js',
              SRC_JS + 'ge.video.js',
              SRC_JS + 'ge.carousel.js',
              SRC_JS + 'ge.timeline.js',
              SRC_JS + 'ge.videoplayer.js',
              SRC_JS + 'ge.ui.boxshadow.js',
              SRC_JS + 'ge.select.js',
              SRC_JS + 'ge.radioBtn.js'
        ],
        dest: BUILD_JS + 'ge.ui.js'
      },
      uiJS: {
        src: ['<banner>', BUILD_JS + 'ge.ui.js'],
        dest: BUILD_JS + 'ge.ui.js'
      },
      docsLess: {
        src: ['docs/assets/css/src/vendor/*.less',
              'docs/assets/css/src/*.less'],
        dest: 'docs/assets/css/bin/ge.ui.docs.less'
      },
      docsJS: {
        src: ['docs/assets/js/src/vendor/*.js',
              'docs/assets/js/src/*.js' ],
        dest: 'docs/assets/js/bin/ge.ui.docs.js'
      }
    },
    // The template task takes a src template and generates a cached HTML page from it
    // include variable objects to make them available to the template
    template: {
      home: {
        src: SRC_TMP + 'index.dust',
        dest: BUILD_TMP + 'index.html',
        variables: _.extend( templateData, {preserveWhiteSpace: true})
      },
      core : {
        src: SRC_TMP + 'core.dust',
        dest: BUILD_TMP + 'core.html',
        variables: _.extend( templateData, {preserveWhiteSpace: true})
      },
      layout: {
        src: SRC_TMP + 'layout.dust',
        dest: BUILD_TMP + 'layout.html',
        variables: _.extend( templateData, {preserveWhiteSpace: true})
      },
      components: {
        src: SRC_TMP + 'components.dust',
        dest: BUILD_TMP + 'components.html',
        variables: _.extend( templateData, {preserveWhiteSpace: true})
      },
      video: {
        src: SRC_TMP + 'video.dust',
        dest: BUILD_TMP + 'video.html',
        variables: _.extend( templateData, {preserveWhiteSpace: true})
      },
      tracking: {
        src: SRC_TMP + 'tracking.dust',
        dest: BUILD_TMP + 'tracking.html',
        variables: _.extend( templateData, {preserveWhiteSpace: true})
      }
    },
    shell: {
      ge: {
        command: 'rsync -vr dist/release-' + VERSION + '/  ../ge-svn/gedotcom-uilibrary/trunk/'
      }
    }
  } );
  

  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-css');
  grunt.loadNpmTasks('grunt-templater');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-shell');



  // shortcut for the watch script
  grunt.registerTask( "devUpdateCSS", "concat:docsLess concat:less concat:uiLess concat:JS concat:uiJS less:docs less:ui concat:uiCSS copy:uiToDocs clean:docs");

  // shortcut for the watch script
  grunt.registerTask( "devUpdateJS", "concat:JS concat:uiJS concat:docsJS copy:uiToDocs clean:docs");

  // Build the UI kit
  grunt.registerTask( "build", "concat:less concat:uiLess concat:JS concat:uiJS less:ui concat:uiCSS");

  // Documentation 
  // Generate the documenation html files, generate the documentation css and js
  // and copy over the most recent build of the UI kit 
  grunt.registerTask("document", "template concat:docsLess concat:docsJS less:docs build copy:uiToDocs clean:docs");

  // Build and release
  grunt.registerTask("release", "build mincss:ui min:ui copy:release document copy:releaseDocs" )

  // Build and update staging
  grunt.registerTask("sprite", "Builds sprite sheets from the src imges", function() {
    var task = this,
      // tell grunt this task is async
      done = this.async(),
      commands = [
        "montage img/_icons_blue/*.png -tile 1x -geometry '100x80>+0+0' -gravity NorthWest -background transparent img/icon_blue_sprite_2x.png",
        "montage img/_icons_white/*.png -tile 1x -geometry '100x80>+0+0' -gravity NorthWest -background transparent img/icon_white_sprite_2x.png",
        "convert img/icon_white_sprite_2x.png -negate img/icon_black_sprite_2x.png",
        "convert img/icon_white_sprite_2x.png -resize 50% img/icon_white_sprite_1x.png",
        "convert img/icon_black_sprite_2x.png -resize 50% img/icon_black_sprite_1x.png",
        "convert img/icon_blue_sprite_2x.png -resize 50% img/icon_blue_sprite_1x.png"
      ];
    var child = exec( commands.join( " && " ) ,
          function (error, stdout, stderr) {
            console.log('Sprite generation complete. Please update the CSS and documentation accordingly');
            if (error !== null) {
              console.log('exec error: ' + error);
              // Execute the callback when the async task is done
              done();
            }
        });
  } );
};
