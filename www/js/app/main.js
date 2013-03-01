// Defines the main app module. This one does the top level app wiring.

define(function (require) {
    'use strict';

    var $ = require('jquery');
    var Backbone = require('backbone');
    var Config = require('./config');
    var View = require('./view');
    var Router = require('./router');

    // Dependencies that do not have an export of their own, just attach
    // to other objects, like jQuery. These are just used in the example
    // bootstrap modal, not directly in the UI for the network and appCache
    // displays.
    require('bootstrap/typeahead');
    require('bootstrap/modal');
    require('bootstrap/transition');

    var myRouter = new Router({view: new View()});
    Backbone.history.start({ pushState: !Router.use_hash, root: '/' });
    // navigation should go through the router
    $(document).on('click', 'a:not([data-bypass])', function(evt) {
        var href = $(this).attr('href');
        // check for relative paths.
        if (href && !href.match(/^\w+:\/\//)) {
            evt.preventDefault();
            if (href.slice(0,6) === '/wiki/') {
                myRouter.gotoWiki(href.slice(6));
            } else if (href.slice(0,2) === './') {
                myRouter.gotoWiki(href.slice(2));
            } else {
                Backbone.history.navigate(href, true);
            }
        }
    });
    // basic forward/back navigation
    $(document).on('click', '#button-home', function(evt) {
        myRouter.gotoHome();
    });
    $(document).on('click', '#button-prev', function(evt) {
        window.history.back();
    });
    $(document).on('click', '#button-next', function(evt) {
        window.history.forward();
    });
    $(document).on('click', '#button-settings', function(evt) {
        myRouter.showSettings();
    });

    // Wait for the DOM to be ready before showing the network and appCache
    // state.
    $(function () {
        // Enable the UI bindings for the network and appCache displays
        require('./uiNetwork')();
        require('./uiAppCache')();
        require('./uiWebAppInstall')();
        //bind the search field
        $('#search').typeahead({
            source: function(query, process) {
                // XXX implement me
                process(['abc','xyz']);
            },
            updater: function(item) {
                // XXX update view to match
                return item;
            }
        }).on('keydown', function(event) {
            if (event.which===13 && ! $('#search').data('typeahead').shown) {
                var title = $('#search').val();
                myRouter.gotoWiki(title);
            }
        });
    });
});
