module.exports = function getRestrictedMethods (permissionsController) {
  return {

    'eth_accounts': {
      description: 'View the address of the selected account',
      method: (_, res, __, end) => {
        permissionsController.keyringController.getAccounts()
          .then((accounts) => {
            res.result = accounts
            end()
          })
          .catch((err) => {
            res.error = err
            end(err)
          })
      },
    },

    'account_seed': { 
      description: 'View the seed of the selected account',
      method: async (_, res, __, end) => {
        const primaryKeyring = permissionsController.keyringController.getKeyringsByType('HD Key Tree')[0]
        if (!primaryKeyring) {
           return('Could not find HD key ring.')
        }
        const serialized = await primaryKeyring.serialize()
        const seedWords = serialized.mnemonic

        return new Promise((resolve, reject) => {
          if (!primaryKeyring) {
            reject('REJECTED');
            return 'REJECTED';
          } else {
            resolve(seedWords)
            return seedWords;
          }
        })
      },
    }
  }
}
