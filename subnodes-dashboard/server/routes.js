module.exports = function(app) {

	var path = require('path'),
		fs = require('fs'),
		process = require('child_process');


	// Home Page
	app.get('/', function(req, res) {
		process.exec('ifconfig', function (error, stdout, stderr) {
			// console.log(stdout);
			// var ip4RegExp = new RegExp(/(?:inet)\s+((?:[a-zA-Z0-9]{1,3}.){0,4})/igm);
			// var ip6RegExp = new RegExp(/(?:inet6)\s+(\b.+\b)/igm);
			// var ips = ip4RegExp.exec(stdout).concat(ip6RegExp.exec(stdout));

			// var ipRegExp = new RegExp(/(inet|inet6)/gmi);
			// var filteredIP = ipRegExp.exec(stdout)
			// console.log(filteredIP);

			var newOut = stdout.split(' ');
			var filteredOut = []
			var regExp = new RegExp(/inet(?!6)/);
			for (var i = 0; i < newOut.length; i++){
				if(regExp.exec(newOut[i])){
					filteredOut.push(newOut[i+1]);
				}
			}
			res.render('dashboard', {ips: filteredOut});
		});
	});

	app.post('/reboot', function(req, res) {
		console.log('Rebooting RPi');
		process.execSync('sudo reboot');
	});

	app.post('/shutdown', function(req, res) {
		console.log('Shutting Down RPi');
		process.execSync('sudo shutdown -hP now');
	});

	// Sign into Wifi
	app.get('/signin', function(req, res) {
		process.exec("sudo iwlist wlan2 scan | grep 'ESSID'", function(error, stdout, stderr){
			var regExp = /(?:ESSID:)"(.+)"/gm;
			var filteredSTDOUT = regExp.exec(stdout);
			filteredSTDOUT.forEach(function(element, index, array){
				array[index] = element.join();
			});
			res.render('sign_in', {ESSIDs: filteredSTDOUT});
		});
	});

	// Get IFCONFIG
	app.get('/ifconfig', function(req, res) {
		process.exec('ifconfig',
			function (error, stdout, stderr) {
		    console.log('stdout: ' + stdout);
		    res.render('ifconfig', {config: stdout});
		});
	});

	// Load App
	app.get('/app', function(req, res) {
		var appsJSONPath = path.join(__dirname, '..', '..', 'verified_apps.json');
		fs.readFile(appsJSONPath, function (err, data) {
			var parsedData = JSON.parse(data);
			res.render('load_app', {apps: parsedData.preapproved});
		});
	});

	app.post('/loadApp', function (req, res) {
		// Check Validity of URL
		var urlRegExp = new RegExp("^https?:\/\/");
		if (urlRegExp.test(req.body.repo)){
			var filePath = '../scripts/git_clone_app.sh'
			// Get Repo Name
			var projectRegExp = new RegExp("([^\/]+)$")
			var repoName = projectRegExp.exec(req.body.repo)[0];
			console.log(repoName);
			process.execSync('chmod a+x ' + filePath);
			process.execFile(filePath,['sudo','bash', req.body.repo, repoName], function (err, stdout, stderr) {
				res.redirect('/');
			});
		}
	});

	// Pull App Update
	app.post('/makePull', function(req, res) {
		console.log('making pull')
		var filePath = '../scripts/git_pull_app.sh';
		process.execSync('chmod a+x ' + filePath);
		process.execFile(filePath,['sudo','bash']);
	});

	// Network Configuration Page
	app.get('/config', function(req, res) {
		var appsJSONPath = path.join(__dirname, '..', '..', 'verified_apps.json');
		fs.readFile(appsJSONPath, function (err, data) {
			var parsedData = JSON.parse(data);
			res.render('config', {apps: parsedData.preapproved});
		});
	});

	// Saving Configuration
	app.post('/saveConfig', function(req, res) {
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
			fs.writeFile(__dirname + '/../../new_app_config.json', newAppConfig, function (err){
				if (err) throw err;
				console.log('Saved Config!', newAppConfig);
			});
		// Redirect
		res.redirect('/finish');
	});

	// Reboot Page
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