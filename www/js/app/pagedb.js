// IndexedDB database of page contents
define(['jquery', './db'], function($, Db) {
  var STORE_NAME = "pages";
  var schema = {
    id: 'pages',
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
  var cleanup = function(req) {
    // helps prevent leaks on chrome
    req.onsuccess = req.onerror = null;
  };

  var PageDB = new Db(schema);
  PageDB.exists = function(page_title) {
    var result = $.Deferred();
    this.ready.then(function(db) {
      var req = db.transaction(STORE_NAME).
        objectStore(STORE_NAME).openCursor(Db.KeyRange.only(page_title));
      req.onsuccess = function(event) {
        // exists iff req.result is not null (but firefox returns undefined
        // instead, sigh)
        var exists = (req.result !==null && req.result !== undefined);
        result.resolve(exists);
        cleanup(req);
      };
      req.onerror = function(event) {
        result.reject(event);
        cleanup(req);
      };
    }, function(error) { result.reject(error); });
    return result.promise();
  };
  PageDB.get = function(page_title) {
    var result = $.Deferred();
    this.ready.then(function(db) {
      var req = db.transaction(STORE_NAME).
        objectStore(STORE_NAME).get(page_title);
      req.onsuccess = function(event) {
        // XXX uncompress, someday
        result.resolve(req.result);
        cleanup(req);
      };
      req.onerror = function(event) {
        result.reject(event);
        cleanup(req);
      };
    }, function(error) { result.reject(error); });
    return result.promise();
  };
  PageDB.put = function(page_title, page_source) {
    var result = $.Deferred();
    this.ready.then(function(db) {
      // XXX compress page_source, someday
      var req = db.transaction(STORE_NAME, Db.READ_WRITE).
        objectStore(STORE_NAME).put(page_source, page_title);
      req.onsuccess = function(event) {
        result.resolve(req.result /* key */);
        cleanup(req);
      };
      req.onerror = function(event) {
        result.reject(event);
        cleanup(req);
      };
    }, function(error) { result.reject(error); });
    return result.promise();
  };
  return PageDB;
});
