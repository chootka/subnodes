// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
;(function ( $, window, document, undefined ) {

  // undefined is used here as the undefined global
  // variable in ECMAScript 3 and is mutable (i.e. it can
  // be changed by someone else). undefined isn't really
  // being passed in so we can ensure that its value is
  // truly undefined. In ES5, undefined can no longer be
  // modified.

  // window and document are passed through as local
  // variables rather than as globals, because this (slightly)
  // quickens the resolution process and can be more
  // efficiently minified (especially when both are
  // regularly referenced in your plugin).

	$( document ).ready( function() {
		// run prettify
		prettyPrint();

    $( '.geui-hero-carousel' ).carousel();

	});

})( jQuery, window, document );

require(['geui/base','geui/video', 'geui/tools'], function( geui, video, tools ) {
  
  geui.init( {
    'debug': true
  } );

  // we load video separately
  video.init();
  
});