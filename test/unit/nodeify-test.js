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
    var nodified = nodeify(obj.promiseFunc).bind(obj)
    nodified('baz', function (err, res) {
      assert.equal(res, 'barbaz')
      done()
    })
  })
})
