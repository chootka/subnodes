/*! 
* GE UI Radio Buttons
* part of the GE UI Kit
* A lightweight wrapper around radio button inputs to allow for better presentation
*
*/

(function($) {
	
	var pluginName = "radioBtn",
		groupClass = "geui-radio-button-group",
		radioSelector = "input[type=radio]",
		initSelector = "." + groupClass + " " + radioSelector,
		labelClass = "geui-radio-button",
		tickClass = "geui-radio-button-tick",
		tickSelectedClass = "geui-radio-button-tick-selected",
		$allRadio = null,
		idxRadio = -1,
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
				var $radio = $( this ),
					$label = $radio.closest( 'label' ),
					$tick = $( '<span />' ),
					$group = $radio.closest( '.' + groupClass ),
					$allRadio = $group.find(radioSelector);

				// wrap the label in a div for handling tabbing
				 $label
				 	.wrap( '<div class="geui-radio-button-wrapper"></div>');

				

				//Add tabcontrol
 				$label
 					.parent()
 					.attr("tabindex", 0)
 					.focus(function(e){
 						idxRadio = $label.parents('.' + groupClass + ' > div').index();
 					})
 					.bind("keydown", function( evt ){
 						var $nextRadio, $prevRadio, next = idxRadio;
 						switch( evt.keyCode ) {
 							// enter
 							case 13:
 								// trigger our click handler
 								$label
 									.trigger( "click" );
 								break;
 							// right or down
 							case 39:
 							case 40:
 								// find the next radio button in this group and give it focus
 								next = idxRadio + 1;
				 				if(next > $allRadio.length - 1)
				 					next = 0;

 								$nextRadio = $group.find("label:eq("+next+")");
 								$nextRadio.parent().focus();

 								//change the radio button, which update the custon UI
 								$nextRadio.find("input[type=radio]").change();
 								break;
 							case 37:
 							case 38:
 								// find the previous radio button in this group and give it focus
				 				next = idxRadio - 1;
				 				if(next < 0)
				 					next = $allRadio.length - 1;

 								$prevRadio = $group.find("label:eq("+next+")");
 								$prevRadio.parent().focus();

 								//change the radio button, which update the custon UI
 								$prevRadio.find("input[type=radio]").change();
 								break;
 						}
 					});

				// bind a change event to the radio button, incase it's changed via javascript
				$radio
					.bind( 'focus.' + pluginName, function( evt ) {
						if ( !this.checked ) return;
						if ( !this.was_checked ) {
						  $( this ).change();
						}
					} )
					.bind( 'change.' + pluginName, function( evt ) {

						if ( this.was_checked ) {
						  evt.stopImmediatePropagation();
						  return;
						}
						$( "input[name=" + this.name + "]" ).each( function() {
						  this.was_checked = this.checked;
						} );

						//if(!this.checked)
						$radio[ pluginName ]( 'toggle' );
					} );

				$label
					.addClass( labelClass )
					.attr( 'tabindex', 0 );
				$tick
					.addClass( tickClass );

				$label
					.append( $tick );
				$label
					.bind( 'click.' + pluginName, function(evt) {
						evt.preventDefault();
						$radio[ pluginName ]( 'toggle' ); 
					} );

				//Prechecked ?
				if($radio[0].checked)
				{
					idxRadio = $label.parents('.' + groupClass + ' > div').index();
					$label.find("input[type=radio]").change();
				}	

				return $radio;
			},
			toggle: function() {
				var $radio = $( this ),
					$label = $radio.closest( 'label' ),
					$tick  = $label.find( '.' + tickClass ),
					$group = $radio.closest( '.' + groupClass );
				// unset the active radio button, if there is one

				$group.find( '.' + labelClass )
					.each( function() { 

						$( this )
							.find( '.' + tickSelectedClass )
							.removeClass( tickSelectedClass );
						$( this )
							.find( radioSelector )
								.attr( 'checked', false );
					} );

				$tick
					.addClass( tickSelectedClass );

				$radio
					.attr( 'checked', true );

				$radio.trigger( "change." + pluginName );

				return $radio;
			},
			uncheck : function(){
				var $radio = $( this );

				this.checked = false;
				$radio.attr("checked", false).change();				

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