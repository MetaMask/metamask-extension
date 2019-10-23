
module.exports = function getRestrictedMethods (permissionsController) {
  return {

    'eth_accounts': {
      description: 'View Ethereum accounts',
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
