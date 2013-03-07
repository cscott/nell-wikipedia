#!/usr/bin/env node
// Test the size of compressed parsoid HTML
// Results:
// chunk size: compressed size:
//               lzma      lzma      gzip      bzip2     lzjb      lzop      zip     lzjb
//              no param    -9        -9         -9                 -9       -9       -9h
//  infinity -h           14967989  26650950  17930721  50197969  31544094  26651128  43983952
//  infinity    15426238  14675333  26182154  17593259  53738192  31271534  26438118  n/a
//  128M        15455233  14769416  26184338  17598086  53738246  31279698  26437023  43984010
//  64M         15506011  14910867  26184657  17598560  53738367  31244642  26439352  43984566
//  32M         15557631  15169918  26185219  17610864  53738536  31265284  26441124  43984773
//  16M         15692528  15527769  26185212  17631221  53738819  31240932  26442573  43985508
//  8M          15967732  15901082  26188891  17654735  53739487  31244933  26448267  43986798
//  4M          16400537  16346748  26191746  17633309  53740503  31272016  26456007  43989657
//  2M          16953821  16916865  26201557  17840893  53743146  31283844  26472706  43994246
//  1M          17596643  17572602  26223246  18060254  53747578  31309521  26506212  44006579
//  512k        18347722  18337886  26262753  18232726  53754838  31339368  26574403  44023623
//  256k        19232445  19239923  26318554  19359853  53769223  31387257  26681484  44052364
//  128k        20151072  20174159  26427046  20574607  53789789  31346648  26861464  44087864
//  64k         20947563  20978675  26577423  21706596  53819259  31727129  27106999  44121894
//  32k         21605776  21630416  26798414  22676576  53852798  32333387  27431212  44147186
//  16k         22021787  22041994  27088978  23292376  53880889  32830968  27808544  44161980
//  8k          22161326  22180570  27204324  23479141  53891621  32994667  27956215  44166169
//  4k          22197510  22216601  27234325  23523785  53895232  33036109  27996098  44167442
//  0           22213842  22233151  27256283  23548696  53899116  33068669  28101119  n/a
//  0, w/ -h              22472213  27531832  23923680  50224034  33323238  28179632  44170962
//  0, w/ -1              22999470
//uncompressed 207758353


