const IdentityStore = require('./idStore')
const HdKeyring = require('eth-hd-keyring')
const sigUtil = require('eth-sig-util')
const normalize = sigUtil.normalize
const denodeify = require('denodeify')

module.exports = class IdentityStoreMigrator {

  constructor ({ configManager }) {
    this.configManager = configManager
    const hasOldVault = this.hasOldVault()
    if (!hasOldVault) {
      this.idStore = new IdentityStore({ configManager })
    }
  }

  migratedVaultForPassword (password) {
    const hasOldVault = this.hasOldVault()
    const configManager = this.configManager

    if (!this.idStore) {
      this.idStore = new IdentityStore({ configManager })
    }

    if (!hasOldVault) {
      return Promise.resolve(null)
    }

    const idStore = this.idStore
    const submitPassword = denodeify(idStore.submitPassword.bind(idStore))

    return submitPassword(password)
    .then(() => {
      const serialized = this.serializeVault()
      return this.checkForLostAccounts(serialized)
    })
  }

  serializeVault () {
    const mnemonic = this.idStore._idmgmt.getSeed()
    const numberOfAccounts = this.idStore._getAddresses().length

    return {
      type: 'HD Key Tree',
      data: { mnemonic, numberOfAccounts },
    }
  }

  checkForLostAccounts (serialized) {
    const hd = new HdKeyring()
    return hd.deserialize(serialized.data)
    .then((hexAccounts) => {
      const newAccounts = hexAccounts.map(normalize)
      const oldAccounts = this.idStore._getAddresses().map(normalize)
      const lostAccounts = oldAccounts.reduce((result, account) => {
        if (newAccounts.includes(account)) {
          return result
        } else {
          result.push(account)
          return result
        }
      }, [])

      return {
        serialized,
        lostAccounts: lostAccounts.map((address) => {
          return {
            address,
            privateKey: this.idStore.exportAccount(address),
          }
        }),
      }
    })
  }

  hasOldVault () {
    const wallet = this.configManager.getWallet()
    return wallet
  }
}
