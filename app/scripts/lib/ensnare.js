module.exports = ensnare

// creates a proxy object that calls cb everytime the obj's properties/fns are accessed
function ensnare (obj, cb) {
  var proxy = {}
  Object.keys(obj).forEach(function (key) {
    var val = obj[key]
    switch (typeof val) {
      case 'function':
        proxy[key] = function () {
          cb()
          val.apply(obj, arguments)
        }
        return
      default:
        Object.defineProperty(proxy, key, {
          get: function () { cb(); return obj[key] },
          set: function (val) { cb(); obj[key] = val; return val },
        })
        return
    }
  })
  return proxy
}
