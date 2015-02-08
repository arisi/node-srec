// Generated by CoffeeScript 1.4.0
(function() {
  var cache, fs, parseSrec, request;

  fs = require('fs');

  request = require('request');

  module.exports.parseSrec = parseSrec = function(data) {
    var addr, alen, b, boot, byte, dp, i, info, len, max, mem, min, s, srecs, type, _i, _j, _k, _len, _len1, _ref;
    mem = {};
    info = "";
    min = max = boot = null;
    srecs = data.split("\n");
    for (_i = 0, _len = srecs.length; _i < _len; _i++) {
      s = srecs[_i];
      if (s[0] === "S") {
        switch (type = parseInt(s[1])) {
          case 0:
          case 1:
          case 9:
          case 5:
            alen = 2;
            break;
          case 2:
          case 6:
          case 8:
            alen = 3;
            break;
          case 3:
          case 7:
            alen = 4;
            break;
          default:
            continue;
        }
        addr = parseInt(s.slice(4, 4 + alen * 2), 16);
        dp = 4 + alen * 2;
        b = [];
        len = parseInt(s.slice(2, 4), 16);
        for (i = _j = _ref = alen + 2; _ref <= len ? _j <= len : _j >= len; i = _ref <= len ? ++_j : --_j) {
          b.push(parseInt(s.slice(i * 2, +(i * 2 + 1) + 1 || 9e9), 16));
        }
        switch (type) {
          case 1:
          case 2:
          case 3:
            mem[addr] = b;
            if (!min || addr < min) {
              min = addr;
            }
            if (!max || addr + b.length > max) {
              max = addr;
            }
            break;
          case 7:
          case 8:
          case 9:
            boot = addr;
            break;
          case 0:
            for (_k = 0, _len1 = b.length; _k < _len1; _k++) {
              byte = b[_k];
              info += String.fromCharCode(byte);
            }
        }
      }
    }
    return {
      recs: mem,
      min: min,
      max: max,
      boot: boot,
      info: info
    };
  };

  cache = {};

  module.exports.readSrecFile = function(fn, cb) {
    if (cache[fn]) {
      console.log("node-srec: from Cache File: '" + fn + "'");
      return cb(cache[fn]);
    } else {
      console.log("node-srec: Reading File: '" + fn + "'");
      return fs.readFile(fn, 'utf8', function(error, data) {
        cache[fn] = parseSrec(data);
        return cb(cache[fn]);
      });
    }
  };

  module.exports.readSrecUrl = function(url, cb) {
    if (false && cache[url]) {
      console.log("node-srec: from Cache Url: '" + url + "'");
      return cb(cache[url]);
    } else {
      console.log("node-srec: Getting Url: '" + url + "'");
      return request.get(url, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          console.log("got " + url + " " + response);
          cache[url] = parseSrec(body);
          return cb(cache[url]);
        } else {
          console.log("Error: cannot get " + url + "?? " + response);
          return cb("", "Error: cannot get " + url + " http-status:" + response.statusCode);
        }
      });
    }
  };

  module.exports.blockify = function(data, min, max, size) {
    var a, as, b, blk, blks, donee, i, len, oset, _i, _ref;
    blks = {};
    console.log("node-srec: Blockify", min.toString(16), max.toString(16), size);
    donee = false;
    _ref = data.recs;
    for (as in _ref) {
      b = _ref[as];
      a = parseInt(as);
      len = b.length;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        if (a + i > max || a + i < min) {
          if (!donee) {
            console.log("Error -- out of range: " + ((a + i).toString(16)) + " [" + (min.toString(16)) + ".." + (max.toString(16)) + "]");
            donee = true;
          }
          continue;
        }
        blk = Math.floor((a + i - min) / size);
        oset = (a + i - min) % size;
        if (!blks[blk]) {
          blks[blk] = Array.apply(null, new Array(size)).map(Number.prototype.valueOf, 0);
        }
        if (b[i] === void 0) {
          console.log("????? ", i, len);
        }
        blks[blk][oset] = b[i];
      }
    }
    return blks;
  };

}).call(this);
