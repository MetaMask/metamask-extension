import { AddressBookController } from 'gaba'
import { hexToBase32 } from './cip37'

export class AddressBookControllerWithBase32Address extends AddressBookController {
  constructor(config, state) {
    super(config, state)
    const book = this.state.addressBook
    const newBook = {}
    Object.keys(book).forEach(chainId => {
      const bookEachChain = book[chainId]
      if (!newBook[chainId]) {
 newBook[chainId] = {}
}
      Object.keys(bookEachChain).forEach(addr => {
        const bookEachAddress = bookEachChain[addr]
        let newone
        if (
          bookEachAddress &&
          bookEachAddress.address &&
          !bookEachAddress.base32Address
        ) {
          let base32Address = ''
          try {
            base32Address = hexToBase32(addr, parseInt(chainId, 10))
          } catch (err) {}

          newone = { ...bookEachAddress, base32Address }
        } else {
          newone = { ...bookEachAddress }
        }
        newBook[chainId][addr] = newone
      })
    })

    this.update({ addressBook: newBook })
  }

  set(address, name, chainId = '1', memo = '') {
    AddressBookController.prototype.set.call(this, address, name, chainId, memo)
    const currentOne = this.state.addressBook[chainId][address]
    let base32Address = ''
    try {
      base32Address = hexToBase32(address, parseInt(chainId, 10))
    } catch (err) {}

    this.update({
      addressBook: Object.assign({}, this.state.addressBook, {
        [chainId]: Object.assign({}, this.state.addressBook[chainId], {
          [address]: { ...currentOne, base32Address },
        }),
      }),
    })
  }
}
