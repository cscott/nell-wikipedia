#!/usr/bin/env node
// Test the size of compressed parsoid HTML
// Results:
// chunk size: compressed size:
//               lzma      lzma      gzip      bzip2     lzjb      lzop      zip
//              no param    -9        -9         -9                 -9       -9
//  infinity    15426238  14675333  26182154  17593259  53738192  31271534  26438118
//  128M        15455233  14769416  26184338  17598086  53738246  31279698  26437023
//  64M         15506011  14910867  26184657  17598560  53738367  31244642  26439352
//  32M         15557631  15169918  26185219  17610864  53738536  31265284  26441124
//  16M         15692528  15527769  26185212  17631221  53738819  31240932  26442573
//  8M          15967732  15901082  26188891  17654735  53739487  31244933  26448267
//  4M          16400537  16346748  26191746  17633309  53740503  31272016  26456007
//  2M          16953821  16916865  26201557  17840893  53743146  31283844  26472706
//  1M          17596643  17572602  26223246  18060254  53747578  31309521  26506212
//  512k        18347722  18337886  26262753  18232726  53754838  31339368  26574403
//  256k        19232445  19239923  26318554  19359853  53769223  31387257  26681484
//  128k        20151072  20174159  26427046  20574607  53789789  31346648  26861464
//  64k         20947563  20978675  26577423  21706596  53819259  31727129  27106999
//  32k         21605776  21630416  26798414  22676576  53852798  32333387  27431212
//  16k         22021787  22041994  27088978  23292376  53880889  32830968  27808544
//  8k          22161326  22180570  27204324  23479141  53891621  32994667  27956215
//  4k          22197510  22216601  27234325  23523785  53895232  33036109  27996098
//  0           22213842  22233151  27256283  23548696  53899116  33068669  28101119
//uncompressed 207758353


var requirejs = require('requirejs'), pjson = require('../../package.json');
requirejs(['commander', 'fs', 'lzma-purejs'], function(program, fs, lzmajs) {
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
                'Use lzma/lzjs/no compression', 'none')
        .option('-l, --level <num>',
                'Compression level', null/*default*/)
        .option('-w, --write-chunks',
                'Emit each compressed chunk', false)
        .option('-d, --directory <directory name>',
                'Directory to write compressed chunks to', null)
        .option('-s, --silent',
                "Don't emit progress messages")
        .parse(process.argv);

    if (program.args.length > 0) {
        CHUNK_SIZE = parseInt(program.args[0], 10);
    }
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
            var article = all_articles.slice(start, i).toString('utf8');
            cb(title, article);
        } while (i < all_articles.length);
        // signal last chunk
        cb();
    };

    var makeChunky = function(chunkLimit, cb) {
        var chunks = [], size = 0;
        return function(title, article) {
            if (title) {
                var c = new Buffer(article, 'utf8');
                chunks.push(c);
                size += c.length;
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
