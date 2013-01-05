/* 
 * Text Utilities - jquery plugins to help with sizing text to fit.
 * Requires jQuery and Underscore/Lodash (for debouncing resize events)
 * 
 * 
 */
( function( $, _ ) {
	
	$.fn.fitText = function( options ) {
		return $( this ).each( function() {
			var $text = $( this ),
				context = {
					maxWidth: $text.parent().width(),
					maxHeight: $text.parent().height(),
					originalFontSize: $text.css( 'font-size' )
				},
				textHeight = $text.height(),
				textWidth = $text.width(),
				fontSize = parseInt( $text.css('font-size' ), 10 );
			while( ( textHeight > context.maxHeight || textWidth > context.maxWidth ) && fontSize > 12 ) {
				fontSize = fontSize - 1;
				$text.css('font-size', fontSize );
				textHeight = $text.height();
				textWidth = $text.width();
			}
		} );
	};
	
	$.fn.verticallyCenter = function( options ) {
		return $( this ).each( function() {
			var $text = $( this ),
				attribute = 'margin-top',
				resizer = function() {
					// get parent height minus own height and devide by 2
					$text.css(
						attribute, ( ( $text.parent().height() - $text.height() ) / 2 )
					);
				};
			resizer();
			$(window).on('resize', resizer);
		} );
	};

	/*
	 * 	fitTextOnLine 
	 *	Does pretty much what you'd assume it would. Takes a line of text and makes sure it all 
	 *	fits on one line.
	 *
	 * TODO: do the calculations offscreen, with a clone of the DOM being scaled, then apply the 
	 * final text size to the original element. You shouldn't be messing with anything except
	 * the font-size rule.
	 *
	 */
	$.fn.fitTextOnLine = function( options ) {

		return $( this ).each( function() {
			var $text = $( this ),
				context = {
					maxWidth: $text.parent().width(),
					originalFontSize: $text.css( 'font-size' ),
					originalDisplay: $text.css( 'display' )
				},
				textWidth,
				maxFontSize = 140,
				minFontSize = 12,
				initialFontSize = 12,
				fontSize = initialFontSize,
				resizer = _.throttle( function() {
					if ( $text.css( 'display' ) === 'none' ) return;
					context.maxWidth = $text.parent().width();
					$text.css( { 'display': 'inline' } );
					// scale up
					while( ( textWidth < context.maxWidth ) && fontSize < maxFontSize ) {
						fontSize++;
						$text.css( { 'font-size': fontSize,
									 'line-height': fontSize + 'px' } );
						textWidth = $text.width();
						if ( ( textWidth >= context.maxWidth ) || fontSize >= maxFontSize ) {
							// last iteration
							$text.css( 'display', context.originalDisplay );
						}
					}
					// scale down
					while( ( textWidth > context.maxWidth ) && fontSize > minFontSize ) {
						fontSize--;
						$text.css( { 'font-size': fontSize,
									 'line-height': fontSize + 'px' } );
						textWidth = $text.width();
						if ( ( textWidth >= context.maxWidth ) || fontSize >= maxFontSize ) {
							// last iteration
							$text.css( 'display', context.originalDisplay );
						}
					}
				}, 100);
		
			$text.css( {
				'font-size': initialFontSize,
				'whiteSpace': 'nowrap',
				'display': 'inline' } );
			textWidth = $text.width()
	      	// Call once to set.
	      	resizer();
					
	      	// Call on resize. Opera debounces their resize by default. 
	      	$(window).on('resize', resizer);
			
		} );
	};

}( jQuery, _ ) );