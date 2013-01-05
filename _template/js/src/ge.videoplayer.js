/*! 
* GE UI Videoplayer 
* part of the GE UI Kit
* Creates a popup player for links
*
*/

require( ['jQuery', 'lodash', 'geui/video'], function( $, _, geuiVideo ) {

	var pluginName    = "videoplayer",
		initSelector  = ".geui-" + pluginName,
		tpl           = '<div class="geui-'+ pluginName+'-overlay"></div> '+
						'<div class="geui-'+ pluginName+'-container container container-fixed">'+
							'<a href="#" title="Close" class="geui-'+ pluginName+'-close" >X</a>'+
					    	'<div class="geui-'+ pluginName+'-player"></div>'+
					    '</div>',
		$tplOverlay   = null,
		$tplContainer = null,
		$videoContainer = null,
		$close 		  = null,
		marginVideoContainer = 15,
		videoId = {
			yt : null,
			bc : null
		},

		size = {
			maxWidth : 640,
			maxHeight : 360,
			ratio : 16/9
		},

		resizer = _.throttle( function(){
	
			if($tplContainer == null)
				return;

			var wContainerDefault = 940;

			if($(window).width() >= 1200)
			{
				wContainerDefault = 1170;
			}
			else if( $(window).width() < 979 && $(window).width() > 768 )
			{
				wContainerDefault = 724;
			}
			else if( $(window).width() < 767  )
			{
				wContainerDefault = $(window).width();
			}

			var w = wContainerDefault;

			//max wdth ?
			if (w > size.maxWidth)
				w = size.maxWidth;

			var h = w / size.ratio;
			var top = $(window).height() / 2 - h / 2 - $close.height() / 2;

			if (top <= 0)
			{
				top = $(window).height() / 8;
			}

			if ( h > $(window).height() - top)
			{
				h = $(window).height() - ( 2 * top)
				w = h * size.ratio;
			}

			var left = $(window).width() / 2 - w / 2;

			$tplContainer.css({top : top, width : w , marginLeft:0, left:left});
			$videoContainer.css({height : h, width : w - (2 * marginVideoContainer) })


		}, 100),

		_onKeyDown = function(e){

			switch( e.keyCode ) {
				// esc
				case 27:
					// trigger our click handler
					$close
						.trigger( "click" );
					break;
				
			}

		},

		methods = {
			_create: function(){
				// Disable for iOS devices (their native controls are more suitable for a touch device)
				if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) return false;

				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					.trigger( "create." + pluginName );
			},
			_init: function(){

				var $btnPlayer = $( this );

				videoId.yt = $btnPlayer.data("video-yt");
				videoId.bc = $btnPlayer.data("video-bc");

				size.maxWidth  = ( $btnPlayer.data("video-width")  == undefined || $btnPlayer.data("video-width").length == 0 ) ? size.maxWidth : $btnPlayer.data("video-width");
				size.maxHeight = ( $btnPlayer.data("video-height") == undefined || $btnPlayer.data("video-height").length == 0 ) ? (size.maxWidth / size.ratio) : $btnPlayer.data("video-height");
				size.ratio = size.maxWidth / size.maxHeight;

				if( !videoId.yt && !videoId.bc)
					return $btnPlayer;

				$btnPlayer[ pluginName ]( "_bindEventListeners" );

				return $btnPlayer;
			},
			_bindEventListeners: function(){
				var $elem = $( this )
					.unbind("click.ge.video")
					.bind( "click.ge.video", function( e ){
						console.log( e, e.namespace );
						e.preventDefault();
						$elem[ pluginName ]( "_addTpl" );
					});
				
				return this;
			},
			_bindVideoplayerEventListeners: function(){
				var $elem = $( this )

				//Close
				$tplOverlay
					.unbind("click.ge.video")
					.bind( "click.ge.video", function( e ){
					e.preventDefault();
					$elem[ pluginName ]( "destroy" );
				});

				$close = $tplContainer.find('.geui-'+ pluginName+'-close');

				$close
					.unbind("click.ge.video")
					.bind( "click.ge.video", function( e ){
						e.preventDefault();
						$elem[ pluginName ]( "destroy" );
					});

				//Resize
				//$(window).
				$(window).on('resize', resizer);
				$(document).on("keydown", _onKeyDown);

				resizer();
				
				return this;
			},
			_addTpl : function(){

				var $elem = $( this ),
					$video;
	
				$( "body" ).prepend( tpl );

				$tplOverlay   = $( "body" ).find('.geui-'+ pluginName+'-overlay');
				$tplContainer = $( "body" ).find('.geui-'+ pluginName+'-container');

				$videoContainer = $tplContainer.find('.geui-'+ pluginName+'-player');

				$video = $( '<div class="geui-video"></div>' );

				_.each( ['yt', 'bc', 'height', 'width'], function( x ) {
					if ( $elem.data( 'video-' + x ) ) {
						$video.attr( 'data-video-' + x, $elem.data( 'video-' + x ) );
					}
				} );

				$videoContainer
					.append( $video );
				// render eet
				geuiVideo.render( $video );

				return $( this)
                		[ pluginName ]( "_bindVideoplayerEventListeners" );
			},
			destroy: function(){
				// TODO

				$(window).off('resize', resizer);
				$(document).off('keydown', _onKeyDown);

				$tplOverlay.remove();
				$("iframe", $videoContainer).hide(); //IE8 fix black screen
				$tplContainer.remove();

				$tplOverlay = null;
				$tplContainer = null;
				$videoContainer = null;
			}
		};
		
	// Collection method.
	$.fn[ pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {

			// if it's a method
			if( arrg && typeof( arrg ) === "string" ){
				return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			
			// don't re-init
			if( $( this ).data( pluginName + "data" ) ){
				return $( this );
			}
			
			// otherwise, init
			$( this ).data( pluginName + "active", true );
			$.fn[ pluginName ].prototype._create.call( this );
		});
	};
	
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods ); 
	
	// DOM-ready auto-init
	$( function(){
		$( initSelector )[ pluginName ]();
	} );

} );