var View = require('ampersand-view')
    ,templates = require('../templates');


module.exports = View.extend({
    template: templates.includes.message,
    bindings: {
        'model.user.username': '[data-hook=username]',
        //'model.user.color': '[data-hook=color]',
        'model.message': '[data-hook=message]'
    },


    // methods
    
    initialize: function () {
    },
    render: function () {

        // main renderer
        console.log("this.model.user.color: " + this.model.user.color);

        this.renderWithTemplate({message: this.model});

        return this;
    },
    delete: function() {
        
        this.model.destroy();
        return false;
    }
});
