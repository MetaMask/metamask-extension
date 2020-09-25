import assert from 'assert'
import proxyquire from 'proxyquire'
import { toChecksumAddress } from 'cfx-util'

import {
  REQUIRED_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  INVALID_RECIPIENT_0X_ERROR,
  INVALID_RECIPIENT_CHECKSUM_ERROR,
  INVALID_RECIPIENT_CONTRACT_ERROR,
  KNOWN_RECIPIENT_ADDRESS_ERROR,
} from '../../../send.constants'

const stubs = {
  isSmartContractAddress: (to) => {
    if (to === '0x8888888888888888888888888888888888888881') {
      return true
    }
    return false
  },
}

const toRowUtils = proxyquire('../add-recipient.js', {
  '../../../../helpers/utils/transactions.util': {
    isSmartContractAddress: stubs.isSmartContractAddress,
  },
})
const { getToErrorObject, getToWarningObject } = toRowUtils

describe('add-recipient utils', function () {
  describe('getToErrorObject()', function () {
    it('should return a required error if to is falsy', async function () {
      assert.deepEqual(await getToErrorObject(null), {
        to: REQUIRED_ERROR,
      })
    })

    it('should return null if to is falsy and hexData is truthy', async function () {
      assert.deepEqual(await getToErrorObject(null, undefined, true), {
        to: null,
      })
    })

    it('should return an invalid recipient error if to is truthy but invalid', async function () {
      assert.deepEqual(await getToErrorObject('mockInvalidTo'), {
        to: INVALID_RECIPIENT_ADDRESS_ERROR,
      })
      assert.deepEqual(await getToErrorObject('0x111111111111'), {
        to: INVALID_RECIPIENT_ADDRESS_ERROR,
      })
    })

    it('should return null if to is valid', async function () {
      assert.deepEqual(
        await getToErrorObject('0x1111111111111111111111111111111111111111'),
        {
          to: null,
        }
      )
    })

    it('should smart contract error if to is not a smart contract', async function () {
      assert.deepEqual(
        await getToErrorObject('0x8888888888888888888888888888888888888888'),
        {
          to: INVALID_RECIPIENT_CONTRACT_ERROR,
        }
      )
    })

    it('should no error if to is a smart contract', async function () {
      assert.deepEqual(
        await getToErrorObject('0x8888888888888888888888888888888888888881'),
        {
          to: null,
        }
      )
    })

    it('should return 0x error', async function () {
      assert.deepEqual(
        await getToErrorObject('0x2222222222222222222222222222222222222222'),
        {
          to: INVALID_RECIPIENT_0X_ERROR,
        }
      )
    })

    it('should return checksum error if to checksum invalid', async function () {
      assert.deepEqual(
        await getToErrorObject('0x1Fa2889e80619495738B0262C6B17471F29d9Dc1'),
        {
          to: INVALID_RECIPIENT_CHECKSUM_ERROR,
        }
      )
    })

    it('should return no error if to a valid checksumed address', async function () {
      assert.deepEqual(
        await getToErrorObject('0x1Fa2889e80619495738B0262C6B17471F29d9Dc5'),
        {
          to: null,
        }
      )
    })

    it('should return the passed error if to is truthy but invalid if to is truthy and valid', async function () {
      assert.deepEqual(
        await getToErrorObject('invalid #$ 345878', 'someExplicitError'),
        {
          to: 'someExplicitError',
        }
      )
    })
  })

  describe('getToWarningObject()', function () {
    it('should return a known address recipient if to is truthy but part of state tokens', function () {
      assert.deepEqual(
        getToWarningObject(
          '0x8888888888888888888888888888888888888888',
          undefined,
          [{ address: '0x8888888888888888888888888888888888888888' }],
          {
            address: '0x8888888888888888888888888888888888888888',
          }
        ),
        {
          to: KNOWN_RECIPIENT_ADDRESS_ERROR,
        }
      )
    })

    it('should null if to is truthy part of tokens but selectedToken falsy', function () {
      assert.deepEqual(
        getToWarningObject(
          '0x8888888888888888888888888888888888888888',
          undefined,
          [{ address: '0x8888888888888888888888888888888888888888' }]
        ),
        {
          to: null,
        }
      )
    })

    it('should return a known address recipient if to is truthy but part of contract metadata', function () {
      assert.deepEqual(
        getToWarningObject(
          '0x8888888888888888888888888888888888888888',
          undefined,
          [{ address: '0x8888888888888888888888888888888888888888' }],
          { address: '0x8888888888888888888888888888888888888888' },
          {
            [toChecksumAddress(
              '0x8888888888888888888888888888888888888888'
            )]: true,
          }
        ),
        {
          to: KNOWN_RECIPIENT_ADDRESS_ERROR,
        }
      )
    })

    it('should null if to is truthy part of contract metadata but selectedToken falsy', function () {
      assert.deepEqual(
        getToWarningObject(
          '0x8888888888888888888888888888888888888888',
          undefined,
          [{ address: '0x8888888888888888888888888888888888888888' }],
          { address: '0x8888888888888888888888888888888888888888' },
          {
            [toChecksumAddress(
              '0x8888888888888888888888888888888888888888'
            )]: true,
          }
        ),
        {
          to: KNOWN_RECIPIENT_ADDRESS_ERROR,
        }
      )
    })
  })
})
