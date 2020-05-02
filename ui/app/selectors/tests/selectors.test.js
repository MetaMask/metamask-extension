import assert from 'assert'
import { getAddressBook } from '../selectors'
import mockState from './selectors-test-data'

describe('selectors', function () {

  describe('getAddressBook()', function () {
    it('should return the address book', function () {
      assert.deepEqual(
        getAddressBook(mockState),
        [
          {
            'address': '0x06195827297c7a80a443b6894d3bdb8824b43896',
            'chainId': '3',
            'isEns': false,
            'memo': '',
            'name': 'Address Book Account 1',
          },
        ],
      )
    })
  })
})
