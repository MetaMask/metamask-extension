const assert = require('assert')
const AddressBookController = require('../../../../app/scripts/controllers/address-book')

const stubPreferencesStore = {
  getState: function () {
    return {
      identities: {
        '0x0aaa': {
          address: '0x0aaa',
          name: 'owned',
        },
      },
    }
  },
}

describe('address-book-controller', function () {
  var addressBookController

  beforeEach(function () {
    addressBookController = new AddressBookController({
      preferencesStore: stubPreferencesStore,
    })
  })

  describe('addres book management', function () {
    describe('#_getAddressBook', function () {
      it('should be empty by default.', function () {
        assert.equal(addressBookController._getAddressBook().length, 0)
      })
    })
    describe('#setAddressBook', function () {
      it('should properly set a new address.', function () {
        addressBookController.setAddressBook('0x01234', 'test')
        var addressBook = addressBookController._getAddressBook()
        assert.equal(addressBook.length, 1, 'incorrect address book length.')
        assert.equal(addressBook[0].address, '0x01234', 'incorrect addresss')
        assert.equal(addressBook[0].name, 'test', 'incorrect nickname')
      })

      it('should reject duplicates.', function () {
        addressBookController.setAddressBook('0x01234', 'test')
        addressBookController.setAddressBook('0x01234', 'test')
        var addressBook = addressBookController._getAddressBook()
        assert.equal(addressBook.length, 1, 'incorrect address book length.')
      })
      it('should not add any identities that are under user control', function () {
        addressBookController.setAddressBook('0x0aaa', ' ')
        var addressBook = addressBookController._getAddressBook()
        assert.equal(addressBook.length, 0, 'incorrect address book length.')
      })
    })
  })
})
