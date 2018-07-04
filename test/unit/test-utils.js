const assert = require('assert')

module.exports = {
  assertRejects,
}

// assert.rejects added in node v10
async function assertRejects (asyncFn, regExp) {
  let f = () => {}
  try {
    await asyncFn()
  } catch (error) {
    f = () => { throw error }
  } finally {
    assert.throws(f, regExp)
  }
}
