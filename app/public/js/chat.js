$(document).ready(function() {
	// get passed in user name
	var handle = window.location.search.substring(1).split("=")[1];

	$('#msg').focus();
	$('#btn-send').click(function(){ sendMessage(); })
	$('#msg').keypress(function(e){ if (e.keyCode === 13) { sendMessage(); return false; } })

	// initialize the socket connection to listen on the 'chat' namespace //
	socket = io.connect('/chat');
	socket.on('status', function (connections) {
		//var i=0; for (p in connections) i++;
		//var s = i > 1 ? ' are '+i+' People ' : ' is '+i+' Person ';
		//$('#connected').html('There '+s+' Currently Connected');
	});
	socket.on('user-ready', function (data) {
		$('#incoming').append('<span style="color:'+data.color+'">'+data.name +' > connected</span><br>');
		autoScroll();
	});
	socket.on('user-message', function (data) {
		$('#incoming').append('<span style="color:'+data.color+'">'+data.name +' > '+ data.message+'</span><br>');
		autoScroll();
	});
	socket.on('user-disconnected', function (data) {
		$('#incoming').append('<span style="color:'+data.color+'">'+data.name +' > disconnected</span><br>');
		autoScroll();
	});

	// register the user's name with the socket connection on the server // 
	socket.emit('user-ready', {name : handle });

	var autoScroll = function() { 
		document.getElementById('incoming').scrollTop = document.getElementById('incoming').scrollHeight; 
	}
	var sendMessage = function() {
		socket.emit('user-message', {name : handle , message : $('#msg').val() });
		$('#msg').val('')
	}
});