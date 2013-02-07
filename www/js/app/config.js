// Configuration for the wikipedia activity.
define([], function() {
    var Config = {
        // language to use for wikipedia content.
        // (ie, <lang>.wikipedia.org)
        lang: 'simple',
        // whether to use hashes or slashes
        path_root: '#!/', /* '#!/' or '#' or '' */
        // portal page
        home: 'Nell:Home',
        // about page
        about: 'Nell:About'
    };
    return Config;
});
