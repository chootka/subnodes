module.exports = function(io) {

	var colors = ['#AE331F', '#D68434', '#116A9F', '#360B95', '#5F209E'];
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

			function dispatchStatus() {
				broadcastMessage( 'status', connections );
			}

			function broadcastMessage( message, data ) {
				// remove socket.emit if you don't want the sender to receive their own message
				socket.emit( message, data );
				socket.broadcast.emit( message, data );
			}

			// handle connections & disconnections
			connections[socket.id] = {};
			dispatchStatus();
			socket.on('disconnect', function() {
				delete connections[socket.id];
				dispatchStatus();
				broadcastMessage('userDisconnected', { name : socket.name, color : socket.color });
			});

	});

};