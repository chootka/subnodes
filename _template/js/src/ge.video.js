/*! 
* GE Video
* part of the GE UI Kit
* Handles rendering youtube and brightcove videos.
*
*/

define( 'geui/video', ['geui/track', 'jQuery', 'lodash'], function ( geuiTrack, $, _ ) {

	// Define an object to hold our code
	var video = {};

	// Compatability for geui
	video.name = "video";
	video.autoinit = false;

	// Define configuration settings.
	// These should not be able to be overriden outside of this code
	video.cfg = {
		'fallbackCountries': ['china', 'iran', 'libya', 'turkmenistan'],
		'youtubeSupport': true,
		'brigthcoveTmpl': '<object id="myExperience-{ID}" class="BrightcoveExperience">' +
							'<param name="bgcolor" value="#FFFFFF" />' +
							'<param name="wmode" value="transparent" />' +
							'<param name="playerID" value="1213033043001" />' +
							'<param name="playerKey" value="AQ~~,AAAAAH8oK3k~,_eXHhjsNJU970nDNAkJUiQ60EtECXxa8" />' +
							'<param name="isVid" value="true" />' +
							'<param name="isUI" value="true" />' +
							'<param name="dynamicStreaming" value="true" />' +
							'<param name="@videoPlayer" value="{ID}" />' +
						'</object>'
	};

	// Define options
	// These should be able to be overriden outside of this code
	video.opts = {
		'countryName': 'United States'
	};

	// Define event handlers
	video.evt = {
		'ready': function() {
			video.privateFn.regionPlayerPatch();
		}
	}
	// Define protected functions
	// These are only for internal use, and are not exposed
	video.privateFn = {
		// Called when the jobs data is recieved and we should know what country our user is in
		'setYoutubeSupport': function( ) {
			var country = video.cfg.countryName,
				// look for the country query string parameter
				param = unescape( window.location.search ).match( /country\=([a-zA-Z0-9\s]+)/ );
			// if the user has passed the country through the query string, try to respect it
			if ( param ) {
				country = param[1];
			} 
			if ( country ) {
				if ( video.cfg.fallbackCountries.indexOf( country.toLowerCase() ) != -1 ) {
					video.cfg.youtubeSupport = false;
				} else {
					video.cfg.youtubeSupport = true;
				}
			} else {
				video.cfg.youtubeSupport = true;
			}
		},
		'renderVideos': function() {
			if ( video.cfg.youtubeSupport ) {
				$( '.geui-video[data-video-yt]' ).ytVideo();
			} else {
				// render brightcove players for all!
				$( '.geui-video[data-video-bc]' ).each( function() {
					var $container = $( this ),
						$player = $( video.cfg.brigthcoveTmpl
								.replace( /\{ID\}/gm, $container.data( 'video-bc' ) ) ),
						ratio = (900/16);
					// if both the width and height attribuets are present, 
					// calculate and apply our aspect ratio
					if ( $container.is( '[data-video-width]' ) && $container.is( '[data-video-height]' ) ) {
						ratio = ( $container.data( 'video-height' ) / $container.data( 'video-width') ) * 100;
						$container.css( 'padding-bottom', ratio + "%")
					}
					$container.append( $player ); 
				} );
				brightcove.createExperiences();
			}
		}
	};

	// Define public functions

	video.publicFn = {
		'init': function( options ) {
			// Setup our configuration - options overwrites video.opts, and video.cfg overwrites them all. 
            _.extend( video.cfg, video.opts, options, video.cfg );
			video.privateFn.setYoutubeSupport();
			$( '.geui-video' ).each( function( n, ele ) {
				video.publicFn.render( $( ele ) );
			})
			// video.privateFn.renderVideos();
		},
		'render': function( $ele ) {
			var $container = $ele,
				$player;
			if ( video.cfg.youtubeSupport && $ele.is( '[data-video-yt]' ) ) {
				$player = $( '<div clas="yt-video"></div>' )
					.attr( 'data-yt-ref', $ele.data( 'video-yt' ) );
				$container.append( $player );
				$player.ytVideo();
			} else if ( $ele.is( '[data-video-bc]' ) ) {
				// render brightcove players for all!
				var $container = $ele,
					$player = $( video.cfg.brigthcoveTmpl
							.replace( /\{ID\}/gm, $container.data( 'video-bc' ) ) ),
					ratio = (900/16);
				// if both the width and height attribuets are present, 
				// calculate and apply our aspect ratio
				if ( $container.is( '[data-video-width]' ) && $container.is( '[data-video-height]' ) ) {
					ratio = ( $container.data( 'video-height' ) / $container.data( 'video-width') ) * 100;
					$container.css( 'padding-bottom', ratio + "%")
				}
				$container.append( $player ); 
				brightcove.createExperiences();
			}
		}
	};

	geui.registerModule( video );


	return video.publicFn;

});


