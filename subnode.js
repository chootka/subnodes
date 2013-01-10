
/**
 * Subnodes is an open source project that enables people to easily set up portable access points for serving content.
 * Author : Sarah Grant
 * Github : http://github.com/chootka/subnodes
 */


/**
 * Module dependencies.
 */
var express     = require('express'),
	app         = express(),
    http		= require('http'),
    server 		= http.createServer(app);

app.root    	= __dirname;
global.io		= require('socket.io').listen(server);

global.io.set('log level', 1); // reduce logging

// finally create this application, our root server //
require('./app/config')(app, express);
require('./app/server/router')(app);
//require(./app/server/db)
require('./app/server/modules/subchat');
//require('./app/server/modules/sublog');

server.listen(8080, function() {
  console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);
});