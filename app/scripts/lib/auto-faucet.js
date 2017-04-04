const uri = 'https://faucet.metamask.io/'
const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'
const env = process.env.METAMASK_ENV

module.exports = function (address) {
  if (METAMASK_DEBUG || env === 'test') return // Don't faucet in development or test
  let data = address
  let headers = new Headers()
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
