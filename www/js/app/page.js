// Backbone model.
// This class embodies the mediawiki content for a given page.  It handles
// fetching the content from the network or local storage (as appropriate).
define(['backbone', './static'], function(Backbone, Static) {
    var Page = Object.create(null);
    Page.Model = Backbone.Model.extend({
        idAttribute: 'title'
    });
    Page.Collection = Backbone.Collection.extend({
        model: Page.Model
    });
    Page.sync = {
        create: function(model, options, success, error) {
        },
        update: function(model, options, success, error) {
        },
        'delete': function(model, options, success, error) {
        },
        read: function(model, options, success, error) {
            var markup;
            switch (model.id) {
            case 'Nell:Home':
                markup = Static.HOME;
                break;
            case 'Star':
                markup = Static.STAR;
                break;
            default:
                // XXX page not found
                error(new Error('page not found: '+model.id));
                return false;
            }
            success(model, {markup:markup}, options);
            return true;
        }
    };

    // implement sync of pages to/from localstore/wikipedia
    Backbone.sync = function(method, model, options) {
        options = options || Object.create(null);
        var success = function() {
            if (options.success) { options.success.apply(null, arguments); }
        };
        var error = function() {
            if (options.error) { options.error.apply(null, arguments); }
        };
        console.assert(method in Page.sync, method + ' not a valid method');
        console.log('sync', method, model, options);
        return Page.sync[method].call(Page.sync, model, options, success, error);
    };

    return Page;
});
