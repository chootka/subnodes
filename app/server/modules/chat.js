module.exports = function(io) {

	var colors = ['#dfe937', '#ff9b39', '#2fa9f0', '#946af1', '#39f0c3'];
	var connections = {};
	var rooms = { room0:
					{ id:'room0', users:{} }
				};

	io
		.of('/chat')
		.on('connection', function( socket ) {

			// if the client id is already recorded, return (safeguards from multiple calls being made from same client)
			// for ( var k in connections ) {
			// 	if (connections[k] == socket.id) return;
			// }

			// record client connection to connections obj
			connections[socket.id] = {};

			// give each connected user a random color so it's easier to tell them apart in the chat log
			socket.on('userReady', function( data ) {
				// save client username in the socket session for this client
				socket.set('name',data.name);
				// save client color in the socket session for this client
				data.color = colors[Math.floor(Math.random() * colors.length)];
				socket.set('color',data.color);
				
				if ( data.lucky ) {
					// send a 'lucky' user to a private room with one other person (or 0, then they wait or leave)
					var availableRoom;
					var totalRooms = Object.size(io.sockets.manager.rooms) - 1;
					console.log('++++++++++++++++++++: ' + io.sockets.manager.rooms);
				
					for(var i=0; i<totalRooms; i++) {
						var roomID = 'room'+i;
						var room = rooms[roomID];
						var numUsers = io.sockets.manager.rooms['/'+roomID] ? io.sockets.manager.rooms['/'+roomID].length : 0;
						
						// add user to a room if there are 0 or 1 people
						if(numUsers < 2) { 
							availableRoom = room;
							break;
						}
					}
				
					// otherwise, create a new room
				  	if(!availableRoom){ 
				  		// create a new room
				  		var roomID = 'room'+totalRooms; 
				  		rooms[roomID] = { id:roomID,users:{} };
				  		// update current room var
				  		availableRoom = rooms[roomID];
				  		console.log('+++++++++++++ ' + roomID + ' created.');
				  	}

					// add the new user to the list of users
					availableRoom.users[socket.id] = data.name;
					// store the room name in the socket session for this client
					socket.set('room', availableRoom);
					// send client to the room
					socket.join(availableRoom.id);

					// only send connections in current room
					data.connections = availableRoom.users;
					broadcastRoomMessage( 'userReady', data );
				}
				else {
					// otherwise, just send user to main room and let everyone know
					broadcastMessage( 'userReady', data );
				}
			});

			socket.on('userMessage', function( data ) {

				socket.get('color', function (err, color) {
					data.color = color || '#ffffff';
					socket.get('room', function (err, room) {
						if(room != null) {
							// broadcast message to other user in room
			  				io.sockets.in(room.id).emit('userMessage', data );
						}
						else {
							broadcastMessage( 'userMessage', data );
						}

					});
				}
			});

			socket.on('disconnect', function() {

				socket.get('name', function (err, name) {
					socket.get('room', function (err, room) {
						if(room != null) {
							socket.leave(room.id);
								//console.log('!!!!!!!!!!! ' + username + ' is leaving ' + room.id);
								io.sockets.emit('userDisconnected', {name:name});
								delete room.users[socket.id];
								delete connections[socket.id];
								if(Object.size(room.users) == 0) delete rooms[room.id];
							
						}
						else {
							delete connections[socket.id];
							broadcastMessage('userDisconnected', { name : name });
						}
					});
				});				
			});

			function broadcastRoomMessage( message, data ) {
				// send a message back to the client that just connected to the room
  				io.sockets.socket(socket.id).emit( message, data );
				// broadcast to the everyone else in the room
				socket.broadcast.to(availableRoom.id).emit( message, data );
			}

			function broadcastMessage( message, data ) {
				data.connections = connections;
				// remove socket.emit if you don't want the sender to receive their own message
				socket.emit( message, data );
				socket.broadcast.emit( message, data );
			}

	});

};