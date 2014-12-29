module.exports = function(io) {

	var colors = ['#dfe937', '#ff9b39', '#2fa9f0', '#946af1', '#39f0c3'];
	var connections = {};
	var rooms = {};

	io
		.of('/pchat')
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
				
				// send user to a private room with one other person (or 0, then they wait or leave)
				var availableRoom;
				var totalRooms = getObjectSize(io.sockets.manager.rooms) - 2; // minus 2 for /chat channel, and for blank room
			
				for(var i=0; i<totalRooms; i++) {
					var roomID = 'room'+i;
					var room = rooms[roomID];
					var numUsers = io.sockets.manager.rooms['/pchat/'+roomID] ? io.sockets.manager.rooms['/pchat/'+roomID].length : 0;
					
					//for( var k in rooms ) console.log(k + ': ' + rooms[k]);
						
					// add user to a room if it exists in rooms object and there are 0 or 1 people
					if(numUsers < 2) { 
						if( !room ) { // room doesn't exist so redefine it
							rooms[roomId] = { id:roomID,users:{} };
						}
						availableRoom = room;
						break;
					}
				}
			
				// if there were simply no rooms with less than 2 users, create a new room
			  	if(!availableRoom){ 
			  		// before making new room, make sure it doesn't already exist!!!
			  		// also, why does going to main room create a ghost room that is undef

			  		// create and initialize a new room
			  		var roomID = 'room'+totalRooms; 
			  		rooms[roomID] = { id:roomID,users:{} };
					// update current room var
			  		availableRoom = rooms[roomID];
			  	}

				// add the new user to the list of users
				availableRoom.users[socket.id] = data.name;
				// store the room name in the socket session for this client
				socket.room = availableRoom;
				// send client to the room
				socket.join(availableRoom.id);

				// only send connections in current room
				data.connections = availableRoom.users;
				broadcastRoomMessage( 'userReady', data, availableRoom.id );
				
			});

			socket.on('userMessage', function( data ) {
				socket.get('color', function (err, color) {
					data.color = color || '#ffffff';
					// broadcast message to other user in room
					var room = socket.room;
			  		broadcastRoomMessage( 'userMessage', data, room.id );
				});
			});

			socket.on('disconnect', function() {
				socket.get('name', function (err, name) {
					var room = socket.room;
					socket.leave(room.id);
	  				broadcastRoomMessage( 'userDisconnected', { name: name }, room.id );
					delete room.users[socket.id];
					delete connections[socket.id];
				});				
			});

			function broadcastRoomMessage( message, data, room ) {
				// send a message back to the client that just connected to the room
  				socket.emit( message, data );
				// broadcast to the everyone in the room
				// socket.broadcast.to(socket.room.id).emit( message, data );
				// broadcast to the everyone in the room, except the current user
				socket.broadcast.in(socket.room.id).emit( message, data );
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