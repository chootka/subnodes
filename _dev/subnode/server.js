// Require dependencies
var app = require('http').createServer(handler)
  , fs = require('fs')
  , io = require('socket.io').listen(app);
 
// creating the server ( localhost:8000 )
app.listen(8000);
 
// on server started we can load our client.html page
function handler ( req, res ) {
  fs.readFile( __dirname + '/client.html' , function ( err, data ) {
    if ( err ) {
      console.log( err );
      res.writeHead(500);
      return res.end( 'Error loading client.html' );
    }
    res.writeHead( 200 );
    res.end( data );
  });
}
 
// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on( 'connection', function ( socket ) {
 
  socket.on('set nickname', function (nickname) {
    // Save a variable 'nickname'
    socket.set('nickname', nickname, function () {
      var connected_msg = nickname + ' is now connected.';
      console.log(connected_msg);

      io.sockets.volatile.emit('broadcast_msg', connected_msg);
    });
  });

  socket.on('emit_msg', function(msg) {
    // get var 'nickname'
    socket.get('nickname', function( err, nickname ) {
      console.log("chat message by ", nickname);
      io.sockets.volatile.emit( 'broadcast_msg', nickname + ': ' + msg);
    });
  });

  // handle disconnection of clients
  socket.on('disconnect', function() {
    socket.get('nickname', function (err, nickname) {
      console.log('Disconnect', nickname);
      var disconnected_msg = '<b>' + nickname + ' has disconnected.</b>';

      //Broadcast to all users the disconnect message
      io.sockets.volatile.emit( 'broadcast_msg', disconnected_msg);
    })
  })
});