// IndexedDB database of page contents
define(['jquery', './db'], function($, Db) {
  var STORE_NAME = "pages";
  var schema = {
    id: 'pages',
    store_name: STORE_NAME,
    description: "Database of wiki page contents",
    migrations: [
      {
        version: 1,
        migrate: function(transaction) {
          transaction.db.createObjectStore(STORE_NAME);
        }
      }
    ]
  };

  var PageDB = function() {
    Db.call(this, schema); // superclass constructor
  };
  var _super = Db.prototype;
  PageDB.prototype = Object.create(_super);
  PageDB.prototype.get = function(page_title) {
    return _super.get.call(this, page_title).then(function(page) {
      // XXX uncompress
      return page;
    });
  };
  PageDB.prototype.put = function(page_title, page_source) {
    // XXX compress
    return _super.put.call(this, page_title, page_source);
  };

  return new PageDB(); // singleton!
});
