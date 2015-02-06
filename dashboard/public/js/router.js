
var Router = require('ampersand-router')
    ,LoginPage = require('./pages/login')
    ,ChatPage = require('./pages/chat');


module.exports = Router.extend({
    routes: {
        '': 'main',
        'chat': 'chat',
        '(*path)': 'catchAll'
    },

    // ------- ROUTE HANDLERS ---------
    main: function () {
        this.trigger('page', new LoginPage({
            model: app.login
        }));
    },

    chat: function() {
        this.trigger('page', new ChatPage({
            model: app.chat,
            collection: app.messages
        }));
    },

    catchAll: function () {
        this.redirectTo('');
    }
});
