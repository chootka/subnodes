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
	app       = express(),
  	http      = require('http'),
  	server    = http.createServer(app),
  	io        = require('socket.io').listen(server);

  	app.root  = __dirname;
  	app.set('port', process.env.PORT || 8080);

// create the application
require('./app/config')(app, express);
require('./app/server/router')(app);
require('./app/server/modules/chat')(io);

// boot up HTTP server on port 80
server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})