define(['backbone','instaview','./page'], function(Backbone, InstaView, Page) {

    Page.View = Backbone.View.extend({
        initialize: function(options) {
            this.model = new Page.Model({title: options.title});
            this.model.fetch();
            this.render();
            this.model.on('changed', this.render, this);
            $('#main-content').append(this.$el);
        },
        render: function() {
            console.log('rendering page', this.model);
            var markup = this.model.get('markup') || '';
            var html = InstaView.convert(markup);
            this.$el.html(html);
            var heading = document.createElement('h1');
            $(heading).text(this.model.get('title'));
            this.$el.prepend(heading);
        }
    });

});
