const assert = require('assert')
const nodeify = require('../../app/scripts/lib/nodeify')

describe('nodeify', function () {
  var obj = {
    foo: 'bar',
    promiseFunc: function (a) {
      var solution = this.foo + a
      return Promise.resolve(solution)
    },
  }

  it('should retain original context', function (done) {
    var nodified = nodeify(obj.promiseFunc, obj)
    nodified('baz', function (err, res) {
      assert.equal(res, 'barbaz')
      done()
    })
  })

  it('should throw if the last argument is not a function', function (done) {
    var nodified = nodeify(obj.promiseFunc, obj)
    try {
      nodified('baz')
      done(new Error('should have thrown if the last argument is not a function'))
    } catch (err) {
      if (err.message === 'callback is not a function') done()
      else done(err)
    }
  })
})
