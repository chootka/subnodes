/*! 
* GE Track
* part of the GE UI Kit
* Interface and helper functions for communicating with Google Analytics
*
*/

define( 'geui/track', ['geui/base', 'jQuery'], function ( geui, $ ) {

    // namespace object to help organize our code
    var track = {};

    // required for geui module compatabillity. 
    track.name = "track";
    track.autoinit = true;

    // Non configurables
    track.cfg = {
        'category': '',
        'debug': false,
        'trackingEnabled': true,
        'regex': {
            'external': /^(http|ftp|https)?:\/\//,
            'internal': /^(?!#|http|https|ftp|:\/\/).*/,
            'mailto': /^mailto:(.*)/
        }
    };
    
    // Default user options
    track.opts = {};

    track.publicFn = {
        'init': function( options ) {
            _.extend( track.cfg, track.opts, options, track.cfg );
            track.privateFn.setBaseCategory();
            track.privateFn.bindEvents();
        },
        /* 
         * Dumps all click tracked elements and events to the console for testing purposes. 
         *
         * @method deubg
         *
         */
        'debug': function() {
            // stash _gaq temporarily
            var oldGAQ = _gaq;
            // swap it for a basic array
            _gaq = [];
            // trigger all our click events
            $( 'a' ).trigger( 'click.ge.track', [{ 'debug': true }] );
            // trigger all form submissions
            $( 'form' )
                .bind( 'submit.temp', function( e ) {
                    e.preventDefault();
                } )
                .trigger( 'submit', [{ 'debug': true }] )
                .unbind( 'submit.temp' );

            // bind video tracking events
            // $( 'body' ).on( 'play.ytVideo', '.yt-video', track.evt.videoPlay );
            // $( 'body' ).on( 'playback.ytVideo', '.yt-video', track.evt.videoPlayback );

            // dump each tracking request as a CSV
            console.info( 'Click & Form tracking on ' + window.location.href );
            console.log( _gaq.join( '\n' ) );
            // restore _gaq
            _gaq = oldGAQ;
            //clear out the temporary pointer
            delete oldGAQ;
        },
        /*
         * Provides a wrapper for tracking events with google analytics. 
         * 
         * @method trackEvent 
         * @param category string The name of the category being tacked. Google Analytics specific value.
         * @param action string The name of the action being tacked. Google Analytics specific value.
         * @param label string The label to give the tracking event. Google Analytics specific value.
         */
        'trackEvent': function( category, action, label ) {
            var args = ['_trackEvent', category, action, label];
            if ( track.cfg.debug ) {
                console.log( "TrackEvent:", args );
            }
            if ( track.cfg.trackingEnabled ) {
                _gaq
                    .push( args );
            }
        }
    };

    track.evt = {
        /* 
         * Click event handler
         *
         * @method click
         * @param {Event} e The event object
         */
        'click': function( e ) {
            var $this = $( this ),
                category = track.privateFn.getCategory( $this ),
                action = track.privateFn.getClickAction( $this ),
                label = track.privateFn.getClickLabel( $this );
            // don't do a thing if this has a notrack attribute
            if ( $this.not( '[data-ga-notrack]' ).length > 0 ) {
                track.publicFn.trackEvent( category, action, label );
            }
        },
        /* 
         * Submit event handler
         *
         * @method submit
         * @param {Event} e The event object
         */
        'submit': function( e ) {
            var $this = $( this ),
                category = track.privateFn.getCategory( $this ),
                action = 'Form Submit',
                label = '';
            // don't do a thing if this has a notrack attribute
            if ( $this.not( '[data-ga-notrack]' ).length > 0 ) {
                track.publicFn.trackEvent( category, action, label );
            }
        },
        /* 
         * Video play event handler.
         *
         * @method videoPlay
         * @param {Event} e The event object
         * @param {Object} context The yt-video context object
         */
        'videoPlay': function( e, context ) {
            var $this = $( this ),
                category = track.privateFn.getCategory( $this ),
                action = 'Playback - ',
                label = '',
                videoID = context.player.getVideoUrl().match(/v=([^&]*)/)[1];
            if ( ! context.playTracked ) {
                // only track one play per video per page load
                context.playTracked = true;
                track.publicFn.trackEvent( category, 'Video Play', videoID );
            }
        },
        /* 
         * Video playback event handler - tracks playback progression.
         *
         * @method videoPlay
         * @param {Event} e The event object
         * @param {Object} context The yt-video context object
         */
        'videoPlayback': function( e, context) {
            var $this = $( this ),
                category = track.privateFn.getCategory( $this ),
                action = 'Video Playback - ',
                label = '',
                t = context.player.getCurrentTime(),
                videoID = context.player.getVideoUrl().match(/v=([^&]*)/)[1];
            if ( typeof( context.duration ) === 'undefined' || context.duration <= 0 ) {
                context.duration = context.player.getDuration();
                context.progress = 0;
            } else {
                if ( context.progress < Math.ceil( ( t / context.duration ) * 10 ) ) {
                    context.progress = Math.ceil( ( t / context.duration ) * 10 );
                    track.publicFn.trackEvent( category, action + context.progress + '0', videoID );            
                }
            }
        }
    };


    track.privateFn = {
        /* 
         * All automatic event bindings are done here. We bind events to the following things:
         *  - Click events on a tags that do not have a data-ga-notrack attribute.
         *
         * @method bindEvents
         *
         */
        'bindEvents': function() {
            // bind tracking evnets to all links
            $( 'body' ).on( 'click.ge.track', 'a', track.evt.click );
            // bind tracking events to all form submits
            $( 'body' ).on( 'submit.ge.track', 'form', track.evt.submit );
            // bind video tracking events
            $( 'body' ).on( 'play.ytVideo', '.yt-video', track.evt.videoPlay );
            $( 'body' ).on( 'playback.ytVideo', '.yt-video', track.evt.videoPlayback );
        },
        /* 
         * This method sets the base category variable based on the current page title
         *
         * @method setBaseCategory
         */
        'setBaseCategory': function() {
            track.cfg.category = $( 'title' ).text();
        },
        /* 
         * A method to determine the most appropriate category for a tracking event
         * Using the base category as our default, we then start with the element that 
         * triggered the event, and traverse up the DOM, looking for either an id or a data-ga-category
         * attribute to append to our base category and make our category more specific.
         *
         * @method getCategory
         * @param {Object} $ele jQuery object containing the element that triggered the event
         * @return {String} The category to be used in the trackEvent call
         */
        'getCategory': function( $ele ) {
            // start with the base category
            var category = track.cfg.category,
                // look for a more specific label that we can add
                // either a data-ga-category or an id attribute, whichever comes first
                $specifier = $ele.closest( '[data-ga-category],[id]' );

            if ( $specifier.size() > 0 ) {
                // if we have a specifier, append the attribute to our base category
                if ( $specifier.is('[data-ga-category]' ) ) {
                    category += ' - ' + $specifier.data( 'ga-category' );
                } else if ( $specifier.is( '[id]' ) ) {
                    category += ' - ' + $specifier.attr( 'id' );
                }
            }
            return category;
        },
        /* 
         * A method to determine the most appropriate action for tracking a click event
         * We check for the following, in order:
         *  - data action attribute
         *  - external link
         *  - internal link
         * 
         * Example Actions:
         * Action parameter: video Name, Images, Inbound links, 
         * OutBound links, Forms, Downloads, Flash Games, Social Plugins etc 
         *
         * @method getClickAction
         * @param {Object} $ele jQuery object containing the element that triggered the event
         * @return {String} The action to be used in the trackEvent call
         */
        'getClickAction': function( $ele ) {
            var action = 'Click - Generic Link',
                href = $ele.attr( 'href' ),
                ext = ( href && href.length ) > 0 ? href.match(/[^\s]+(\.(pdf|zip|rar|txt|doc|docx|xcl))$/) : null,
                $specifier = $ele.closest( '[data-ga-action]' );
            // look for a ga-action attribute
            if ( $specifier.length > 0 ) {
                // has a specified action label
                action = $specifier.data( 'ga-action' );
            } else if ( ext && ext.length > 1 ) {
                label = "Click - Download ." + ext[1];
            } else if ( href && href.match( track.cfg.regex.mailto ) ) {
                action = "Click - Mailto Link";
            } else if ( href && href.match( track.cfg.regex.external ) ) {
                // matches our external link regex
                action = 'Click - Outbound Link';
            } else if ( href && href.match( track.cfg.regex.internal ) ) {
                action = 'Click - Inbound Link';
            }
            return action;
        },
        /* 
         * A method to determine the most appropriate label for tracking a click event.
         * Starting with the element's text as a default, we check for the following, in order:
         *  - data-ga-label attribute
         *  - href attribute
         *
         * Feedback:
         * video completion percentages, Facebook Likes, Tweet Share, Pin in on Pinterest,  
         * Name of PDF downloaded, name of image, inbound & outbound text links or buttons etc
         *
         * @method getClickLabel
         * @param {Object} $ele jQuery object containing the element that triggered the event
         * @return {String} The label to be used in the trackEvent call
         */
        'getClickLabel': function( $ele ) {
            // use the link text as the base label
            var label = $ele.text().replace(/\s+/g, " "),
                href = $ele.attr( 'href' ),
                title = $ele.attr( 'title' ),
                custom = $ele.attr( 'data-ga-label' );
            if (  custom && custom.length > 0 ) {
                // if we have a data-ga-label attribute, use that 
                label = custom;
            } else if ( $ele.closest( '.hnav' ).length > 0 ) {
                // check for conditions where we want to stick with the default
                return label;
            } else if ( href && href.match( track.cfg.regex.mailto ) ) {
                // check for mailto links
                label = href.match( track.cfg.regex.mailto )[1];
            } else if( title && title.length > 0 ) {
                label = title;
            } else if ( href && href.match(/^(?!\#).+/) ) {
                // if the href attribuet is not blank and doesn't start with a hash, use that as the label
                label = href;
            }
            return label;
        }
    };

    geui.registerModule( track );

    return track.publicFn;

} );