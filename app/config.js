module.exports = function(app, exp) {

	// rewrite URL to subnodes.com:8080 for dev / subnodes.com for prod
	app.configure('development', function(){
		
		app.use(function(req, res, next){
			var hostname = req.header("host").split(":")[0];
			if (hostname != "www.subnodes.com") {
				res.redirect('http://www.subnodes.com:8080');
				return;
			}
			next();
		});
	});
	app.configure('production', function(){
		
		app.use(function(req, res, next){
			var hostname = req.header("host").split(":")[0];
			if (hostname != "www.subnodes.com") {
				res.redirect('http://www.subnodes.com');
				return;
			}
			next();
		});
	});

	app.configure(function(){
		app.set('views', app.root + '/app/server/views');
		app.set('view engine', 'pug');
		app.set('view options', { doctype: 'html', pretty: true });
		app.use(exp.logger('dev'));
  		app.use(exp.bodyParser());
		app.use(exp.methodOverride());
		app.use(exp.static(app.root + '/app/server'));
		app.use(require('stylus').middleware({
	        src: app.root + '/app/public',
	        compress: true
	    }));
		app.use(exp.static(app.root + '/app/public'));
		app.use(function(err, req, res, next){
		  res.send(500, { error: 'A vague server error has occurred: ' + err + '. Bad connection, perhaps?'});
		})
	});

	app.configure('development', function(){
		app.use(exp.errorHandler());
	});

	//app.use(function(req, res, next){
	//	res.render('404', {title: 'Page Not Found'});
	//});

}