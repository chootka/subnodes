module.exports = function(app) {

	/*
	 * GET home page.
	 */

	app.get('/', function(req, res){
		res.render('index', {title: 'Subnod.es'});
	});	

	/*
	 * GET chat.
	 */

	app.get('/subchat', function(req, res){
		res.render('subchat', {title: 'Subnod.es :: subchat'});
	});	

	/*
	 * GET hotprobs.
	 */

	app.get('/hotprobs', function(req, res){
		res.render('hotprobs', {title: 'Subnod.es :: hotprobs'});
	});	

	/*
	 * GET guestbook.
	 */

	app.get('/guestbook', function(req, res){
		res.render('guestbook', {title: 'Subnod.es :: Sign the guestbook'});
	});	

	/*
	 * GET 404.
	 */
	 
	app.get('*', function(req, res){
		res.render('404', {title: 'Page Not Found'});
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