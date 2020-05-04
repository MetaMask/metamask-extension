import assert from 'assert'
import * as selectors from '../selectors'
import mockState from '../../../../test/data/mock-state.json'

describe('Selectors', function () {

  describe('#getSelectedAddress', function () {
    it('returns undefined if selectedAddress is undefined', function () {
      assert.equal(selectors.getSelectedAddress({ metamask: {} }), undefined)
    })

    it('returns selectedAddress', function () {
      const selectedAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
      assert.equal(selectors.getSelectedAddress({ metamask: { selectedAddress } }), selectedAddress)
    })

  })

  it('returns selected identity', function () {
    assert.deepEqual(
      selectors.getSelectedIdentity(mockState),
      {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        name: 'Test Account',
      }
    )
  })

  it('returns selected account', function () {
    const account = selectors.getSelectedAccount(mockState)
    assert.equal(account.balance, '0x0')
    assert.equal(account.address, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
  })

  describe('#getSelectedTokenExchangeRate', function () {
    it('returns token exchange rate for first token', function () {
      const tokenRate = selectors.getSelectedTokenExchangeRate(mockState)
      assert.equal(tokenRate, '0.00039345803819379796')
    })
  })

  describe('#getAddressBook', function () {
    it('should return the address book', function () {
      assert.deepEqual(
        selectors.getAddressBook(mockState),
        [
          {
            'address': '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
            'chainId': '4',
            'isEns': false,
            'memo': '',
            'name': 'Address Book Account 1',
          },
        ],
      )
    })
  })

  it('returns accounts with balance, address, and name from identity and accounts in state', function () {
    const accountsWithSendEther = selectors.accountsWithSendEtherInfoSelector(mockState)
    assert.equal(accountsWithSendEther.length, 2)
    assert.equal(accountsWithSendEther[0].balance, '0x0')
    assert.equal(accountsWithSendEther[0].address, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
    assert.equal(accountsWithSendEther[0].name, 'Test Account')
  })

  it('returns selected account with balance, address, and name from accountsWithSendEtherInfoSelector', function () {
    const currentAccountwithSendEther = selectors.getCurrentAccountWithSendEtherInfo(mockState)
    assert.equal(currentAccountwithSendEther.balance, '0x0')
    assert.equal(currentAccountwithSendEther.address, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
    assert.equal(currentAccountwithSendEther.name, 'Test Account')
  })

  it('#getGasIsLoading', function () {
    const gasIsLoading = selectors.getGasIsLoading(mockState)
    assert.equal(gasIsLoading, false)
  })

  it('#getCurrentCurrency', function () {
    const currentCurrency = selectors.getCurrentCurrency(mockState)
    assert.equal(currentCurrency, 'usd')
  })

  it('#getTotalUnapprovedCount', function () {
    const totalUnapprovedCount = selectors.getTotalUnapprovedCount(mockState)
    assert.equal(totalUnapprovedCount, 1)
  })
})
