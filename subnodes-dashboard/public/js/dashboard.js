var updateApp = function(){
	alert('UPDATING');
	$.post('/makePull');
}

var rebootRPi = function(){
	alert('REBOOTING');
	$.post('/reboot');
}

var shutdownRPi = function(){
	alert('SHUTTING DOWN');
	$.post('/shutdown');
}

var signOutOfWifi = function(){
	$.post('/signOutOfWifi');
}