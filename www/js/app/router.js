// Backbone router!
define(['backbone', './config', './page', './util'], function(Backbone, Config, Page, Util) {
    // Page routing
    var use_hash = false, base = Config.path_root;
    if (base[0]=='#') {
        use_hash = true; base = base.slice(1);
    }
    var Router = Backbone.Router.extend({
        routes: { },
        initialize: function(options) {
            this.view = options.view;
        },
        showAbout: function() {
            this.gotoWiki(Config.about);
        },
        showSettings: function() {
            this.gotoWiki(Config.settings);
        },
        defaultPage: function() {
            this.gotoHome();
        },
        wikiPage: function(lang, title) {
            console.log('wiki view',lang, title,'opened');
            var model = new Page.Model({title: title});
            this.view.setModel(model);
            model.fetch();
        },
        gotoWiki: function(title) {
            this.navigate(base + Config.lang + "/" +
                          Util.normalize_title(title), true);
        },
        gotoHome: function() {
            this.gotoWiki(Config.home);
        }
    });
    Router.prototype.routes[base+'about'] = "showAbout";
    Router.prototype.routes[base+'settings'] = "showSettings";
    Router.prototype.routes[base+'*lang/*title'] = "wikiPage";
    // order of route definition matters (sigh) so wildcard has to be last
    Router.prototype.routes['*other'] = "defaultPage";
    Router.use_hash = use_hash;
    return Router;
});
