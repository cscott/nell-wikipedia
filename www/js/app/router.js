// Backbone router!
define(['backbone', './page', './view'], function(Backbone, Page, _) {
    // Page routing
    var Router = Backbone.Router.extend({
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
            var view = new Page.View({title: title});
        }
    });
    return Router;
});
