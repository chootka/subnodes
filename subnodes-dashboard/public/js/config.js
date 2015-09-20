$('.app-quick-select').change(function(event){
	var appRepo = $(event.target).find(':selected').text();
	$('.app-repo-input').val(appRepo)
});

var showAdvancedConfig = function(){
	$('#advancedConfigButton').hide();
	$('#advancedConfig').show();
	$('#hideAdvancedConfigButton').show();
}

var hideAdvancedConfig = function(){
	$('#advancedConfig').hide();
	$('#advancedConfigButton').show();
	$('#hideAdvancedConfigButton').hide();
}