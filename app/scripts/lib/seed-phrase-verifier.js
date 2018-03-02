const KeyringController = require('eth-keyring-controller')

const seedPhraseVerifier = {

  verifyAccounts(createdAccounts, seedWords) {

    return new Promise((resolve, reject) => {

      if (!createdAccounts || createdAccounts.length < 1) {
        return reject(new Error('No created accounts defined.'))
      }

      let keyringController = new KeyringController({})
      let Keyring = keyringController.getKeyringClassForType('HD Key Tree')
      let opts = {
        mnemonic: seedWords,
        numberOfAccounts: createdAccounts.length,
      }

      let keyring = new Keyring(opts)
      keyring.getAccounts()
        .then((restoredAccounts) => {

          log.debug('Created accounts: ' + JSON.stringify(createdAccounts))
          log.debug('Restored accounts: ' + JSON.stringify(restoredAccounts))

          if (restoredAccounts.length != createdAccounts.length) {
            // this should not happen...
            return reject(new Error("Wrong number of accounts"))
          }

          for (let i = 0; i < restoredAccounts.length; i++) {
            if (restoredAccounts[i] !== createdAccounts[i]) {
              return reject(new Error('Not identical accounts! Original: ' + createdAccounts[i] + ', Restored: ' + restoredAccounts[i]))
            }
          }
          return resolve()
        })
    })
  }
}

module.exports = seedPhraseVerifier