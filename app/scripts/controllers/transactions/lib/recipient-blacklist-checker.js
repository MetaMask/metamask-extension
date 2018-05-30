const KeyringController = require('eth-keyring-controller')

/** @module*/
module.exports = {
  checkAccount,
}

/**
  @param networkId {number}
  @param account {string}
  @returns {array}
*/
async function checkAccount (networkId, account) {

  // mainnet's network id === 1
  if (networkId !== 1) {
    return
  }

  const damnedMnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
  const keyringController = new KeyringController({})
  const Keyring = keyringController.getKeyringClassForType('HD Key Tree')
  const opts = {
    mnemonic: damnedMnemonic,
    numberOfAccounts: 10,
  }

  const accountToCheck = account.toLowerCase()
  const keyring = new Keyring(opts)
  const damnedAccounts = await keyring.getAccounts()
  for (let i = 0; i < damnedAccounts.length; i++) {
    if (damnedAccounts[i].toLowerCase() === accountToCheck) {
      throw new Error('Recipient is a public account')
    }
  }
}