/*! 
* GE Tools
* part of the GE UI Kit
* General helper functions for developers. Currently contains mostly code qualtiy tools.
*
*/

define( 'geui/tools', ['geui/base', 'jQuery'], function ( geui, $ ) {

    // namespace object to help organize our code
    var tools = {};

    // required for geui module compatabillity. 
    tools.name = "tools";

    // Non configurables
    tools.cfg = {
        'debug': false
    };
    
    // Default user options
    tools.opts = {};

    tools.publicFn = {
        'init': function( opts ) {
            tools.cfg.debug = opts.debug;
        },
        /* 
         * Runs our code linting functions.
         *
         * @method lint
         *
         */
        'lint': function() {
        	tools.privateFn.multipleIDCheck();
        	tools.privateFn.headingChecks();
        }
    };

    tools.evt = {};


    tools.privateFn = {
    	/* 
    	 * Checks for multiple instances of an id on the current page
    	 *
    	 * @method multiplIDCheck
    	 *
    	 */
        'multipleIDCheck': function() {
        	$( '[id]' ).each( function() {
        	  var ids = $( '[id="'+this.id+'"]' );
        	  if( ids.length > 1 && ids[0] == this )
        	    console.warn( 'Multiple IDs #' + this.id );
        	} );
        },
        /* 
    	 * Runs a few heading tag checks:
    	 *  - one and only one h1 tag
    	 *
    	 * @method headingChecks
    	 *
    	 */
        'headingChecks': function() {
        	var h1Count = $( 'h1' ).length;
        	// ensure that we have one and only one h1
        	if ( h1Count > 1 ) {
        		console.warn( 'More than one h1 tag.' );
        	} else if ( h1Count === 0) {
        		console.warn( 'Missing h1 tag.' );
        	}
        },
    };

    geui.registerModule( tools );

    return tools.publicFn;

} );
