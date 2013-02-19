# Nell's Wikipedia

This is an offline browser for Wikipedia.  Unlike other offline readers,
it doesn't require a preprocessing step: it reads article text (in
[parsoid](http://www.mediawiki.org/wiki/Parsoid/About) format)
directly from Wikipedia. (At the moment it uses an external parsoid
server to translate from mediawiki to parsoid format on the fly,
however Wikipedia's
[long-term plan](http://www.mediawiki.org/wiki/Future/Parser_plan)
is to support parsoid format directly from its
[API](https://www.mediawiki.org/wiki/API:Main_page).)
We then store the data in a local
[IndexedDB](http://en.wikipedia.org/wiki/Indexed_Database_API) for future
offline use.  Any page you visit while online can then be accessed
offline as well.

You can also seed the app with a collection of useful pages, or pages
linked from pages you've visited before, to make it more likely that
the information you want will be ready when you need it.

Nell's Wikipedia also downloads images used on pages, although it shrinks
and compresses them heavily to save space.

We hope to also support editing pages off-line, peer-to-peer sharing page
changes with friends, and uploading changes back to Wikipedia the next
time the user is online.  We hope to use the
[Visual Editor](http://www.mediawiki.org/wiki/VisualEditor) codebase
for editing and page diffs.

## Under the hood

Pages are [LZMA](http://en.wikipedia.org/wiki/LZMA)-compressed in
moderately-sized batches, since compression
works better when pages are compressed together.
<!--
  Each batch is stored in
a [B-tree](http://en.wikipedia.org/wiki/B-tree) in order to support dynamic
insertion/deletion of pages into the compressed store.
-->

The current implementation of the parsoid format results in output a
factor of 10 larger than mediawiki markup.  After LZMA compression the
parsoid is only 3x larger.  We hope that further improvements will be
made upstream.

Images are resized using an HTML5 canvas before being compressed and stored
like pages. (XXX: jpeg compression should actually be done w/ canvas; check
current browser support for this).

## Related libraries

Nell's Wikipedia was inspired by Kevin Kwow (antimatter15)'s
[offline wiki](https://code.google.com/p/offline-wiki/) and
the Sugar [Wikipedia](http://wiki.laptop.org/go/WikiBrowse) activity.
It uses the following libraries:
* [lzma-purejs](http://github.com/cscott/lzma-purejs) by Gary Linscott
* [parsoid](http://www.mediawiki.org/wiki/Parsoid) to convert mediawiki markup

Previous versions of the code used the following libraries:
* [Instaview](http://github.com/cscott/instaview) to render mediawiki markup
* [seek-bzip](http://github.com/cscott/seek-bzip) to do random seeks inside a bzip-compressed file
* [html5slider](http://frankyan.com/labs/html5slider/) by Frank Yan
* [HTML5 Progress Polyfill](http://github.com/LeaVerou/HTML5-Progress-polyfill) by Lea Verou
