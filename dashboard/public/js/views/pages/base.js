/*global _ $*/
// base view for pages
var View = require('ampersand-view')
	,_ = require('underscore')
	,$ = require('jquery'); 


module.exports = View.extend({

    // let there be jQuery!

    $: function (selector) {
        return $(selector, this.el);
    },

    // remove method for all Views
    
    remove: function() {
        $(this.el).remove();
    }
});
