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
    console.log('migrating vault for password')
    const hasOldVault = this.hasOldVault()
    const configManager = this.configManager

    if (!this.idStore) {
      console.log('initializing id store')
      this.idStore = new IdentityStore({ configManager })
      console.log('initialized')
    }

    if (!hasOldVault) {
      console.log('no old vault recognized')
      return Promise.resolve(null)
    }

    console.log('returning new promise')
    return new Promise((resolve, reject) => {
      console.log('submitting password to idStore')
      this.idStore.submitPassword(password, (err) => {
        console.log('returned ' + err)
        if (err) return reject(err)
        console.log('serializing vault')
        const serialized = this.serializeVault()
        console.log('migrated and serialized into')
        console.dir(serialized)
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
    console.log('checking for errors, first making hd wallet')
    const hd = new HdKeyring()
    return hd.deserialize(serialized)
    .then(() => {
      console.log('deserialized, now getting accounts')
      console.dir(arguments)
      return hd.getAccounts()
    })
    .then((hexAccounts) => {
      console.log('hd returned accounts', hexAccounts)
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

      console.log('migrator has')
      console.dir({ newAccounts, oldAccounts, lostAccounts, hexAccounts })

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
