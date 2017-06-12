const uri = 'https://faucet.metamask.io/'
const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'
const env = process.env.METAMASK_ENV

module.exports = function (address) {
  // Don't faucet in development or test
  if (METAMASK_DEBUG === true || env === 'test') return
  global.log.info('auto-fauceting:', address)
  const data = address
  const headers = new Headers()
  headers.append('Content-type', 'application/rawdata')
  fetch(uri, {
    method: 'POST',
    headers,
    body: data,
  })
  .catch((err) => {
    console.error(err)
  })
}
