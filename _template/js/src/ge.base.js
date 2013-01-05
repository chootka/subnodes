/*! 
* GE Base
* part of the GE UI Kit
* Sets up the GE namespace, and global helper functions
*
*/

// Shim to get CDN loaded jQuery defined
define('jQuery', [], function () {
    return jQuery;
});

define( 'geui/base', ['jQuery', 'lodash'], function ( $, _ ) {

    var geui = {};

    geui.cfg = {
        'readyQueue': []
    };

    geui.opts = {
        'debug': false
    };

    geui.modules = {};

    geui.evt = {
        'ready': function( e ) {
            // execute the ready queue
            _.each( geui.cfg.readyQueue, function( callback ) {
                callback( geui.cfg );
            } );
            geui.cfg.ready = true;
        }
    };

    geui.publicFn = {
        'init': function( options) {
            // Setup our configuration - options overwrites geui.opts, and geui.cfg overwrites them all. 
            _.extend( geui.cfg, geui.opts, options, geui.cfg );
            // bind our ready event
            $( document )
                .ready( geui.evt.ready );
        },
        'registerModule': function( module ) {
            // store a reference to this module in our global 
            geui.modules[module.name] = module['publicFn'];
            // ensure this module is initialized as soon as the dom is ready 
            if ( !! module.autoinit ) {
                geui.privateFn.ready( geui.modules[module.name].init );
            }
            
            // expose the modules public functions
            geui.publicFn[module.name] = geui.modules[module.name];
        },
        /*
         * Provides a method for requesting data, either from localstorage or the provided URL
         *
         * @method withData
         * @param {Object} cfg The configuration details. Must include data or a URL
         * @param {Function} callback The function to hand the data off to once we have it
         *
         */
        'withData': function( cfg, callback ) {
            var dataItem,
                now = (new Date()).getTime(),
                expires = typeof(cfg.expires) != 'undefined' ? now + cfg.expires : 99999999999999999999,
                data;
            if ( typeof( localStorage ) != 'undefined' ) {
                // use localStorage if it exists
                // check if our data is already cached
                dataItem =  JSON.parse( localStorage.getItem( cfg.url ) );
                if ( dataItem && now < dataItem.expiresAt ) {
                    // use our existing data
                    callback( dataItem.data );
                } else {
                    // request new data
                    $.getJSON( 
                        cfg.url,
                        function( data ) {
                            // run our callback with the new data
                            callback( data );
                            // store the data for later
                            data = JSON.stringify( {
                                'expiresAt': expires,
                                'data': data
                            } );
                            localStorage.setItem( cfg.url, data );
                        } );
                }
            }
        }
    };

    geui.privateFn = {
        'ready': function( callback ) {
            if ( geui.cfg.ready ) {
                callback( geui.cfg );
            } else {
                geui.cfg.readyQueue.push( callback );
            }
        }
    };

    return geui.publicFn;

});

// expose geui as a global and get things started
require(['geui/base'], function( geui ) {
    window.geui = geui;
});
