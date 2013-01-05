/*
 * ytVideo - A jQuery plugin to handle embeding youtube videos with the API
 * "http://www.youtube.com/embed/n_MM1eazcjY?rel=0&amp;hd=1&amp;wmode=transparent&amp;fmt=22&enablejsapi=1&playerapiid=ytplayer"
 * Usage: 
 * Create an iframe like this:
 * <iframe width="625" height="380" class="yt-video" src="http://www.youtube.com/embed/n_MM1eazcjY?rel=0&amp;hd=1&amp;wmode=transparent&amp;fmt=22&enablejsapi=1" frameborder="0" allowfullscreen>
 * </iframe>
 * 
 * OR create a div like this: 
 *  <div class="yt-video" style="width:625;height=380px" data-yt-ref="n_MM1eazcjY"></div>
 *
 * Then on document.ready run this: 
 *   $( '.yt-video' ).ytVideo();
 *
 *
 *
 *
 */
( function( $ ) {
	
	var yt = {
		config: {
			'stepperInterval': null
		},
		options: {
			width: 640,
			height: 360,
			quality: 'large',
			playerVars: {
				'autoplay': 1
			}
		},
		evt: {
			'onapiready': function( e ) {
				var context = e.data.context;
				yt.fn.setup( context );
			},
			'onReady': function( context, e ) {
				e.target.cueVideoById( context.videoID, 0, context.quality );
			},
			'onStateChange': function( context, e ) {
				// rebroadcast trackable events
				switch( e.data ) {
					case 1:
						// playing -- bind the stepper
						context.stepperInterval = setInterval( function() {
							yt.fn.playbackStep( context );
						}, 1000 );
						// trigger play
						context.$container.trigger( 'play.ytVideo', context );
						break;
					case 2: 
						// trigger pause
						context.$container.trigger( 'pause.ytVideo', context );
						// paused -- unbind the stepper
						clearInterval( context.stepperInterval );
						break;
				}
			}
		},
		fn: {
			init: function( context ) {
				if ( 'YT' in window && 'Player' in YT ) {
					yt.fn.setup( context );
				} else {
					$( window ).bind( 'youtubeplayerapiready.ytVideo', { context: context }, yt.evt.onapiready );
				}
			},
			setup: function( context ) {
				yt.fn.setID( context );
				yt.fn.embed( context );
			},
			setID: function( context ) {
				if ( context.$video.is( 'iframe' ) ) {
					context.videoID = context.$video.attr('src').match(/\/embed\/([a-zA-Z0-9\_\-]+)/)[1];
				} else {
					context.videoID = context.$video.data( 'yt-ref' );
					context.videoID = context.videoID || context.$video.data( 'video-yt' );
				}
				context.elID = context.$container.attr( 'id' );
				context.$video.removeClass( 'yt-video' );
				if ( typeof( context.elID ) === 'undefined' || context.elID === null || context.elID === '' ) {
					// set a random ID if one has not been set
					context.elID = 'ytVideo-' + Math.ceil(Math.random()*(new Date()).getTime()); 
					context.$video.attr( 'id', context.elID );
				}
			},
			embed: function( context ) {
				var playerParameters = {
					'height': context.height,
					'width': context.width,
					'playerVars': context.playerVars,
					'events': {
						'onReady': function( e ) {
							yt.evt.onReady( context, e );
						},
						'onStateChange': function( e ) {
							yt.evt.onStateChange( context, e );
						}
					}
				};
				if ( context.videoID ) {
					playerParameters.videoId = context.videoID;
				}
				playerParameters.playerVars.wmode = 'transparent';
				playerParameters.enablejsapi = 1;
				playerParameters.origin = window.location.host;
				context.player = new YT.Player( context.elID, playerParameters );
			},
			// triggered once a second durring playback
			'playbackStep': function( context ) {
				context.$container.trigger( 'playback.ytVideo', context );
			}
		}
	};
	
	$.ytVideo = yt;

	$.fn.ytVideo = function ( options ) {
		options = options || {};
		return $( this ).each( function() {
			var context = {},
				$video = $( this ),
				$container;
			// ensure we don't re-initialize our videos
			if ( ! $video.data( 'ytVideoContext' ) ) {
				// wrap
				$container = $video.wrap( '<div class="yt-video"></div>' ).parent()
				// attempt to set the width and height options from the container, if they're not passed in
				options.aspectRatio = options.aspectRatio || 16/9;
				options.width = options.width || $container.width();
				options.height = options.height || options.width / options.aspectRatio;

				context = $.extend( context, yt.options, options, yt.config );
				context.$container = $container;
				context.$video = $video;
				context.$container.data( 'ytVideo-context', context );
				yt.fn.init( context );
			}
		} );
	};
	
	window.onYouTubePlayerAPIReady = function() {
		$( window ).trigger( 'youtubeplayerapiready' );
	};
}( jQuery ) );