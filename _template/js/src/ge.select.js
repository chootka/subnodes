/*! 
* GE UI Select 
* part of the GE UI Kit
* A lightweight wrapper around jquery.selectBox.js
*
*/

(function($) {
	
	var pluginName = "select",
		initSelector = ".geui-" + pluginName,
		/*
		transitionAttr = "data-transition",
		transitioningClass = pluginName + "-transitioning",
		itemClass = pluginName + "-option",
		activeClass = pluginName + "-active",
		hoverClass = pluginName + "-hover",
		*/
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
				var $select = $( this );

				// return if this has already been initialized
				if ( $select.is( '.selectBox' ) ) {
					return $select;
				}
				//Add tabcontrol
				$select.attr("tabindex", 0);

				$select.selectBox();
				
				$select
					.next()
						.find( '.selectBox-arrow' )
						.append( $( '<span />' )
							.addClass( 'geui-icon geui-icon-white geui-icon-down-arrow' ) );
				// changes for tracking
				$select
					.next()
						.attr( 'data-ga-notrack', true )
						.data( 'selectBox-options' )
							.attr('data-ga-category', $select.attr( 'id' ))
							.attr( 'data-ga-action', 'GEUI Select Change' );
				return $select;
			},
			destroy: function(){
				// TODO
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
			if( $( this ).data( pluginName + "active" ) ){
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

}(jQuery));