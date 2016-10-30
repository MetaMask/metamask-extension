const IdentityStore = require('./idStore')


module.exports = class IdentityStoreMigrator {

  constructor ({ configManager }) {
    this.configManager = configManager
    this.idStore = new IdentityStore({ configManager })
  }

  oldSeedForPassword( password ) {
    const isOldVault = this.hasOldVault()
    if (!isOldVault) {
      console.log('does not seem to have old vault')
      console.log('THE DATA:')
      console.log(this.configManager.getData())
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
    console.dir(this.idStore._idmgmt)
    const n = this.idStore._getAddresses().length

    return {
      type: 'HD Key Tree',
      data: { mnemonic, n },
    }
  }

  hasOldVault() {
    const wallet = this.configManager.getWallet()
    console.log('found old wallet: ' + wallet)
    return wallet
  }
}
