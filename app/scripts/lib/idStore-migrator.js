const IdentityStore = require('./idStore')


module.exports = class IdentityStoreMigrator {

  constructor ({ configManager }) {
    this.configManager = configManager
    const hasOldVault = this.hasOldVault()
    if (!hasOldVault) {
      this.idStore = new IdentityStore({ configManager })
    }
  }

  oldSeedForPassword( password ) {
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
        try {
          resolve(this.serializeVault())
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  serializeVault() {
    const mnemonic = this.idStore._idmgmt.getSeed()
    const n = this.idStore._getAddresses().length

    return {
      type: 'HD Key Tree',
      data: { mnemonic, n },
    }
  }

  hasOldVault() {
    const wallet = this.configManager.getWallet()
    return wallet
  }
}
