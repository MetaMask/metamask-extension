import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

import {
  REQUIRED_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
} from '../../../send.constants'

const stubs = {
  isValidAddress: sinon.stub().callsFake(to => Boolean(to.match(/^[0xabcdef123456798]+$/))),
}

const toRowUtils = proxyquire('../send-to-row.utils.js', {
  '../../../../util': {
    isValidAddress: stubs.isValidAddress,
  },
})
const {
  getToErrorObject,
} = toRowUtils

describe('send-to-row utils', () => {

  describe('getToErrorObject()', () => {
    it('should return a required error if to is falsy', () => {
      assert.deepEqual(getToErrorObject(null), {
        to: REQUIRED_ERROR,
      })
    })

    it('should return an invalid recipient error if to is truthy but invalid', () => {
      assert.deepEqual(getToErrorObject('mockInvalidTo'), {
        to: INVALID_RECIPIENT_ADDRESS_ERROR,
      })
    })

    it('should return null if to is truthy and valid', () => {
      assert.deepEqual(getToErrorObject('0xabc123'), {
        to: null,
      })
    })

    it('should return the passed error if to is truthy but invalid if to is truthy and valid', () => {
      assert.deepEqual(getToErrorObject('invalid #$ 345878', 'someExplicitError'), {
        to: 'someExplicitError',
      })
    })
  })

})
