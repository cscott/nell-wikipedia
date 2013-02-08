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
        defaultPage: function() {
            this.gotoWiki(Config.home);
        },
        wikiPage: function(title) {
            console.log('wiki view',title,'opened');
            var model = new Page.Model({title: title});
            this.view.setModel(model);
            model.fetch();
        },
        gotoWiki: function(title) {
            this.navigate(base+"wiki/"+Util.normalize_title(title), true);
        }
    });
    Router.prototype.routes[base+'about'] = "showAbout";
    Router.prototype.routes[base+'wiki/*title'] = "wikiPage";
    // order of route definition matters (sigh) so wildcard has to be last
    Router.prototype.routes['*other'] = "defaultPage";
    Router.use_hash = use_hash;
    return Router;
});
