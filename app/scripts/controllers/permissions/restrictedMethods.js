
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
          .catch((reason) => {
            res.error = reason
            end(reason)
          })
      },
    },

    'readYourProfile': {
      description: 'Read from your profile',
      method: (_req, res, _next, end) => {
        res.result = permissionsController.testProfile
        end()
      },
    },

    'writeToYourProfile': {
      description: 'Write to your profile.',
      method: (req, res, _next, end) => {
        const [ key, value ] = req.params
        permissionsController.testProfile[key] = value
        res.result = permissionsController.testProfile
        return end()
      },
    },
  }
}
