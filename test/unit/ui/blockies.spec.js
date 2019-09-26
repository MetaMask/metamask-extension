const assert = require('assert')
const { toDataUrl } = require('../../../ui/lib/blockies')

describe('#toDataUrl', () => {
  it('', () => {
    // Looking for (data:image/png;base64,)
    const regex = new RegExp(/\w+:\w+\/\w+;\w+,/)
    assert(toDataUrl('test'))
    assert(regex.test(toDataUrl('test')))
  })
})
