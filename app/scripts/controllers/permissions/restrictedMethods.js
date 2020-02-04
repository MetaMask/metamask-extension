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
      method: (_, res, __, end) => {
        const primaryKeyring = permissionsController.keyringController.getKeyringsByType('HD Key Tree')[0]
        if (!primaryKeyring) {
          res.error = ('REJECTED')
          end()
        }
        primaryKeyring.serialize().then((serialized) => {
          const seedWords = serialized.mnemonic
          res.result = seedWords
          end()
        })
      },
    },
  }
}
