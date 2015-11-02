module.exports = function(app) {

	// Getting Home Page
	app.get('/', function(req, res) {
		res.render('index');
	});

}