
module.exports = function getRestrictedMethods (permissionsController) {
  return {

    'eth_accounts': {
      description: 'View selected Ethereum account(s)',
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
  }
}
