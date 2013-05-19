module.exports = function(io) {

	var colors = ['#dfe937', '#ff9b39', '#2fa9f0', '#946af1', '#39f0c3'];
	var connections = {};

	io
		.of('/chat')
		.on('connection', function( socket ) {

			// give each connected user a random color so it's easier to tell them apart in the chat log
			socket.on('userReady', function( data ) {
				socket.name = data.name;
				socket.color = data.color = colors[Math.floor(Math.random() * colors.length)];
				broadcastMessage( 'userReady', data );
			});

			socket.on('userMessage', function( data ) {
				data.color = socket.color;
				broadcastMessage( 'userMessage', data );
			});

			function broadcastMessage( message, data ) {
				data.connections = connections;
				// remove socket.emit if you don't want the sender to receive their own message
				socket.emit( message, data );
				socket.broadcast.emit( message, data );
			}

			// handle connections & disconnections
			connections[socket.id] = {};
			socket.on('disconnect', function() {
				delete connections[socket.id];
				broadcastMessage('userDisconnected', { name : socket.name, color : socket.color });
			});

	});

};