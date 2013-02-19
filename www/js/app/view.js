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
            var html = '', title = '';
            if (this.model) {
                title = this.model.get('title') || '';
                html = this.model.get('html') || '';
                if (!html) {
                    var markup = this.model.get('markup') || '';
                    html = InstaView.convert(markup);
                }
            }
            var pagedoc = document.implementation.createHTMLDocument(title);
            if (html) {
                // a bit of a hack, ignore attributes of <html> element,
                // probably ok though
                pagedoc.documentElement.innerHTML = html;
            }
            var base_href = pagedoc.querySelector('base[href]');
            if (base_href) base_href = base_href.getAttribute('href');
            // fix up <img>
            var url_combine = function(base, url) {
                // specially handle local images
                var localimg_re = /^[.]+\/(Special:FilePath\/|File:)Nell:/;
                if (localimg_re.test(url)) {
                    return url.replace(localimg_re, 'static/');
                }
                // xxx fixme this isn't very general
                if (url.slice(0,2)=='./') {
                    return base + url.slice(2);
                }
                return url;
            };
            var rewriteAttr = function(attrName) {
                return function(el) {
                    var oldAttr = el.getAttribute(attrName);
                    var newAttr = url_combine(base_href, oldAttr);
                    el.setAttribute(attrName, newAttr);
                    return el;
                };
            };
            Array.prototype.forEach.call(pagedoc.querySelectorAll('img[src]'),
                                         rewriteAttr('src'));
            // xxx fix up links
            this.$el.html(pagedoc.body.innerHTML);
            var $siteSub = $.parseHTML('<h1 id="firstHeading" class="firstHeading"></h1><div id="siteSub">From Wikipedia, the free encyclopedia</div><div id="contentSub"></div>');
            this.$el.prepend($siteSub);
            $('#firstHeading').text(title.replace(/_/g,' '));
            // update the search field
            $('#search').val(title);
        }
    });
    return Page.View;
});
