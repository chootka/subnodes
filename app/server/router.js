module.exports = function(app) {

	/*
	 * GET home page.
	 */

	app.get('/', function(req, res){
		res.render( 'index' );
	});	

	/*
	 * GET private chat.
	 */

	app.get('/pchat', function(req, res){
		res.render( 'pchat' );
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

	/*app.post('/create', function(req, res){
		database.missedConnectionUserInfo(req.cookies.userid, req.body.avatar, req.body.age, req.body.orientation, req.body.gender, req.body.question, req.body.interested, req.body.favcake, req.body.username);
		missedConnection.addUser({
			user_id:req.cookies.userid,
			avatar:req.body.avatar, 
			age:req.body.age, 
			orientation:req.body.orientation, 
			gender:req.body.gender, 
			question:req.body.question, 
			interested:req.body.interested, 
			favcake:req.body.favcake, 
			username:req.body.username, 
		}, res);
	});*/
};