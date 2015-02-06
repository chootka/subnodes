/*global app, $*/
// This app view is responsible for rendering all content that goes into
// <html>. It's initted right away and renders itself on DOM ready.

// This view also handles all the 'document' level events such as keyboard shortcuts.
var _ = require('underscore') // remove
    ,View = require('ampersand-view')
    ,ViewSwitcher = require('ampersand-view-switcher')
    ,domify = require('domify')
    ,dom = require('ampersand-dom')
    ,setFavicon = require('favicon-setter')
    ,templates = require('../templates');


module.exports = View.extend({
    template: templates.body,


    // methods
    
    initialize: function () {

        // listen for when a new page is to be loaded w/i the main frame
        this.listenTo(app.router, 'page', this.handleNewPage);
    
        // our main view listens to and responds to model events
        this.listenTo(app.users, 'add', this.userAdded, this);
        this.listenTo(app.users, 'remove', this.userRemoved, this);
        this.listenTo(app.messages, 'add', this.chatAdded, this);
    },
    render: function () {

        // some additional stuff we want to add to the document head
        document.head.appendChild(domify(templates.head()));

        // main renderer / first page view is log-in
        this.renderWithTemplate({login: app.login});

        // init and configure our page switcher
        this.pageSwitcher = new ViewSwitcher(this.queryByHook('page-container'), {
            
            show: function (newView) {

                document.title = newView.pageTitle || 'Hot Probs';
                document.scrollTop = 0;

                // add a class specifying it's active
                dom.addClass(newView.el, 'active');

            }
        });

        //getFavicon('/img/apple-touch-icon.png');
        return this;
    },

    // event handlers

    handleNewPage: function (view) {

        // tell the view switcher to render the new one
        this.pageSwitcher.set(view);
    },

    // respond to changes in model collections
    userAdded: function(model) {
        // console.log("user added to users-collection, notified in main.js view: " + model.username);

        // send them to the chat screen
        app.navigate('chat');
    },
    userRemoved: function(model) {
        // console.log("user removed from users-collection, notified in main.js view: " + model.username);

        // close out sockets
    },
    chatAdded: function(model) {
        // console.log("chatAdded, message added to messages-collection, notified in main.js view: " + model.message);
        
        // re-render chat room every time a message is received
        // er... what's the better way to cause a re-render?
        app.navigate('chat');
    }
});
