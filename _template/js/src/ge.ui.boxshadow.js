/*! 
* GE UI Videoplayer 
* part of the GE UI Kit
* A lightweight wrapper around a video player
*
*/

(function($) {
	
	var pluginName    = "boxshadow",
		initSelector  = ".geui-" + pluginName,
		tpl           = '<div class="geui-'+ pluginName+'-wpshadow"><div class="geui-'+ pluginName+'-shadow"></div></div> ',
		$_shadow = null,
		$_wrapper = null,

		methods = {
			_create: function(){
				// Disable for iOS devices (their native controls are more suitable for a touch device)
				//if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) return false;

				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					[ pluginName ]( "_addTpl" )
					.trigger( "create." + pluginName );
			},
			_init: function(){
				var $box = $( this );

				return $box;
			},
			_addTpl : function(){

				var $box = $( this );

				$_wrapper = $('<div class="geui-'+ pluginName+'-wrapper"></div>');
				$_shadow  = $( tpl );

				$box.wrap( $_wrapper )
					.after( $_shadow );

				//z-index
				var zIndex = $box.css("zIndex");

				$_wrapper.css({ zIndex : zIndex});
				$box.css({ zIndex : 1 });
				$_shadow.css({ zIndex : 0});

				return $( this);
			},
			destroy: function(){
				
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

}(jQuery));

(function($) {
	
	var pluginName    = "innershadow",
		initSelector  = ".geui-" + pluginName,
		tpl           = '<div class="geui-'+ pluginName+'-wpshadow"><div class="geui-'+ pluginName+'-shadow"></div></div> ',
		$_shadow = null,
		$_wrapper = null,

		methods = {
			_create: function(){
				// Disable for iOS devices (their native controls are more suitable for a touch device)
				//if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) return false;
				
				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					[ pluginName ]( "_addTpl" )
					.trigger( "create." + pluginName );
			},
			_init: function(){
				var $box = $( this );

				return $box;
			},
			_addTpl : function(){

				var $box = $( this );

				$_wrapper = $('<div class="geui-'+ pluginName+'-wrapper"></div>');
				$_shadow  = $( tpl );

				$box.wrap( $_wrapper )
					.after( $_shadow );

				//z-index
				var zIndex = $box.css("zIndex");

				$_wrapper.css({ zIndex : zIndex});
				$box.css({ zIndex : 1 });
				$_shadow.css({ zIndex : 0});

				return $( this);
			},
			destroy: function(){
				
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

}(jQuery));