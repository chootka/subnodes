/**
 * Subnodes is an open source project that enables people to easily set up portable access points for serving content.
 * Author : Sarah Grant
 * Github : http://github.com/chootka/subnodes
 * License: AGPLv3 http://www.gnu.org/licenses/agpl-3.0.html
 */

/**
 * Module dependencies.
 */
var express   = require('express'),
	app         = express(),
  http        = require('http'),
  https       = require('https'),
  server      = http.createServer(app),
  io          = require('socket.io').listen(server);

app.root    	= __dirname;

io.configure('development', function(){
  io.set('transports', ['websocket']);
});

// create the application
require('./app/config')(app, express);
require('./app/server/router')(app);
require('./app/server/modules/chat')(io);
require('./app/server/modules/pchat')(io);

// redirect from HTTPS to HTTP on port 443
https.createServer(function (req, res) {
  console.log("https server called");
  res.writeHead(301, { "Location": "http://www.hotprobs.com" });
  res.end();
}).listen(443, function() {
  console.log("HTTPS server listening on port 443");
});

// boot up HTTP server on port 80
// server.listen(8080, function() {
//   console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);
// });