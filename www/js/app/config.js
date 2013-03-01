// Configuration for the wikipedia activity.
define([], function() {
    var Config = {
        // parsoid helper
        parsoid_host: 'nell-parsoid.aws.af.cm',
        parsoid_convert_mw_url: 'http://{{parsoid_host}}/_wikitext/',
        parsoid_fetch_url: 'http://{{parsoid_host}}/{{lang}}/{{title}}',
        // whether to use hashes or slashes
        path_root: '#!/', /* '#!/' or '#' or '' */

        // language to use for wikipedia content.
        // (ie, <lang>.wikipedia.org)
        lang: 'simple',

        // xxx: these should be localized?
        // portal page
        home: 'Nell:Home',
        // about page
        about: 'Nell:About',
        // settings page
        settings: 'Nell:Settings'
    };
    return Config;
});
