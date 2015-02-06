var PageView = require('./base')
    ,templates = require('../templates');


module.exports = PageView.extend({
    pageTitle: 'Hot Probs – Login',
    template: templates.pages.login,
    events: {
        'click [data-hook=loginButton]': 'onLogin',
        'keypress [data-hook=username]': 'keypress'
    },

    // methods

    initialize: function () {

        // if there is an error, handle it
        this.listenTo(this.model, 'change:error', this.handleError, this);
    },
    render: function () {

        this.renderWithTemplate();
    },
    handleError: function(err) {
        console.log("error captured on login: " + err);
    },
    onLogin: function(e) {

        // capture the username and login with it
        app.socketClient.login( this.$('#username').text() );
    },
    keypress: function (e) {
        if (e.keyCode === 13) this.onLogin();
    },
});
