
var Router = require('ampersand-router')
    ,LoginPage = require('./pages/login')
    ,ChatPage = require('./pages/dashboard');


module.exports = Router.extend({
    routes: {
        '': 'main',
        'chat': 'dashboard',
        '(*path)': 'catchAll'
    },

    // ------- ROUTE HANDLERS ---------
    main: function () {
        this.trigger('page', new LoginPage({
            model: app.login
        }));
    },

    dashboard: function() {
        this.trigger('page', new ChatPage({
            model: app.dashboard,
            collection: app.modules
        }));
    },

    catchAll: function () {
        this.redirectTo('');
    }
});
