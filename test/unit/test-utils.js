import assert from 'assert'

// assert.rejects added in node v10
export async function assertRejects (asyncFn, regExp) {
  let f = () => {}
  try {
    await asyncFn()
  } catch (error) {
    f = () => {
      throw error
    }
  } finally {
    assert.throws(f, regExp)
  }
}
