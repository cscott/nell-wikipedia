// Backbone model.
// This class embodies the mediawiki content for a given page.  It handles
// fetching the content from the network or local storage (as appropriate).
define(['backbone', './config', 'jquery', './static', './util'], function(Backbone, Config, $, Static, Util) {

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
        readExternal: function(model, options, success, error) {
            var title = Util.normalize_title(model.id);
            var url = "http://"+Config.lang+".wikipedia.org/wiki/Special:Export/"+title;
            var query = "select * from xml where url='"+url+"'";
            return $.ajax({
                url: 'http://query.yahooapis.com/v1/public/yql',
                data: { q: query, format: 'json' },
                dataType: 'jsonp',
                success: function(data, textStatus, xhr) {
                    if (data && data.query &&
                        data.query.results &&
                        data.query.results.mediawiki &&
                        data.query.results.mediawiki.page &&
                        data.query.results.mediawiki.page.revision) {
                        var page = data.query.results.mediawiki.page;
                        var fields = {
                            title: page.title || title,
                            revision: page.revision.id,
                            parentid: page.revision.parentid,
                            sha1: page.revision.sha1,
                            timestamp: page.revision.timestamp,
                            markup: page.revision.text.content || ''
                        };
                        success(model, fields, options);
                    } else {
                        error(xhr, 'bad data returned', null);
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    error(xhr, textStatus, errorThrown);
                }
            });
        },
        read: function(model, options, success, error) {
            var markup;
            switch (model.id) {
            case Config.home:
                markup = Static.HOME;
                break;
            case Config.about:
                markup = Static.ABOUT;
                break;
            case 'Star':
                markup = Static.STAR;
                break;
            default:
                return this.readExternal(model, options, success, error);
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
