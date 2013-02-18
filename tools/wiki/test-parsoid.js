#!/usr/bin/env node
// Test the size of compressed parsoid HTML

var requirejs = require('requirejs'), pjson = require('../../package.json');
requirejs(['commander', 'async', 'fs', 'http'], function(program, async, fs, http) {
    "strict mode";
    var PARSOID_HOST = 'nell-parsoid.aws.af.cm';

    // main routine
    program
        .version(pjson.version)
        .usage('[options] <article list file>')
        .option('-l, --lang <lang>',
                'Wikipedia language', 'simple')
        .option('-o, --output <filename>',
                'Name of output file', 'parsoid-pages.html')
        .parse(process.argv);

    var article_list_file =
        'simplewiki-20130112-pages-articles.xml.processed.idx';
    if (program.args.length >= 1) {
        article_list_file = program.args[0];
    }
    var article_list = fs.readFileSync(article_list_file, 'utf-8').
        split(/[\r\n]+/).
        map(function(line) {
            return line.split(/\s+/)[0];
        }).filter(function(title) { return !!title; });
    //article_list.forEach(function(title) { console.log(JSON.stringify(title)); });

    var output = fs.createWriteStream(program.output, {encoding:'utf8'});

    var fetchOne = function(title, callback) {
        var page_url = 'http://'+PARSOID_HOST+'/'+program.lang+'/'+title;
        var page_contents = '';
        console.log(title, 'requested');
        http.get(page_url, function(res) {
            console.assert(res.statusCode === 200);
            console.log(title, 'response begun');
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                page_contents += chunk;
            }).on('end', function() {
                callback(null, {title:title, contents:page_contents});
            });
        }).on('error', function(e) {
            console.error("HTTP ERROR", e.message);
            callback(e);
        });
    };
    var writeOne = function(page, callback) {
        output.write(page.title+'\n');
        var buffer = new Buffer(page.contents, 'utf8');
        output.write(buffer.length+'\n');
        output.write(buffer);
        console.log(page.title, 'written');
        callback(null, 'done');
    };
    // create 'auto'
    tasks = article_list.map(function(title) {
        return function(callback) {
            async.waterfall([function(cb1) {cb1(null, title);},
                             fetchOne, writeOne], callback);
        };
    });

    //tasks[0](function(e,r) { console.log(e,r); output.destroySoon(); });
    //fetchOne(article_list[0], function(x){console.log(x);});

    async.series(tasks, function(e, r) {
        console.log(e, r);
        output.destroySoon();
    });
});
