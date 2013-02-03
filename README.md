# Nell's Wikipedia

This is an offline browser for Wikipedia.  Unlike other offline readers,
it doesn't require a preprocessing step: it reads article text (in
mediawiki format) directly from Wikipedia, using the
[Special:Export](http://meta.wikimedia.org/wiki/Special:Export) interface
of mediawiki.  It then stores the data in a local
[IndexedDB](http://en.wikipedia.org/wiki/Indexed_Database_API) for future
offline use.  Any page you visit while online can then be accessed
offline as well.

You can also seed the app with a collection of useful pages, or pages
linked from pages you've visited before, to make it more likely that
the information you want will be ready when you need it.

Nell's Wikipedia also downloads images used on pages, although it shrinks
and compresses them heavily to save space.

## Under the hood

Pages are [LZMA](http://en.wikipedia.org/wiki/LZMA)-compressed in
moderately-sized batches, since compression
works better when pages are compressed together.  Each batch is stored in
a [B-tree](http://en.wikipedia.org/wiki/B-tree) in order to support dynamic
insertion/deletion of pages into the compressed store.

Images are resized using an HTML5 canvas before being compressed and stored
like pages. (XXX: jpeg compression should actually be done w/ canvas; check
current browser support for this).

## Related libraries

Nell's Wikipedia was inspired by Kevin Kwow (antimatter15)'s
[offline wiki](https://code.google.com/p/offline-wiki/) and
the Sugar [Wikipedia](http://wiki.laptop.org/go/WikiBrowse) activity.
It uses the following libraries:
* [Instaview](http://en.wikipedia.org/wiki/User:Pilaf/InstaView) to render mediawiki markup
* [html5slider](http://frankyan.com/labs/html5slider/) by Frank Yan
* [HTML5 Progress Polyfill](https://github.com/LeaVerou/HTML5-Progress-polyfill) by Lea Verou
* [lzmajs](https://github.com/glinscott/lzmajs) by Gary Linscott
