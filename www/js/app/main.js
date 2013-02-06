// Defines the main app module. This one does the top level app wiring.

define(function (require) {
    'use strict';

    var $ = require('jquery');
    var Backbone = require('backbone');

    // Dependencies that do not have an export of their own, just attach
    // to other objects, like jQuery. These are just used in the example
    // bootstrap modal, not directly in the UI for the network and appCache
    // displays.
    require('bootstrap/modal');
    require('bootstrap/transition');

    // Page routing
    var WikiRouter = Backbone.Router.extend({
        routes: {
            "about": "showAbout",
            "wiki/*title": "wikiPage",
            "*other": "defaultPage"
        },
        showAbout: function() {
            this.navigate("wiki/Nell:About", true);
        },
        defaultPage: function() {
            this.navigate("wiki/Nell:Home", true);
        },
        wikiPage: function(title) {
            console.log('wiki',title,'opened');
        }
    });
    var myRouter = new WikiRouter();
    Backbone.history.start();

    // Wait for the DOM to be ready before showing the network and appCache
    // state.
    $(function () {
        // Enable the UI bindings for the network and appCache displays
        require('./uiNetwork')();
        require('./uiAppCache')();
        require('./uiWebAppInstall')();
    });
});
