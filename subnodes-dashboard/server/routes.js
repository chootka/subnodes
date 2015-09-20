module.exports = function(app) {

	var path = require('path'),
		fs = require('fs');


	// Getting Home Page
	app.get('/', function(req, res) {
		res.render('index');
	});

	// Getting Configuration Page
	app.get('/config', function(req, res) {
		var appsJSONPath = path.join(__dirname, '..', '..', 'verified_apps.json');
		fs.readFile(appsJSONPath, function (err, data) {
			// console.log(JSON.parse(data));
			var parsedData = JSON.parse(data);
			res.render('config', {apps: parsedData.preapproved});
		});
	});

	// Saving Configuration
	app.post('/save', function(req, res) {
		//Rewrite checkbox values
		if(req.body['wifi-access-point']){
			req.body['wifi-access-point'] = 'yes';
		} else {
			req.body['wifi-access-point'] = 'no';			
		}
		if(req.body['mesh-node']) {
			req.body['mesh-node'] = 'yes';
		} else {
			req.body['mesh-node'] = 'no';
		}
		var newAppConfig = JSON.stringify(req.body);
		// Setup Conifg 
			fs.writeFile(__dirname + '/../../new-app-config.json', newAppConfig, function (err){
				if (err) throw err;
				console.log('Saved Config!', newAppConfig);
			});
		// Redirect
		res.redirect('/finish');
	});

	// Getting Reboot Page
	app.get('/finish', function(req, res) {
		var configJSONPath = path.join(__dirname, '..', '..', 'new_app_config.json');
		fs.readFile(configJSONPath, function (err, data) {
			var parsedConfig = JSON.parse(data);
			console.log(parsedConfig);
			res.render('finish', { wifi: parsedConfig['wifi-ssid'] });
		});
	});

	// Initialize Rebuild
	app.post('/rebuild', function(req, res) {
		console.log('Rebuilding...');
		//child processes running shell script
	});

}