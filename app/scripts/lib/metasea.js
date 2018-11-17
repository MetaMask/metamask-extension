module.exports = seajack;
var GUN = require('gun/gun.min.js');
var SEA = require('gun/sea.js');

function seajack(req, res, next, end) {
  var method = (req.method||'').split('.');
  if('SEA' !== method[0] || !SEA[method[1]]){
    next();
    return;
  }
  var tmp = req.put || req.get;
  var u, cb = function(ack){
    res.result = true;
    if(u === ack){
      res.error = res.err = SEA.err || "SEA Error";
    }
    res.ack = ack;
    end();
  }
  if(req.put){ 
    SEA[method[1]](tmp.data, tmp.pair, cb, tmp.opt);
  } else
  if(req.get){
    SEA[method[1]](cb, tmp.opt);
  }
}

// experiment
;(function(){
  var scope = {};
  // SEA's official API is callback, with optional Promise support.
  // BOTH OF THESE ARE EXPERIMENTAL, NOT OFFICIAL API COMPATIBLE YET!
  SEA.I = function(cb, opt){
    return new Promise(async function(res, rej){
      opt = opt || {};
      cb = cb || function(){};
      var yes = confirm("dApp wants to act on your behalf. OK? "+(opt.how||'')+' '+(opt.why||''));
      if(!yes){
        rej(SEA.err = "User says no."); // TODO: FIX THIS!
        return;
      }
      var tmp = scope.pair = scope.pair || await gen();
      cb(tmp); res(tmp);
    });
  }
  SEA.name = function(cb, opt){
    return new Promise(async function(res, rej){
      opt = opt || {};
      cb = cb || function(){};
      var yes = confirm("dApp wants to know your name. OK? "+(opt.how||'')+' '+(opt.why||''));
      if(!yes){
        SEA.err = "User says no.";
        cb();
        return;
      }
      var tmp = '~'+(scope.pair = scope.pair || await gen()).pub; // ~ is SEA pubkey namespace.
      cb(tmp); res(tmp);
    });
  }
  async function gen(){
    var json = prompt("Import existing pair? (as JSON)");
    return scope.pair = json? JSON.parse(json) : await SEA.pair();
  }
}());