var updateApp = function(){
	alert('Pulling');
	$.post('/makePull');
}

var rebootRPi = function(){
	alert('Rebooting');
	$.post('/reboot');
}

var shutdownRPi = function(){
	alert('Shutting Down');
	$.post('/shutdown');
}

var signOutOfWifi = function(){
	$.post('/signOutOfWifi');
}