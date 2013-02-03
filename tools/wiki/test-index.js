#!/usr/bin/env node
// Test the compressed wikipedia database

var requirejs = require('requirejs');
requirejs(['commander', 'fs', 'seek-bzip', './StringMap', './version'], function(program, fs, Bunzip, StringMap, version) {
    var DEBUG = false;
    var input_xml_file_name = 'simple/simplewiki-20130112-pages-articles.xml';

    var normalize_title = function(title) {
        return (title || '')
            .replace(/^\s+/, '')
            .replace(/\s+$/, '')
            .replace(/\s+/, '_')
            .replace(/^./, function(s) { return s.toUpperCase(); });
    };
    var RedirectParser = function(file_name) {
        this.redirects = new StringMap();
        // load redirects
        var link_re = /\[\[.*?\]\]/g;
        var input_redirects = fs.readFileSync(file_name+'.redirects_used',
                                              'utf-8').split(/\r\n?|\n/);
        input_redirects.forEach(function(line, line_index) {
            var links = line.match(link_re);
            if (links && links.length == 2) {
                this.redirects.set(normalize_title(links[0].slice(2,-2)),
                                   normalize_title(links[1].slice(2,-2)));
            }
            if (DEBUG) { console.log('Processing '+line_index); }
        }.bind(this));
        if (DEBUG) {
            this.redirects.keys().forEach(function(k) {
                console.log(k, '->', this.redirects.get(k));
            }.bind(this));
        }
    };
    RedirectParser.prototype.get_redirected = function(article_title) {
        return this.redirects.get(normalize_title(article_title), null);
    };

    var DataRetriever = function(data_files_base, redirects_checker) {
        this._bzip_file_name = data_files_base + '.processed.bz2';
        var _bzip_table_file_name = data_files_base + '.processed.bz2t';
        var _index_file_name = data_files_base + '.processed.idx';
        this.template_re = /({{.*?}})/;
        this.redirects_checker = redirects_checker;
        // load article position table
        this._article_position = new StringMap();
        var index_file = fs.readFileSync(_index_file_name, 'utf-8').
            split(/\r\n?|\n/);
        index_file.forEach(function(index_line, line_no) {
            var words = index_line.split(/\s+/);
            if (words.length !== 3) { return; }
            var position = { num_block: words[1], position: words[2] };
            this._article_position.set(words[0], position);
        }.bind(this));
        // load block start table
        this._block_start = [];
        var bzip_table_file = fs.readFileSync(_bzip_table_file_name, 'utf-8').
            split(/\r\n?|\n/);
        bzip_table_file.forEach(function(table_line, line_no) {
            var parts = table_line.split(/\s+/);
            var block_start = +parts[0];
            // xxx what is parts[1], pray tell? [csa]
            this._block_start.push(block_start);
        }.bind(this));
    };
    DataRetriever.prototype._get_article_position = function(article_title) {
        article_title = normalize_title(article_title);
        var position = this._article_position.get(article_title);
        if (!position) {
            // look at redirects
            var redirect = this.redirects_checker.get_redirected(article_title);
            if (DEBUG) {
                console.log('Searching redirect from', article_title,
                            'to', redirect);
            }
            if (redirect) {
                return this._get_article_position(redirect);
            }
        }
        if (DEBUG && position) {
            console.log('Numblock', position.num_block,
                        'position', position.position);
        }
        return position;
    };
    DataRetriever.prototype._get_block_start = function(num_block) {
        num_block--; // num_block is 1-based
        if (num_block < 0 || num_block >= this._block_start.length) {
            return -1;
        }
        return this._block_start[num_block];
    };
    DataRetriever.prototype.get_text_article = function(article_title) {
        output = '';
        if (DEBUG) { console.log('Looking for article', article_title); }

        var position = this._get_article_position(article_title);
        if (!position) {
            console.log('Article not found');
            return '';
        }
        if (DEBUG) { console.log('Found at block', position.num_block,
                                 'position', position.position); }

        var block_start = this._get_block_start(position.num_block);
        if (DEBUG) { console.log('Block', position.num_block,
                                 'starts at', block_start); }
        if (block_start === -1) { return ''; }

        // extract the block
        // XXX THIS SHOULD STREAM THE DATA
        var compressedData = fs.readFileSync(this._bzip_file_name);
        var block = Bunzip.decodeBlock(compressedData, block_start);
        // advance to 'position'
        block = block.slice(position.position);
        // convert to utf-8
        block = block.toString('utf-8');
        // find the end-of-article marker ('\n\003\n')
        var end = block.search(/^\x03$/m);
        while (end < 0) {
            //end = undefined; break;
            // read next block
            block_start = this._get_block_start(++position.num_block);
            var next_block = Bunzip.decodeBlock(compressedData, block_start);
            block += next_block.toString('utf-8');
            end = block.search(/^\x03$/m);
        }
        block = block.slice(0, end);
        return block;
    };

    // ----------- main routine ---------------
    program
        .version(version)
        .usage('[options] <article title>')
        .option('-x, --xml <filename>',
                'Base name for database file',
                input_xml_file_name)
        .parse(process.argv);
    if (program.args.length !== 1) {
        console.error("Use ./test-index.js page_title");
        return;
    }
    page_title = program.args[0];

    redirects_checker = new RedirectParser(program.xml);
    data_retriever = new DataRetriever(program.xml, redirects_checker);
    console.log(data_retriever.get_text_article(page_title));
});
