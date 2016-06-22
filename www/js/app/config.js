// Configuration for the wikipedia activity.
define([], function() {
    var Config = {
        // rest API
        rest_url: 'https://{{wiki}}/api/rest_v1',
        rest_post_url: '{{rest_url}}/transform/wikitext/to/html/{{title}}',
        rest_get_url: '{{rest_url}}/page/html/{{title}}',

        // whether to use hashes or slashes
        path_root: '#!/', /* '#!/' or '#' or '' */

        // which wiki project to use.
        // (ie, en.wikipedia.org, de.wikipedia.org, ...)
        wiki: 'simple.wikipedia.org',

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
