module.exports = function(io) {

	var colors = ['#dfe937', '#ff9b39', '#2fa9f0', '#946af1', '#39f0c3'];

	io
		.of('/chat')
		.on('connection', function( socket ) {

			var connections = {};
			
			// record client connection to connections obj
			connections[socket.id] = {};
		}

	io
		.of('/pchat')
		.on('connection', function( socket ) {

			var connections = {};
			var rooms = {};
			
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
				
				if ( data.lucky == "true" ) {
					// send a 'lucky' user to a private room with one other person (or 0, then they wait or leave)
					var availableRoom;
					var totalRooms = getObjectSize(io.sockets.manager.rooms) - 2; // minus 2 for /chat channel, and for blank room
				
					for(var i=0; i<totalRooms; i++) {
						var roomID = 'room'+i;
						var room = rooms[roomID];
						var numUsers = io.sockets.manager.rooms['/chat/'+roomID] ? io.sockets.manager.rooms['/chat/'+roomID].length : 0;
						
						// add user to a room if there are 0 or 1 people
						if(numUsers < 2) { 
							availableRoom = room;
							break;
						}
					}
				
					// otherwise, create a new room
				  	if(!availableRoom){ 
				  		// create and initialize a new room
				  		var roomID = 'room'+totalRooms; 
				  		rooms[roomID] = { id:roomID,users:{} };
				  		// update current room var
				  		availableRoom = rooms[roomID];
				  	}

					// add the new user to the list of users
					availableRoom.users[socket.id] = data.name;
					// store the room name in the socket session for this client
					socket.set('room', availableRoom);
					// send client to the room
					socket.join(availableRoom.id);

					// only send connections in current room
					data.connections = availableRoom.users;
					broadcastRoomMessage( 'userReady', data, availableRoom.id );
				}
				else {
					// otherwise, just send user to main room and let everyone know
					data.connections = connections;
					broadcastRoomMessage( 'userReady', data, "/chat" );
				}
			});

			socket.on('userMessage', function( data ) {
				console.log("+++++++++++++ userMessage");
				socket.get('color', function (err, color) {
					data.color = color || '#ffffff';
					console.log("+++++++++++++ userMessage, data.color: " + data.color);
					socket.get('room', function (err, room) {
						console.log("+++++++++++++ userMessage, room: " + room);
						if(room != null) {
							// broadcast message to other user in room
			  				// io.sockets.in(room.id).emit('userMessage', data );
			  				broadcastRoomMessage( 'userMessage', data, room.id );
						}
						else {
							broadcastMessage( 'userMessage', data );
						}
					});
				});
			});

			socket.on('disconnect', function() {
				socket.get('name', function (err, name) {
					socket.get('room', function (err, room) {
						if(room != null) {
							socket.leave(room.id);
							//console.log('!!!!!!!!!!! ' + username + ' is leaving ' + room.id);
							io.sockets.emit('userDisconnected', { name : name });
							delete room.users[socket.id];
							delete connections[socket.id];
							if(getObjectSize(room.users) == 0) delete rooms[room.id];
							
						}
						else {
							delete connections[socket.id];
							broadcastMessage('userDisconnected', { name : name });
						}
					});
				});				
			});

			function broadcastRoomMessage( message, data, room ) {
				console.log("+++++++++++++ broadcastRoomMessage, socket.id: " + socket.id);
				console.log("+++++++++++++ broadcastRoomMessage, room: " + room);
				// send a message back to the client that just connected to the room
  				//io.sockets.socket(socket.id).emit( message, data );
  				socket.emit( message, data );
				// broadcast to the everyone else in the room
				// socket.broadcast.to(room).emit( message, data );
				socket.broadcast.in(room).emit( message, data );
			}

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