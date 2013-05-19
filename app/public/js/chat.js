// HOT PROBS Chat client-side functionality
;(function($, window, io) {

	var chatClient = {
		'cfg': {
			// grab screenname from end of URL
			'screenname': window.location.search.substring(1).split("=")[1],
			'lucky': window.location.search.substring(1).split("=")[2],
			'socket_id': null,
			'socket': null,
			'$msg': null,
			'$incoming': null,
			'$header': null
		},
		'evt': {
			'ready': function() {
				chatClient.fn.init();
			}
		},
		'fn': {
			'init': function() {
				// set up DOM elements
				chatClient.cfg.$msg = $('#msg');
				chatClient.cfg.$incoming = $('#incoming');
				chatClient.cfg.$header = $('#header');
				// bind events
				chatClient.cfg.$msg.focus();
				chatClient.cfg.$msg.keypress( function( e ) {
					if( e.which == 13 ) {
						chatClient.fn.sendMessage();
						return false;
					}
				});
				chatClient.cfg.$header.click(function() {
					chatClient.cfg.lucky = "false";
					chatClient.cfg.screenname = "";
					window.location = '/';
				})
				// setting the blur callback for iOS devices
				// captures hitting the 'done' button (takes focus off $msg textfield)
				chatClient.cfg.$msg.blur( chatClient.fn.sendMessage );
				// set socket connection to listen on the 'chat' namespace
				chatClient.cfg.socket = io.connect('/chat');
				chatClient.cfg.socket.on( 'userReady', chatClient.fn.userReady );
				chatClient.cfg.socket.on( 'userMessage', chatClient.fn.userMessage );
				chatClient.cfg.socket.on( 'userDisconnected', chatClient.fn.userDisconnected );
				chatClient.cfg.socket.on( 'joinedRoom', chatClient.fn.onJoinedRoom );
				chatClient.cfg.socket.on( 'gotPartner', chatClient.fn.onGotPartner );

				// register the user's name with the socket connection on the server
				chatClient.cfg.socket.emit('userReady', {name : chatClient.cfg.screenname, lucky: chatClient.cfg.lucky });				
			},
			'autoscroll': function() {
				var incoming = document.getElementById( 'conversation' );
					incoming.scrollTop = incoming.scrollHeight;
			},
			'sendMessage': function() {
				// broadcast userMessage event with user's screenname + message
				// if message is not blank
				if(chatClient.cfg.$msg.val() != '') {

					chatClient.cfg.socket.emit( 'userMessage', 
											{ 
												name: chatClient.cfg.screenname, 
												message: chatClient.cfg.$msg.val() 
											});
				}
				// set message field to blank after sending
				chatClient.cfg.$msg.val('');
			},
			'userReady': function( data ) {
				chatClient.cfg.socket_id = data.id;

				if( data.lucky == "true" ) {
					console.log("client side: userReady and lucky");
					// get how many people are currently connected
					var i = 0;
					for (var p in data.connections) i++;
					var intro_str;
					if ( i == 1 ) {
						intro_str = 'No one is here yet... give it a few seconds?';
					}
					else {
						var you = data.connections[chatClient.cfg.socket_id].name;
						var them;

						for (var p in data.connections) {
							if( p == chatClient.cfg.socket_id ) {
								you = data.connections[p].name;
							}
							else {
								them = data.connections[p].name;
							}
						}
						intro_str = you + ', meet ' + them;
					}
					
					// broadcast a message to users
					var decoded = decodeURIComponent( data.name );
					chatClient.cfg.$incoming
						.append( '<div class="green"> > '+decoded+' connected</div>');
					chatClient.fn.autoscroll();
					chatClient.cfg.$incoming
						.append( '<div class="hot-pink"> > *** Welcome to Hot Probs, '+decoded+'!!! ***</div>')
						.append( '<div class="hot-pink"> > ***  '+intro_str+' ***</div>');
					chatClient.fn.autoscroll();
				}
				else {
					console.log("client side: userReady and NOT lucky");
					// get how many people are currently connected
					var i = 0;
					for (var p in data.connections) i++;
					var str = i > 1 ? ' are ' + i + ' people ' : ' is ' + i + ' person ';
					var countStr = 'There ' + str + ' currently connected';
					
					// broadcast a message to users
					var decoded = decodeURIComponent( data.name );
					chatClient.cfg.$incoming
						.append( '<div class="green"> > '+decoded+' connected</div>');
					chatClient.fn.autoscroll();
					chatClient.cfg.$incoming
						.append( '<div class="hot-pink"> > *** Welcome to Hot Probs, '+decoded+'!!! ***</div>')
						.append( '<div class="hot-pink"> > ***  '+countStr+' ***</div>');
					chatClient.fn.autoscroll();
				}
			},
			'userMessage': function( data ) {
				if( data.name ) {
					var decoded = decodeURIComponent( data.name );
					chatClient.cfg.$incoming
						.append( '<div style="color:'+data.color+'">'+decoded+' > '+data.message+'</div>');
					chatClient.fn.autoscroll();
				}
			},
			'userDisconnected': function( data ) {
				if( data.name ) {
					var decoded = decodeURIComponent( data.name );
					chatClient.cfg.$incoming
						.append('<span style="color:#009a16;font-style:italic;"> > '+decoded+' disconnected</span><br>');
					chatClient.fn.autoscroll();
				}
			}
		}
	};

	chatClient.evt.ready();
	
}(jQuery, window, io));