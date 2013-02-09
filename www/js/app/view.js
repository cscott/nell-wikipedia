define(['backbone','instaview','./page'], function(Backbone, InstaView, Page) {

    Page.View = Backbone.View.extend({
        el: '#main-content',
        setModel: function(model) {
            var oldModel = this.model;
            if (oldModel) {
                oldModel.off('change', this.render, this);
            }
            this.model = model;
            if (model) {
                model.on('change', this.render, this);
            }
            this.render();
        },
        render: function() {
            console.log('rendering page', this.model);
            var markup = '', title = '';
            if (this.model) {
                markup = this.model.get('markup') || '';
                title = this.model.get('title') || '';
            }
            var html = InstaView.convert(markup);
            this.$el.html(html);
            var heading = document.createElement('h1');
            $(heading).text(title);
            this.$el.prepend(heading);
            // update the search field
            $('#search').val(title);
        }
    });
    return Page.View;
});
