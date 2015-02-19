// Application Controller

var _ = require('underscore')
    // ,logger = require('andlog')
    ,config = require('clientconfig')
    ,domReady = require('domready')

    // router! ~(=.= ~)
    ,Router = require('./router')

    // views (> @__@)>
    ,MainView = require('./views/main')

    // models (^__^ )b
    ,Login = require('./models/login')
    ,Dashboard = require('./models/dashboard')
    ,Modules = require('./models/module-collection');

// exports
module.exports = {

    // this is the the whole app init
    init: function () {

        var self = window.app = this;

        // Router
        this.router = new Router();

        // Models + Collections
        this.login = new Login();
        this.dashboard = new Dashboard();
        this.modules = new Modules();

        // wait for document ready to render our main view
        // this ensures the document has a body, etc.
        domReady(function () {

            // init our main view
            var mainView = self.view = new MainView({
                model: self.login,
                el: document.body
            });

            // ...and render it
            mainView.render();

            // we have what we need, we can now start our router and show the appropriate page
            self.router.history.start({pushState: true, root: '/'});
        });
    },


    // methods

    // This is how you navigate around the app.
    navigate: function (page) {
        
        var url = (page.charAt(0) === '/') ? page.slice(1) : page;
        this.router.history.navigate(url, {trigger: true});
    }

};

// run it
module.exports.init();