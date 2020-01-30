(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
      (factory((global.blockies = {})));
}(this, (function (exports) { 'use strict';

  /**
   * A handy class to calculate color values.
   *
   * @version 1.0
   * @author Robert Eisele <robert@xarg.org>
   * @copyright Copyright (c) 2010, Robert Eisele
   * @link http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
   * @license http://www.opensource.org/licenses/bsd-license.php BSD License
   *
   */


// helper functions for that ctx
  function write(buffer, offs) {
    for (var i = 2; i < arguments.length; i++) {
      for (var j = 0; j < arguments[i].length; j++) {
        buffer[offs++] = arguments[i].charAt(j);
      }
    }
  }

  function byte2(w) {
    return String.fromCharCode((w >> 8) & 255, w & 255);
  }

  function byte4(w) {
    return String.fromCharCode((w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w & 255);
  }

  function byte2lsb(w) {
    return String.fromCharCode(w & 255, (w >> 8) & 255);
  }

  var PNG = function(width,height,depth) {

    this.width   = width;
    this.height  = height;
    this.depth   = depth;

    // pixel data and row filter identifier size
    this.pix_size = height * (width + 1);

    // deflate header, pix_size, block headers, adler32 checksum
    this.data_size = 2 + this.pix_size + 5 * Math.floor((0xfffe + this.pix_size) / 0xffff) + 4;

    // offsets and sizes of Png chunks
    this.ihdr_offs = 0;									// IHDR offset and size
    this.ihdr_size = 4 + 4 + 13 + 4;
    this.plte_offs = this.ihdr_offs + this.ihdr_size;	// PLTE offset and size
    this.plte_size = 4 + 4 + 3 * depth + 4;
    this.trns_offs = this.plte_offs + this.plte_size;	// tRNS offset and size
    this.trns_size = 4 + 4 + depth + 4;
    this.idat_offs = this.trns_offs + this.trns_size;	// IDAT offset and size
    this.idat_size = 4 + 4 + this.data_size + 4;
    this.iend_offs = this.idat_offs + this.idat_size;	// IEND offset and size
    this.iend_size = 4 + 4 + 4;
    this.buffer_size  = this.iend_offs + this.iend_size;	// total PNG size

    this.buffer  = new Array();
    this.palette = new Object();
    this.pindex  = 0;

    var _crc32 = new Array();

    // initialize buffer with zero bytes
    for (var i = 0; i < this.buffer_size; i++) {
      this.buffer[i] = "\x00";
    }

    // initialize non-zero elements
    write(this.buffer, this.ihdr_offs, byte4(this.ihdr_size - 12), 'IHDR', byte4(width), byte4(height), "\x08\x03");
    write(this.buffer, this.plte_offs, byte4(this.plte_size - 12), 'PLTE');
    write(this.buffer, this.trns_offs, byte4(this.trns_size - 12), 'tRNS');
    write(this.buffer, this.idat_offs, byte4(this.idat_size - 12), 'IDAT');
    write(this.buffer, this.iend_offs, byte4(this.iend_size - 12), 'IEND');

    // initialize deflate header
    var header = ((8 + (7 << 4)) << 8) | (3 << 6);
    header+= 31 - (header % 31);

    write(this.buffer, this.idat_offs + 8, byte2(header));

    // initialize deflate block headers
    for (var i = 0; (i << 16) - 1 < this.pix_size; i++) {
      var size, bits;
      if (i + 0xffff < this.pix_size) {
        size = 0xffff;
        bits = "\x00";
      } else {
        size = this.pix_size - (i << 16) - i;
        bits = "\x01";
      }
      write(this.buffer, this.idat_offs + 8 + 2 + (i << 16) + (i << 2), bits, byte2lsb(size), byte2lsb(~size));
    }

    /* Create crc32 lookup table */
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var j = 0; j < 8; j++) {
        if (c & 1) {
          c = -306674912 ^ ((c >> 1) & 0x7fffffff);
        } else {
          c = (c >> 1) & 0x7fffffff;
        }
      }
      _crc32[i] = c;
    }

    // compute the index into a png for a given pixel
    this.index = function(x,y) {
      var i = y * (this.width + 1) + x + 1;
      var j = this.idat_offs + 8 + 2 + 5 * Math.floor((i / 0xffff) + 1) + i;
      return j;
    };

    // convert a color and build up the palette
    this.color = function(red, green, blue, alpha) {

      alpha = alpha >= 0 ? alpha : 255;
      var color = (((((alpha << 8) | red) << 8) | green) << 8) | blue;

      if (typeof this.palette[color] == "undefined") {
        if (this.pindex == this.depth) return "\x00";

        var ndx = this.plte_offs + 8 + 3 * this.pindex;

        this.buffer[ndx + 0] = String.fromCharCode(red);
        this.buffer[ndx + 1] = String.fromCharCode(green);
        this.buffer[ndx + 2] = String.fromCharCode(blue);
        this.buffer[this.trns_offs+8+this.pindex] = String.fromCharCode(alpha);

        this.palette[color] = String.fromCharCode(this.pindex++);
      }
      return this.palette[color];
    };

    // output a PNG string, Base64 encoded
    this.getBase64 = function() {

      var s = this.getDump();

      var ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      var c1, c2, c3, e1, e2, e3, e4;
      var l = s.length;
      var i = 0;
      var r = "";

      do {
        c1 = s.charCodeAt(i);
        e1 = c1 >> 2;
        c2 = s.charCodeAt(i+1);
        e2 = ((c1 & 3) << 4) | (c2 >> 4);
        c3 = s.charCodeAt(i+2);
        if (l < i+2) { e3 = 64; } else { e3 = ((c2 & 0xf) << 2) | (c3 >> 6); }
        if (l < i+3) { e4 = 64; } else { e4 = c3 & 0x3f; }
        r+= ch.charAt(e1) + ch.charAt(e2) + ch.charAt(e3) + ch.charAt(e4);
      } while ((i+= 3) < l);
      return r;
    };

    // output a PNG string
    this.getDump = function() {

      // compute adler32 of output pixels + row filter bytes
      var BASE = 65521; /* largest prime smaller than 65536 */
      var NMAX = 5552;  /* NMAX is the largest n such that 255n(n+1)/2 + (n+1)(BASE-1) <= 2^32-1 */
      var s1 = 1;
      var s2 = 0;
      var n = NMAX;

      for (var y = 0; y < this.height; y++) {
        for (var x = -1; x < this.width; x++) {
          s1+= this.buffer[this.index(x, y)].charCodeAt(0);
          s2+= s1;
          if ((n-= 1) == 0) {
            s1%= BASE;
            s2%= BASE;
            n = NMAX;
          }
        }
      }
      s1%= BASE;
      s2%= BASE;
      write(this.buffer, this.idat_offs + this.idat_size - 8, byte4((s2 << 16) | s1));

      // compute crc32 of the PNG chunks
      function crc32(png, offs, size) {
        var crc = -1;
        for (var i = 4; i < size-4; i += 1) {
          crc = _crc32[(crc ^ png[offs+i].charCodeAt(0)) & 0xff] ^ ((crc >> 8) & 0x00ffffff);
        }
        write(png, offs+size-4, byte4(crc ^ -1));
      }

      crc32(this.buffer, this.ihdr_offs, this.ihdr_size);
      crc32(this.buffer, this.plte_offs, this.plte_size);
      crc32(this.buffer, this.trns_offs, this.trns_size);
      crc32(this.buffer, this.idat_offs, this.idat_size);
      crc32(this.buffer, this.iend_offs, this.iend_size);

      // convert PNG to string
      return "\x89PNG\r\n\x1A\n"+this.buffer.join('');
    };

    this.fillRect = function (x, y, w, h, color) {
      for(var i = 0; i < w; i++) {
        for (var j = 0; j < h; j++) {
          this.buffer[this.index(x+i, y+j)] = color;
        }
      }
    };
  };

// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
  /**
   * Converts an HSL color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   {number}  h       The hue
   * @param   {number}  s       The saturation
   * @param   {number}  l       The lightness
   * @return  {Array}           The RGB representation
   */

  function hue2rgb(p, q, t) {
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  function hsl2rgb(h, s, l){
    var r, g, b;

    if(s == 0){
      r = g = b = l; // achromatic
    }else{
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
  }

// The random number is a js implementation of the Xorshift PRNG
  var randseed = new Array(4); // Xorshift: [x, y, z, w] 32 bit values

  function seedrand(seed) {
    for (var i = 0; i < randseed.length; i++) {
      randseed[i] = 0;
    }
    for (var i = 0; i < seed.length; i++) {
      randseed[i % 4] = (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i);
    }
  }

  function rand() {
    // based on Java's String.hashCode(), expanded to 4 32bit values
    var t = randseed[0] ^ (randseed[0] << 11);

    randseed[0] = randseed[1];
    randseed[1] = randseed[2];
    randseed[2] = randseed[3];
    randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8);

    return (randseed[3] >>> 0) / (1 << 31 >>> 0);
  }

  function createColor() {
    //saturation is the whole color spectrum
    var h = Math.floor(rand() * 360);
    //saturation goes from 40 to 100, it avoids greyish colors
    var s = rand() * 60 + 40;
    //lightness can be anything from 0 to 100, but probabilities are a bell curve around 50%
    var l = (rand() + rand() + rand() + rand()) * 25;

    return [h / 360,s / 100,l / 100];
  }

  function createImageData(size) {
    var width = size; // Only support square icons for now
    var height = size;

    var dataWidth = Math.ceil(width / 2);
    var mirrorWidth = width - dataWidth;

    var data = [];
    for (var y = 0; y < height; y++) {
      var row = [];
      for (var x = 0; x < dataWidth; x++) {
        // this makes foreground and background color to have a 43% (1/2.3) probability
        // spot color has 13% chance
        row[x] = Math.floor(rand() * 2.3);
      }
      var r = row.slice(0, mirrorWidth);
      r.reverse();
      row = row.concat(r);

      for (var i = 0; i < row.length; i++) {
        data.push(row[i]);
      }
    }

    return data;
  }

  function buildOpts(opts) {
    if (!opts.seed) {
      throw 'No seed provided'
    }

    seedrand(opts.seed);

    return Object.assign({
      size: 8,
      scale: 16,
      color: createColor(),
      bgcolor: createColor(),
      spotcolor: createColor(),
    }, opts)
  }

  function toDataUrl(address) {
    const opts = buildOpts({seed: address.toLowerCase()});

    const imageData = createImageData(opts.size);
    const width = Math.sqrt(imageData.length);

    const p = new PNG(opts.size*opts.scale, opts.size*opts.scale, 3);
    const bgcolor = p.color(...hsl2rgb(...opts.bgcolor));
    const color = p.color(...hsl2rgb(...opts.color));
    const spotcolor = p.color(...hsl2rgb(...opts.spotcolor));

    for (var i = 0; i < imageData.length; i++) {
      var row = Math.floor(i / width);
      var col = i % width;
      // if data is 0, leave the background
      if (imageData[i]) {
        // if data is 2, choose spot color, if 1 choose foreground
        const pngColor = imageData[i] == 1 ? color : spotcolor;
        p.fillRect(col * opts.scale, row * opts.scale, opts.scale, opts.scale, pngColor);
      }
    }
    return `data:image/png;base64,${p.getBase64()}`;
  }

  exports.toDataUrl = toDataUrl;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