var requirejs = require('requirejs'), pjson = require('../../package.json');
requirejs(['commander', 'fs', 'lzma-purejs', 'lzjb'], function(program, fs, lzmajs, lzjb) {
    "strict mode";
    var PARSOID_SOURCES = "parsoid-pages.html";
    var DEBUG = false;
    var CHUNK_SIZE = 2*1024*1024;

    // main routine
    program
        .version(pjson.version)
        .usage('[options] [optional chunk size]')
        .option('-f, --file <filename>',
                'Name of input file', PARSOID_SOURCES)
        .option('-c, --compress <type>',
                'Use lzma/lzjb/no compression', 'none')
        .option('-l, --level <num>',
                'Compression level', null/*default*/)
        .option('-w, --write-chunks',
                'Emit each compressed chunk', false)
        .option('-d, --directory <directory name>',
                'Directory to write compressed chunks to', null)
        .option('-h, --html', // only seems to help lzjb
                'Preprocess for better html compression', false)
        .option('-s, --silent',
                "Don't emit progress messages")
        .parse(process.argv);

    if (program.args.length > 0) {
        if (!/^\d+$/.test(program.args[0])) {
            console.error('Bad chunk size argument:', program.args[0]);
            return 1;
        }
        CHUNK_SIZE = parseInt(program.args[0], 10);
    }

    var writeNumber = function(r, num) {
        // write a big-endian self-delimiting number (groups of 7
        // bits, with top bit clear to indicate "more to come").
        var size = [];
        do {
            size.push( num & 0x7F );
            num = Math.floor(num / 128);
        } while (num !== 0);
        size[0] |= 0x80;
        size.reverse();
        r.push.apply(r, size);
    };
    var html_preprocess = function(buffer) {
        // split text into four contexts: outside tags, inside tags, inside single-quoted
        // attributes, and inside double-quoted attributes.
        var state = {
            which: 'text',
            text: [],
            html: [],
            asingle: [],
            adouble: []
        };
        var LT = '<'.charCodeAt(0), GT = '>'.charCodeAt(0);
        var SQ = "'".charCodeAt(0), DQ = '"'.charCodeAt(0);
        var i, c;
        for (i=0; i<buffer.length; i++) {
            c = buffer[i];
            state[state.which].push(c);
            switch (state.which) {
            case 'text':
                if (c===LT) { state.which='html'; }
                break;
            case 'html':
                if (c===SQ) { state.which='asingle'; }
                else if (c===DQ) { state.which='adouble'; }
                else if (c===GT) { state.which='text'; }
                break;
            case 'asingle':
                if (c===SQ) { state.which='html'; }
                break;
            case 'adouble':
                if (c===DQ) { state.which='html'; }
                break;
            }
        }
        // result is all four arrays concatenated together... but we
        // need to write out their lengths to be able to reverse this
        // transform. (write text last since it's likely to be the longest)
        var sizes = [];
        writeNumber(sizes, state.html.length);
        writeNumber(sizes, state.asingle.length);
        writeNumber(sizes, state.adouble.length);
        var result = sizes.concat(state.html, state.asingle,
                                  state.adouble, state.text);
        return new Buffer(result);
    };

    var read_and_split_articles = function(filename, cb) {
        var all_articles = fs.readFileSync(filename);
        var i=0;
        do {
            var start = i;
            while (all_articles[i] !== '\n'.charCodeAt(0)) {
                i++;
            }
            var title = all_articles.slice(start, i).toString('utf8');
            start = ++i;
            while (all_articles[i] !== '\n'.charCodeAt(0)) {
                i++;
            }
            var size = all_articles.slice(start, i).toString('utf8');
            start = ++i;
            i += parseInt(size, 10);
            //console.log(title, size, start, i);
            var article = all_articles.slice(start, i);
            if (program.html) {
                article = html_preprocess(article);
            }
            cb(title, article);
        } while (i < all_articles.length);
        // signal last chunk
        cb();
    };

    var makeChunky = function(chunkLimit, cb) {
        var chunks = [], size = 0;
        return function(title, article) {
            if (title) {
                chunks.push(article);
                size += article.length;
            }
            if (size >= chunkLimit || !title) {
                var b = new Buffer(size);
                var i = 0;
                chunks.forEach(function(cc) {
                    cc.copy(b, i);
                    i += cc.length;
                });
                if (b.length) cb(b);
                chunks.length = size = 0;
            }
        };
    };
    var squashsize = 0, numchunks = 0;
    var squashchunk = function(chunk) {
        var originalSize = chunk.length;
        var s = 0, nc;
        switch (program.compress) {
        default:
            console.error('Unknown compression type:', program.compress);
        case 'none':
            nc = chunk;
            break;
        case 'lzma':
            nc = lzmajs.compressFile(chunk, null,
                                     (+program.level) || undefined);
            nc = new Buffer(nc); // convert Uint8Array to Buffer
            break;
        case 'lzjb':
            nc = lzjb.compressFile(chunk, null, (+program.level) || undefined);
            nc = new Buffer(nc); // convert Uint8Array to Buffer
            break;
        }
        if (program.writeChunks) {
            var filename = '' + numchunks;
            while (filename.length < 4) { filename = '0' + filename; }
            filename = 'chunk-' + filename + '.data';
            if (program.directory) {
                filename = program.directory + '/' + filename;
            }
            fs.writeFileSync(filename, nc);
        }
        numchunks++; squashsize += nc.length;
        if (!program.silent) {
            console.log(numchunks, originalSize, nc.length,
                        Math.round(100*nc.length/originalSize)+'%',
                        squashsize);
        }
    };

    read_and_split_articles(program.file, makeChunky(CHUNK_SIZE, squashchunk));

    console.log('Chunk size', CHUNK_SIZE,
                '# chunks', numchunks,
                'total size', squashsize);
});
