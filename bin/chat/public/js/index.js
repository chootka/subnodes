// HOT PROBS landing page
;(function($, window) {

	var index = {
		'cfg': {
			'$screenname': null,
			'$joinButton': null,
			'$luckyButton': null,
			'screenname': null
		},
		'evt': {
			'ready': function() {
				index.fn.init();
			}
		},
		'fn': {
			'init': function() {
				// set up DOM elements
				index.cfg.$screenname = $( '#screenname' );
				index.cfg.$joinButton = $( '#joinButton' );
				index.cfg.$luckyButton = $( '#luckyButton' );
				index.cfg.$screenname.keypress( function( e ) {
					if ( e.which == 13 ) {
						index.fn.joinChat();
						return false;
					}
				});
				index.cfg.$joinButton.click( function() {
					index.fn.joinChat();
				});
				index.cfg.$luckyButton.click( function() {
					index.fn.joinPChat();
				});
			},
			'joinChat': function( e ) {
				// validate that screenname isn't blank before proceeding
				index.cfg.screenname = index.cfg.$screenname.text();
				var valid = index.fn.validateName();
				if ( valid ) {
					// pass the screenname onto the chat page
					window.location = "/chat?screenname="+index.cfg.screenname;
				}
			},
			'joinPChat': function( e ) {
				// validate that screenname isn't blank before proceeding
				index.cfg.screenname = index.cfg.$screenname.text();
				var valid = index.fn.validateName();
				if ( valid ) {
					// pass the screenname onto the chat page
					window.location = "/pchat?screenname="+index.cfg.screenname;
				}
			},
			'validateName': function() {
				if ( index.cfg.screenname == '' || index.cfg.screenname == 'enter a name!' ) {
					index.cfg.$screenname.text( 'enter a name!' );
					return false;
				}
				return true;
			}
		}
	}

	index.evt.ready();
	
}(jQuery, window));