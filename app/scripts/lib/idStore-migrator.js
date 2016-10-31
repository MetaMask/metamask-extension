const IdentityStore = require('./idStore')


module.exports = class IdentityStoreMigrator {

  constructor ({ configManager }) {
    this.configManager = configManager
    this.idStore = new IdentityStore({ configManager })
  }

  oldSeedForPassword( password ) {
    const isOldVault = this.hasOldVault()
    if (!isOldVault) {
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
