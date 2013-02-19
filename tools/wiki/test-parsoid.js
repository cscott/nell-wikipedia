#!/usr/bin/env node
// Test the size of compressed parsoid HTML

var requirejs = require('requirejs'), pjson = require('../../package.json');
requirejs(['commander', 'async', 'fs', 'http'], function(program, async, fs, http) {
    "strict mode";
    var PARSOID_HOST = 'nell-parsoid.aws.af.cm';
    var DEBUG = false;

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

    var output = fs.createWriteStream(program.output, {encoding:'utf8'});

    var fetchOne = function(title, callback) {
        var page_url = 'http://'+PARSOID_HOST+'/'+program.lang+'/'+title;
        var page_contents = '';
        if (DEBUG) console.log(title, 'requested');
        http.get(page_url, function(res) {
            if (res.statusCode !== 200) {
                console.error("HTTP ERROR CODE", res.statusCode, title);
                callback(null, {title:title, contents:"<h1>"+res.statusCode+"</h1>"});
                return;
            }
            console.assert(res.statusCode === 200, res.statusCode+' '+title);
            if (DEBUG) console.log(title, 'response begun');
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                page_contents += chunk;
            }).on('end', function() {
                callback(null, {title:title, contents:page_contents});
            });
        }).on('error', function(e) {
            console.error("HTTP EXCEPTION", e.message);
            callback(e);
        });
    };
    var writeOne = function(page, callback) {
        output.write(page.title+'\n');
        var buffer = new Buffer(page.contents, 'utf8');
        output.write(buffer.length+'\n');
        output.write(buffer);
        if (DEBUG) console.log(page.title, 'written');
        callback(null, 'done');
    };
    // create 'auto' dependency object
    var previous = null, autodeps = {};
    article_list.forEach(function(title) {
        autodeps["FETCH "+title] = function(callback) {
            fetchOne(title, callback);
        };
        autodeps["WRITE "+title] = ["FETCH "+title, function(callback, results){
            var page = results["FETCH "+title];
            writeOne(page, callback);
        }];
        if (previous) {
            autodeps["WRITE "+title].unshift("WRITE "+previous);
        }
        previous = title;
    });
    async.auto(autodeps, function() {
        output.destroySoon();
    });
});
