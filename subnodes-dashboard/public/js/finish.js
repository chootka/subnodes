var rebooting = function(){
	$('#rebootingScreen').show();
	$('.reboot-button').hide();
	$.post('/rebuild');
}