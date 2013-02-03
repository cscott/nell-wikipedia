# seek-bzip

`seek-bzip` is a pure-javascript Node.JS module adapted from 'node-bzip' and before that antimatter15's pure-javascript implementation for decoding bzip2 data.  `seek-bzip` currently only decodes buffers into other buffers, synchronously.  Unlike `node-bzip`, `seek-bzip` can seek to and decode single blocks from the bzip2 file.

## How to Install

```
npm install seek-bzip
```

## Usage

After compressing some example data into `example.bz2`, the following with recreate that original data and save it to `example`.

```
var Bunzip = require('seek-bzip');
var fs = require('fs');

var compressedData = fs.readFileSync('example.bz2');
var data = Bunzip.decode(compressedData);

fs.writeFileSync('example', data);
```

See the tests in the `tests/` directory for further usage examples.

For uncompressing single blocks of bzip2-compressed data, you will need
an out-of-band index listing the start of each bzip2 block.  (Presumably
you generate this at the same time as you index the start of the information
you wish to seek to inside the compressed file.)  The `seek-bzip` module
has been designed to be compatible with the C implementation `seek-bzip2`
available from https://bitbucket.org/james_taylor/seek-bzip2.  That codebase
contains a `bzip-table` tool which will generate bzip2 block start indices.

## Documentation

`require('seek-bzip')` returns a `Bunzip` object.  It contains two static
methods.  The first is a function accepting one or two parameters:

`Bunzip.decode = function(Buffer inputBuffer, [Number expectedSize])`

If `expectedSize` is not present, `decodeBzip` simply decodes `inputBuffer` and returns the resulting `Buffer`.

If `expectedSize` is present, `decodeBzip` will store the results in a `Buffer` of length `expectedSize`, and throw an error in the case that the size of the decoded data does not match `expectedSize`.

The second is a function accepting two or three parameters:

`Bunzip.decodeBlock = function(Buffer inputBuffer, Number blockStartBits, [Number expectedSize])`

The `inputBuffer` and `expectedSize` parameters are as above.
The `blockStartBits` parameter gives the start of the desired block, in bits.

## Help wanted

The following improvements to this module would be generally useful.
Feel free to fork on github and submit pull requests!

* Streaming interface.  The original `micro-bunzip2` and `seek-bzip2` codebases
contained a slightly more complicated input/output system which allowed
streaming chunks of input and output data.  It wouldn't be hard to retrofit
that to this code base.

* Port the `bzip-table` tool from the `seek-bzip2` codebase, so that index
generation is self-contained.  Again, not very hard!

* Add command-line binaries to the node module for `bzip-table` and
`seek-bunzip`.

* Add compression along with decompression.  See `micro-bzip` at
http://www.landley.net/code/

## License

#### LGPL 2.1 License

> Copyright &copy; 2013 C. Scott Ananian
>
> Copyright &copy; 2012 Eli Skeggs
>
> Copyright &copy; 2011 Kevin Kwok
>
> This library is free software; you can redistribute it and/or
> modify it under the terms of the GNU Lesser General Public
> License as published by the Free Software Foundation; either
> version 2.1 of the License, or (at your option) any later version.
>
> This library is distributed in the hope that it will be useful,
> but WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
> Lesser General Public License for more details.
>
> You should have received a copy of the GNU Lesser General Public
> License along with this library; if not, see
> http://www.gnu.org/licenses/lgpl-2.1.html
