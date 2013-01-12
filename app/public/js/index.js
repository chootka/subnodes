$(document).ready(function() {
	var $name = $('#name');
	$name.focus();
	$name.keypress( function(e){ 
		if (e.keyCode === 13) { 
			joinChat(); 
			return false; 
		} 
	});
	$('#join-button').click( function() { 
		joinChat();
	});

	var joinChat = function() {
		if( $name.text() == '' || $name.text() == 'enter a name!' ) {
			$name.text( 'enter a name!' );
			return;
		}
		window.location = "/chat?handle="+$name.text();
	}
});