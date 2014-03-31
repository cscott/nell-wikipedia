// Backbone model.
// This class embodies the mediawiki content for a given page.  It handles
// fetching the content from the network or local storage (as appropriate).
define(['backbone', './config', 'jquery', './pagedb', './static', './util'], function(Backbone, Config, $, PageDB, Static, Util) {

    var Page = Object.create(null);
    Page.Model = Backbone.Model.extend({
        idAttribute: 'title'
    });
    Page.Collection = Backbone.Collection.extend({
        model: Page.Model
    });
    var url_subst = function(pattern, extra) {
        return pattern.replace(/\{\{(\w+)\}\}/g, function(match, word) {
            var val;
            if (extra && Object.prototype.hasOwnProperty.call(extra, word)) {
                val = extra[word];
            } else if (Config[word]) {
                val = Config[word];
            } else {
                return match; // unexpanded
            }
            return url_subst(val, extra);
        });
    };
    var xhr_error = function(callback) {
        return function(xhr, textStatus, errorThrown) {
            callback({obj:xhr, message:textStatus, ex:errorThrown});
        };
    };
    // callback(err, parsoid_format)
    var convertMarkup = function(title, markup, callback) {
        return $.ajax({
            url: url_subst(Config.parsoid_api_url, { title: (title || '') }),
            type: 'POST',
            data: { wt: markup },
            dataType: 'html',
            error: xhr_error(callback),
            success: function(data, textStatus, xhr) {
                if (data) {
                    callback(null, data);
                } else {
                    // error
                    callback({obj:xhr, message:'bad data returned', ex:null});
                }
            }
        });
    };
    var readMarkup = function(title, callback) {
        var url=url_subst("http://{{lang}}.wikipedia.org/wiki/Special:Export");
        var query = "select * from xml where url='"+url+"'";
        return $.ajax({
            url: 'http://query.yahooapis.com/v1/public/yql',
            data: { q: query, format: 'json' },
            dataType: 'jsonp',
            error: xhr_error(callback),
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
                    callback(null, fields);
                } else {
                    // error
                    callback({obj:xhr, message:'bad data'});
                }
            }
        });
    };
    var readParsoid = function(title, callback) {
        var url = url_subst(Config.parsoid_api_url, { title: title });
        return $.ajax({
            url: url,
            dataType: 'html',
            error: xhr_error(callback),
            success: function(data, textStatus, xhr) {
                if (data) {
                    var page = { revision: { text: { content: data } } };
                    // XXX parse out revision? title? from html
                    var fields = {
                        title: page.title || title,
                        revision: page.revision.id,
                        parentid: page.revision.parentid,
                        sha1: page.revision.sha1,
                        timestamp: page.revision.timestamp,
                        html: page.revision.text.content || ''
                    };
                    callback(null, fields);
                } else {
                    // error
                    callback({obj:xhr, message:'bad data returned', ex:null});
                }
            }
        });
    };
    var readUncached = function(model, options, success, error) {
        var markup;
        var title = Util.normalize_title(model.id);
        switch (title) {
        case Config.home:
            markup = Static.HOME;
            break;
        case Config.about:
            markup = Static.ABOUT;
            break;
        case Config.settings:
            markup = Static.SETTINGS;
            break;
        /*
        case 'Star':
            markup = Static.STAR;
            break;
        */
        default:
            return readParsoid(title, function(err, fields) {
                // XXX if err, show 'page not available; offline'
                if (err) { return error(model, err.obj, options); }
                success(model, fields, options);
            });
        }
        return convertMarkup(title, markup, function(err, parsoid_format) {
            // XXX if err, show 'page not available; offline'
            if (err) { return error(model, err.obj, options); }
            success(model, {
                title: title,
                html: parsoid_format
            }, options);
        });
    };

    Page.sync = {
        create: function(model, options, success, error) {
        },
        update: function(model, options, success, error) {
        },
        'delete': function(model, options, success, error) {
        },
        read: function(model, options, success, error) {
            var title = Util.normalize_title(model.id);
            var fallback = function() {
              readUncached(model, options, function(model, fields, options) {
                PageDB.put(title, fields).done();
                success(model, fields, options);
              }, error);
            };
            PageDB.get(title).then(function(result) {
                if (!result) { return fallback(); }
                success(model, result, options);
            }, fallback).done();
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
