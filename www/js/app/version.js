define([], function() {
    // the version of the nell-wikipedia app
    // expressed as a json structure which we immediately dereference in order
    // to fit this into the general-purpose "version updater" volofile rule.
    return {
        version: "0.0.1"
    }.version;
});
