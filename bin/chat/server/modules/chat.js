module.exports = function(io) {

	var colors = ['#dfe937', '#ff9b39', '#2fa9f0', '#946af1', '#39f0c3'];
	var connections = {};

	io
		.of('/chat')
		.on('connection', function( socket ) {

			// record client connection to connections obj
			connections[socket.id] = {};

			// give each connected user a random color so it's easier to tell them apart in the chat log
			socket.on('userReady', function( data ) {
				// pass socket id to client
				data.id = socket.id;
				// save client username in the socket session for this client
				socket.set('name',data.name);
				// save client color in the socket session for this client
				data.color = colors[Math.floor(Math.random() * colors.length)];
				socket.set('color',data.color);
				
				// send user to main room and let everyone know
				data.connections = connections;
				broadcastMessage( 'userReady', data );
			});

			socket.on('userMessage', function( data ) {
				socket.get('color', function (err, color) {
					data.color = color || '#ffffff';
					broadcastMessage( 'userMessage', data );
				});
			});

			socket.on('disconnect', function() {
				socket.get('name', function (err, name) {
					delete connections[socket.id];
					broadcastMessage('userDisconnected', { name : name });
				});				
			});

			function broadcastMessage( message, data ) {
				data.connections = connections;
				// remove socket.emit if you don't want the sender to receive their own message
				socket.emit( message, data );
				socket.broadcast.emit( message, data );
			}

			function getObjectSize( obj ) {
				var size = 0, key;
				for (key in obj) {
					if (obj.hasOwnProperty(key)) size++;
				}
				return size;
			}
		});
};