/**
	* Web-App configuration tool for Subnodes started by Sarah Grant
	* Github : http://github.com/chootka/subnodes
	*/

// Modules
var express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	logger = require('morgan'),
	path = require('path');



// Application Middleware
// Views
app.set('views', __dirname+'/views');
app.set('view engine', 'jade');
app.set('view options', { doctype: 'html', pretty: true });
app.set('view cache', false);
// Logging
app.use(logger('dev'));
// Parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true})); //True makes the body object forwarded an object rather than array (if set to false)
// URL Renaming
// app.use(function (req, res, next){
// 	var hostname = req.header('host').split(':')[0];
// 	if (hostname != 'www.subnodes.com') {
// 		res.redirect('http://www.subnodes.com');
// 		return;
// 	}
// 	next();
// });



// Routes
app.use(express.static(path.join(__dirname, 'public')));
require('./server/routes.js')(app);



// Start App
app.listen(5555);