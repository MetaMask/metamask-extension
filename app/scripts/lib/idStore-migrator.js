const IdentityStore = require('./idStore')
const HdKeyring = require('../keyrings/hd')
const sigUtil = require('./sig-util')
const normalize = sigUtil.normalize

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

    return new Promise((resolve, reject) => {
      this.idStore.submitPassword(password, (err) => {
        if (err) return reject(err)
        const serialized = this.serializeVault()
        this.checkForErrors(serialized)
        .then(resolve)
        .catch(reject)
      })
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

  checkForErrors (serialized) {
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
        lostAccounts,
      }
    })
  }

  hasOldVault () {
    const wallet = this.configManager.getWallet()
    return wallet
  }
}
