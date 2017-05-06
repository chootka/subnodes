module.exports = function(app) {

	/*
	 * GET home page.
	 */
	app.get('/', function(req, res){
		res.render( 'index' );
	});	

	/*
	 * GET chat.
	 */
	app.get('/chat', function(req, res){
		res.render( 'chat' );
	});

	/*
	 * GET 404.
	 */
	app.get('*', function(req, res){
		res.render( '404' );
	});
};