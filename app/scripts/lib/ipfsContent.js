const extension = require('extensionizer')
const resolver = require('./resolver.js')

module.exports = function (provider) {
    function ipfsContent (details) {
      const name = details.url.substring(7, details.url.length - 1)
      
      extension.tabs.query({active: true}, tab => {
          extension.tabs.update(tab.id, { url: `loading.html?tabid=${tab[0].id}` })
            resolver.resolve(name, provider).then(ipfsHash => {
                let url = 'https://ipfs.infura.io/ipfs/' + ipfsHash
                return fetch(url, { method: 'HEAD' }).then(response => response.status).then(statusCode => {
                    if (statusCode !== 200) return extension.tabs.update(tab.id, { url: '404.html' })
                    extension.tabs.update(tab.id, { url: url })
                })
                .catch(err => {
                    url = 'https://ipfs.infura.io/ipfs/' + ipfsHash
                    extension.tabs.update(tab.id, {url: url})
                    return err
                })
            })
            .catch(err => {
                const url = err === 'unsupport' ? 'unsupport' : 'error'
                extension.tabs.update(tab.id, {url: `${url}.html?name=${name}`})
            })
      })
      return { cancel: true }
    }
    extension.webRequest.onErrorOccurred.addListener(ipfsContent, {urls: ['*://*.eth/', '*://*.test/']})
    return {
      remove () {
        extension.webRequest.onErrorOccurred.removeListener(ipfsContent)
      },
    }
}
