import { strict as assert } from 'assert'

import getRestrictedMethods
  from '../../../../../app/scripts/controllers/permissions/restrictedMethods'

describe('restricted methods', function () {

  // this method is tested extensively in other permissions tests
  describe('eth_accounts', function () {

    it('handles failure', async function () {
      const restrictedMethods = getRestrictedMethods({
        getKeyringAccounts: async () => {
          throw new Error('foo')
        },
      })

      const res = {}
      restrictedMethods.eth_accounts.method(null, res, null, (err) => {

        const fooError = new Error('foo')

        assert.deepEqual(
          err, fooError,
          'should end with expected error'
        )

        assert.deepEqual(
          res, { error: fooError },
          'response should have expected error and no result'
        )
      })
    })
  })
})
