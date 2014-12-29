// HOT PROBS Chat client-side functionality
;(function($, window, io) {

	var pchatClient = {
		'cfg': {
			// grab screenname from end of URL
			'screenname': window.location.search.substring(1).split("=")[1],
			'socket_id': null,
			'socket': null,
			'$msg': null,
			'$incoming': null,
			'$header': null
		},
		'evt': {
			'ready': function() {
				pchatClient.fn.init();
			}
		},
		'fn': {
			'init': function() {
				// set up DOM elements
				pchatClient.cfg.$msg = $('#msg');
				pchatClient.cfg.$incoming = $('#incoming');
				pchatClient.cfg.$header = $('#header');
				// bind events
				pchatClient.cfg.$msg.focus();
				pchatClient.cfg.$msg.keypress( function( e ) {
					if( e.which == 13 ) {
						pchatClient.fn.sendMessage();
						return false;
					}
				});
				pchatClient.cfg.$header.click(function() {
					pchatClient.cfg.screenname = "";
					window.location = '/';
				})
				// setting the blur callback for iOS devices
				// captures hitting the 'done' button (takes focus off $msg textfield)
				pchatClient.cfg.$msg.blur( pchatClient.fn.sendMessage );
				// set socket connection to listen on the 'chat' namespace
				pchatClient.cfg.socket = io.connect('/pchat');
				pchatClient.cfg.socket.on( 'userReady', pchatClient.fn.userReady );
				pchatClient.cfg.socket.on( 'userMessage', pchatClient.fn.userMessage );
				pchatClient.cfg.socket.on( 'userDisconnected', pchatClient.fn.userDisconnected );

				// register the user's name with the socket connection on the server
				pchatClient.cfg.socket.emit('userReady', {name : pchatClient.cfg.screenname});				
			},
			'autoscroll': function() {
				var incoming = document.getElementById( 'conversation' );
					incoming.scrollTop = incoming.scrollHeight;
			},
			'sendMessage': function() {
				// broadcast userMessage event with user's screenname + message
				// if message is not blank
				if(pchatClient.cfg.$msg.val() != '') {

					pchatClient.cfg.socket.emit( 'userMessage', 
											{ 
												name: pchatClient.cfg.screenname, 
												message: pchatClient.cfg.$msg.val() 
											});
				}
				// set message field to blank after sending
				pchatClient.cfg.$msg.val('');
			},
			'userReady': function( data ) {
				pchatClient.cfg.socket_id = data.id;

				// get how many people are currently connected
				var i = 0;
				for (var p in data.connections) i++;

				// form the introduction string
				var intro_str = '';
				if ( i == 1 ) {
					// if only one person in the room...
					intro_str = 'No one is here yet... give it a few seconds?';
				}
				else {
					// otherwise, make an introduction...
					var met = false;
					for ( var p in data.connections ) {
						intro_str += data.connections[p];
						// i know this is horrible form -- just overly tired right now
						if( !met ) {
							intro_str += ', meet ';
							met = true;
						}
						else {
							intro_str += '... ?';
						}
					}
				}
					
				// broadcast a message to users
				var decoded = decodeURIComponent( data.name );
				pchatClient.cfg.$incoming
					.append( '<div class="green"> > '+decoded+' connected</div>');
				pchatClient.fn.autoscroll();
				pchatClient.cfg.$incoming
					.append( '<div class="hot-pink"> > *** Welcome to Hot Probs, '+decoded+'!!! ***</div>')
					.append( '<div class="off-white"> > ***  '+intro_str+' ***</div>');
				pchatClient.fn.autoscroll();
			},
			'userMessage': function( data ) {
				if( data.name ) {
					var decoded = decodeURIComponent( data.name );
					pchatClient.cfg.$incoming
						.append( '<div style="color:'+data.color+'">'+decoded+' > '+data.message+'</div>');
					pchatClient.fn.autoscroll();
				}
			},
			'userDisconnected': function( data ) {
				if( data.name ) {
					var decoded = decodeURIComponent( data.name );
					pchatClient.cfg.$incoming
						.append('<span style="color:#009a16;font-style:italic;"> > '+decoded+' disconnected</span><br>');
					pchatClient.fn.autoscroll();
				}
			}
		}
	};

	pchatClient.evt.ready();
	
}(jQuery, window, io));