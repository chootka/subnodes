// HOT PROBS Chat client-side functionality
;(function($, window, io) {

	var chatClient = {
		'cfg': {
			// grab screenname from end of URL
			'screenname': window.location.search.substring(1).split("=")[1],
			'socket': null,
			'$msg': null,
			'$incoming': null
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
				// bind events
				chatClient.cfg.$msg.focus();
				chatClient.cfg.$msg.keypress( function( e ) {
					if( e.which == 13 ) {
						chatClient.fn.sendMessage();
						return false;
					}
				});
				// setting the blur callback for iOS devices
				// captures hitting the 'done' button (takes focus off $msg textfield)
				chatClient.cfg.$msg.blur( chatClient.fn.sendMessage );
				// set socket connection to listen on the 'chat' namespace
				chatClient.cfg.socket = io.connect('/chat');
				chatClient.cfg.socket.on( 'status', chatClient.fn.onStatus );
				chatClient.cfg.socket.on( 'userReady', chatClient.fn.userReady );
				chatClient.cfg.socket.on( 'userMessage', chatClient.fn.userMessage );
				chatClient.cfg.socket.on( 'userDisconnected', chatClient.fn.userDisconnected );
				// register the user's name with the socket connection on the server
				chatClient.cfg.socket.emit('userReady', {name : chatClient.cfg.screenname });				
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
			'status': function( connections ) {
				//var i = 0;
				//for (var p in connections) i++;
				//var str = i > 1 ? ' are ' + i + ' people ' : ' is ' + i + ' person ';
				//$('#connected').html( 'There ' + str + ' current connected' );
			},
			'userReady': function( data ) {
				if( data.name ) {
					var decoded = decodeURIComponent( data.name );
					chatClient.cfg.$incoming
						.append( '<div style="color:#00ff24;font-style:italic"> > '+decoded+' connected</div>');
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
			},
			'announcement': function( data ) {
				if( data.name ) {
					var decoded = decodeURIComponent( data.name );
					chatClient.cfg.$incoming
						.append('<span style="width:100%;margin:auto;text-align:center;color:'+data.color+'">'+decoded+'</span> > <span style="color:#8a00ff">disconnected</span><br>');
					chatClient.fn.autoscroll();
				}
			}
		}
	};

	chatClient.evt.ready();
	
}(jQuery, window, io));