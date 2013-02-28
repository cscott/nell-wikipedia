// IndexedDB driver infrastructure.
// inspiration from http://github.com/superfeedr/indexeddb-backbonejs-adapter
// and http://github.com/cobbweb/backbone-indexeddb-example
define(['jquery'], function($) {
  var DEBUG = true;
  var debugLog = function() {
    if (!(DEBUG && console)) return;
    console.log.apply(console, arguments);
  };

  var prefixes = ['','webkit','moz','ms','o'];
  var getPrefixedProperty = function(obj, property) {
    var i;
    for (i=0; i<prefixes.length; i++) {
      var pre = prefixes[i];
      var prop = pre + ((!pre) ? property :
                        (property[0].toUpperCase() + property.slice(1)));
      if (obj[prop]) return obj[prop];
    }
    return undefined;
  };

  // this is only safe to do because we're in a function.
  // otherwise 'var indexedDB' stomps on 'window.indexedDB'
  var indexedDB = getPrefixedProperty(window, 'indexedDB');
  var IDBTransaction = getPrefixedProperty(window, 'IDBTransaction');
  var IDBKeyRange = getPrefixedProperty(window, 'IDBKeyRange');
  var IDBCursor = getPrefixedProperty(window, 'IDBCursor');
  var IDBDatabaseException = getPrefixedProperty(window, 'IDBDatabaseException');

  // see https://groups.google.com/a/chromium.org/forum/?fromgroups#!topic/chromium-html5/OhsoAQLj7kc
  var READ_WRITE = (IDBTransaction && 'READ_WRITE' in IDBTransaction) ?
    IDBTransaction.READ_WRITE : 'readwrite';
  var READ_ONLY = (IDBTransaction && 'READ_ONLY' in IDBTransaction) ?
    IDBTransaction.READ_ONLY : 'readonly';


  // There is a driver for each schema provided. The schema is a the
  // combination of name (for the database), a version as well as migrations
  // to reach that version of the database.
  // when the driver is ready (or has an error) the supplied Deferred
  // will be resolved/rejected
  var Db = function(schema, deferred) {
    var self = this;
    this.schema         = schema;
    this.db             = null;
    if (!deferred) { deferred = $.Deferred(); }
    this.ready = deferred.promise();

    var latestVersion =
      schema.migrations[schema.migrations.length-1].version;
    console.assert(typeof(latestVersion)==='number');
    debugLog("opening database", schema.id,
             "in version", latestVersion);
    // schema version needs to be an unsigned long
    var dbRequest      = indexedDB.open(schema.id, latestVersion);
    var cleanup = function() {
      // manually clean up event handlers; this helps on chrome
      ['onupgradeneeded','onblocked','onsuccess','onerror'].
        forEach(function(f) { dbRequest[f] = null; });
    };
    var win = function() {
      cleanup();
      // resolve the deferred
      deferred.resolve(self.db);
    };
    var lose = function(reason) {
      cleanup();
      deferred.reject(reason);
    };

    dbRequest.onerror = function(event) {
      lose("could not open db: " + dbRequest.errorCode);
    };
    dbRequest.onblocked = function(event) {
      lose("db request is blocked");
    };
    var migrateFrom = function(oldVersion, transaction) {
      schema.migrations.forEach(function(migration) {
        if (migration.version < oldVersion) {
          debugLog("skipping migration", migration.version);
          return;
        }
        // ok, let's do this migration.
        // each step must be synchronous, because the indexeddb spec says
        // that the transaction commits just as soon as we yield to the
        // browser event loop.
        migration.migrate(transaction); // must be synchronous.
      });
    };

    var definitelyUsingNewAPI = false;
    dbRequest.onupgradeneeded = function(event) {
      if (!('oldVersion' in event)) {
        // strange intermediate version of the spec
        return lose('onupgradeneeded, but no oldVersion field');
      }
      // aha! we know that this impl supports the onupgradeneeded event!
      definitelyUsingNewAPI = true;
      self.db = dbRequest.result;
      var transaction = dbRequest.transaction;
      console.assert(event.newVersion === latestVersion);
      migrateFrom(event.oldVersion || 0, transaction);
      // will end up in onsuccess callback when upgrade is complete.
    };

    dbRequest.onsuccess = function (e) {
      self.db = e.target.result; // Attach the db connection
      if (definitelyUsingNewAPI) {
        // we came in through the onupgrade needed path, we're good!
        return win();
      }
      // we might be using the old setVersion API; check it.
      // we need to convert version because usually (not always) it's a string
      var currentVersion = self.db.version;
      if (typeof(currentVersion) !== 'number') {
        currentVersion = parseInt(currentVersion, 10) || 0;
      }
      if (currentVersion === latestVersion) {
        return win();
      } else if (currentVersion > latestVersion) {
        return lose("existing database more modern (v"+currentVersion+") "+
                    "than current code (v"+latestVersion+")");
      } else {
        // old api, untested
        var setVrequest = self.db.setVersion(''+currentVersion);
        setVrequest.onsuccess = function(event) {
          var transaction = setVrequest.result;
          setVrequest.onsuccess = setVrequest.onerror = null;
          // can't do the migration unless in the version change transaction
          migrateFrom(currentVersion, transaction);
          transaction.oncomplete = win;
          transaction.onerror = function() {
            lose("version change transaction failed");
          };
        };
        setVrequest.onerror = function() {
          setVrequest.onsuccess = setVrequest.onerror = null;
          lose("version change failed");
        };
      }
    };
  };
  Db.prototype.close = function() {
    if (this.db) { this.db.close(); this.db = null; }
  };

  // useful constants for subclasses
  Db.KeyRange = IDBKeyRange;
  Db.Cursor = IDBCursor;
  Db.DatabaseException = IDBDatabaseException;
  Db.READ_WRITE = READ_WRITE;
  Db.READ_ONLY = READ_ONLY;

  return Db;
});
