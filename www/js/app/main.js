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

    var Router = require('./router');
    var myRouter = new Router();
    Backbone.history.start({ pushState: false/*true*/, root: '/' });
    // navigation should go through the router
    $(document).on('click', 'a:not([data-bypass])', function(evt) {
        var href = $(this).attr('href');
        // check for relative paths.
        if (href && !href.match(/^\w+:\/\//)) {
            evt.preventDefault();
            Backbone.history.navigate(href, true);
        }
    });

    // Wait for the DOM to be ready before showing the network and appCache
    // state.
    $(function () {
        // Enable the UI bindings for the network and appCache displays
        require('./uiNetwork')();
        require('./uiAppCache')();
        require('./uiWebAppInstall')();
    });
});
