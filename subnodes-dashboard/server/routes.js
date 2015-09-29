module.exports = function(app) {

	var path = require('path'),
		fs = require('fs'),
		process = require('child_process');


	// Home Page
	app.get('/', function(req, res) {
		var dashData = {};
		dashData.IPList = [];
		// Get IPs
		process.exec('ifconfig', function (error, stdout, stderr) {
			var newOut = stdout.split(' ');
			var regExp = new RegExp(/inet(?!6)/);
			for (var i = 0; i < newOut.length; i++){
				if(regExp.exec(newOut[i])){
					dashData.IPList.push(newOut[i+1]);
				}
			}
			// Get Project Info
			process.exec("cat ../app/package.json", function(err2, stdout2, stderr2) {
				dashData.app = JSON.parse(stdout2);
				// Render
				res.render('dashboard', dashData);				
			});
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
			var filteredSTDOUT;
			filteredSTDOUT = stdout.split(/(?:ESSID:)"([^"]+)"/g);
			filteredSTDOUT = filteredSTDOUT.filter(function(element, index, array) {
			    if(element.match(/[^\s]/) === null) {
			        return false;
			    } else {
			        return true;
			    }
			});
			res.render('sign_in', {ESSIDs: filteredSTDOUT});
		});
	});

	app.post('/signIntoWifi', function(req, res) {
		var filePath = '../scripts/write_wpa.sh';
		process.execSync('chmod a+x ' + filePath);
		process.execFile(filePath,['sudo', req.body.ssid, req.body.psk], function (err, stdout, stderr) {
			res.redirect('/');
		});
	});

	app.post('/signOutOfWifi', function(req, res) {
		process.execSync('sudo ifdown wlan2');
		res.redirect('/');
	});

	// Get IFCONFIG
	app.get('/ifconfig', function(req, res) {
		process.exec('ifconfig',
			function (error, stdout, stderr) {
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
		var appConfigJSONPath = path.join(__dirname, '..', '..', 'new_app_config.json');
		fs.readFile(appConfigJSONPath, function (err, data) {
			var parsedData = JSON.parse(data);
			res.render('config', parsedData);
		});
	});

	// Saving Configuration
	app.post('/saveConfig', function(req, res) {
		//Rewrite checkbox values
		if(req.body['wifiAccessPoint']){
			req.body['wifiAccessPoint'] = 'yes';
		} else {
			req.body['wifiAccessPoint'] = 'no';			
		}
		if(req.body['meshNode']) {
			req.body['meshNode'] = 'yes';
		} else {
			req.body['meshNode'] = 'no';
		}
		var newAppConfig = JSON.stringify(req.body);
		// Write Conifg File
		fs.writeFile(__dirname + '/../../new_app_config.json', newAppConfig, function (err){
			if (err) throw err;
			console.log('Saved Config!', newAppConfig);
			// Redirect
			res.redirect('/finishConfig');
		});
	});

	// Reboot Page
	app.get('/finishConfig', function(req, res) {
		var configJSONPath = path.join(__dirname, '..', '..', 'new_app_config.json');
		fs.readFile(configJSONPath, function (err, data) {
			var parsedConfig = JSON.parse(data);
			console.log(parsedConfig);
			res.render('finish', { wifi: parsedConfig['wifiSSID'] });
		});
	});

	// Initialize Rebuild
	app.post('/rebuild', function(req, res) {
		console.log('Rebuilding...');

		// Read Config Settings
		var configJSONPath = path.join(__dirname, '..', '..', 'new_app_config.json');
		fs.readFile(configJSONPath, function (err, data) {
            var parsedConfig = JSON.parse(data);
            console.log("Parsed Config", parsedConfig);

            var configFilePath = '../scripts/reconfigure_network_config.sh';
            process.execSync('chmod a+x ' + configFilePath);
            process.execFile(configFilePath,['sudo', 'bash', parsedConfig.wifiSSID, parsedConfig.wifiCountry, parsedConfig.wifiChannel, parsedConfig.bridgeIP, parsedConfig.bridgeSubnetMask, parsedConfig.dhcpStartingAddress, parsedConfig.dhcpEndingAddress, parsedConfig.dhcpMask, parsedConfig.dhcpLease, parsedConfig.meshNode, parsedConfig.meshSSID, parsedConfig.wifiAccessPoint], function (error, stdout, stderr) {
                console.log('Rebooting...')
                process.execSync('sudo reboot');
            });
		});
	});

    app.post('/rollbackNetworkConfig', function(req, res){
        var filePath = '../scripts/rollback_network_config.sh'
        process.execSync('chmod a+x ' + filePath);
        process.execFile(filePath,['sudo','bash']);
    });


	//Catch gets for non-existant URLs
	app.get('/*', function(req, res) {
		res.redirect('/');
	});

}