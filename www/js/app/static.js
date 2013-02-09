// XXX replace this with content loaded via the text plugin
// (it should also be xml, which we then parse)
define(['text!./Home.mw', 'text!./About.mw', 'text!./Star.mw'], function(HOME, ABOUT, STAR) {
    var Static = Object.create(null);
    Static.HOME = HOME;
    Static.ABOUT = ABOUT;
    Static.STAR = STAR;
    return Static;
});
