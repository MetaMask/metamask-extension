const assert = require('assert')
const extend = require('xtend')
const AddressBookController = require('../../app/scripts/controllers/address-book')

describe('address-book-controller', function() {
  var addressBookController

  beforeEach(function() {
    addressBookController = new AddressBookController()
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
    })
  })
})
