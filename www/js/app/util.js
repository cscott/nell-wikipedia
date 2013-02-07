// miscellaneous generally-useful utility functions
define([], function() {
    var Util = Object.create(null);

    Util.normalize_title = function(title) {
        return (title || '')
            .replace(/^\s+/, '')
            .replace(/\s+$/, '')
            .replace(/\s+/, '_')
            .replace(/^./, function(s) { return s.toUpperCase(); });
    };

    return Util;
});
