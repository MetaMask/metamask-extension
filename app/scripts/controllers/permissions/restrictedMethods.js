
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
  }
}
