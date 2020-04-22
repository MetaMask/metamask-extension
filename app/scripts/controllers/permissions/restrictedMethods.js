export default function getRestrictedMethods (permissionsController) {
  return {
    eth_accounts: {
      description: 'restrictedMethods_eth_accounts',
      method: (_, res, __, end) => {
        permissionsController
          .getKeyringAccounts()
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
