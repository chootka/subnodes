# GE UI Kit
## (Part of GE.com Overhaul - Job #2699)

This toolkit provides a centralized location for all GE.com CSS, JS and image assets. Any common, repeatable assets should go in this kit. All UI elements must be thorougly documented. 


## Setup 

GE UI Kit requires node v0.8+, grunt v0.3.5+ and npm.

`npm install grunt -g` - installs grunt as global
`npm install` - installs all dependencies

## Grunt
Grunt is used to perform various tasks integral to development. 

- `grunt bump` will bump the version number. Read the [grunt-bump](https://github.com/vojtajina/grunt-bump) documentation for more info.
- `grunt watch` will watch your files and reprocess them when a change is detected.  
- `grunt build` will build the UI Kit's CSS and JS files.
- `grunt document` will build our documentation HTML, CSS and JS files. It will also run the build command and copy the UI kit over to our documentation folder.
- `grunt release` will run the build and document tasks and then copy the files over to a release directory, named with the current version number.
- `grunt copy:uiToTemplates` will copy your currently built UI kit files and copy them over to the ge-com-templates repo. **NOTE:** This assumes a specific directory structure for two indepenet repositories. Please review the directory paths before attempting to use this command.

## Dust

We use the dust templating langauge for constructing our markup. You can read more about dust [here](http://akdubya.github.com/dustjs/).


## Less

All of our CSS is preparsed with Less. If you add a new Less file, be sure to update the concat:less task in grunt.js to include it.


## Contributing

The UI Kit follows a very deliberate directory structure. 

### /css
Houses the UI Kit's source less files and built css files. Never add a new less file unless you're absolutely sure you need it. It's best to just select the existing file that is the most logical home for the new styles you're writing and add it there. If you do add a new less file, you'll need to also add it in the grunt file's less task.

### /docs

Houses our built documentation files, dust templates, and documentation assets (css, js, images). If you need to add a new dust template, you'll also need to add it to the grunt file. 

### /docs/assets

There are documentation specific css, js, and images in this directory. These are only for aiding in our documentation. The final UI kit css, js and image files are also automatically copied to this directory. 

### /img 

Houses the UI Kit's image files. This directory should be as small as possible. Sprite images whenever possible. The goal is to eventually only have one image.

### /js

The UI kit's source and built JS files. If you add a new JS file to src, you'll need to also add it to the grunt file. All code should follow a jquery plugin pattern, and needs to work regardless of the state of the DOM.  Follow existing code conventions in src directory. All third party code belongs in src/vendor and should be kept there. 

### /dist

The dist folder is not (currently, this might change) versioned. It is generateed when you run either the release or release docs command and will contain the versioned release files. 

 
## Images

All images in the UI kit must be retina-ready. Our sprited icons are all available at 1x and 2x resoloutions and any new images added to the kit must be consistent with this


### Sprites

We have three main icon sprite sheets. One for white icons, one for black icons and one for blue icons. The source imagery for these sprite sheets is retained as individual png files at 2x resolution in white and blue. The black icon sprite sheet is generated as an negation of the white sprite sheet. The blue sprite sheet is it's own freewheeling thing, as it does not share all the same icons as the white/black sprite sheet.

There is an automated build command you can run after you added an image to the sprite sheet. This command is: `grunt sprite`

After rebuilding the sprite sheets you will need to update the sprite CSS (`ge.sprites.less`) accordingly.



# TBG Staging

http://staging.barbariangroup.com/2699/ui-kit/

To update staging run `grunt release-docs` and move the generated directory up to the ui-kit.

