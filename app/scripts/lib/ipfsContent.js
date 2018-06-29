const extension = require('extensionizer')
const resolver = require('./resolver.js')

module.exports = function (provider) {
    extension.webRequest.onBeforeRequest.addListener(details => {
        const urlhttpreplace = details.url.replace(/\w+?:\/\//, "")
        const url = urlhttpreplace.replace(/[\\\/].*/g, "")
        let domainhtml = urlhttpreplace.match(/[\\\/].*/g)
        let clearTime = null
        let name = url.replace(/\/$/g, "")
        if (domainhtml === null) domainhtml = [""]
        extension.tabs.getSelected(null, tab => {
            extension.tabs.update(tab.id, { url: 'loading.html' })

            clearTime = setTimeout(() => {
                return extension.tabs.update(tab.id, { url: '404.html' })
            }, 60000)

            resolver.resolve(name, provider).then(ipfsHash => {
                clearTimeout(clearTime)
                let url = 'https://ipfs.infura.io/ipfs/' + ipfsHash + domainhtml[0]
                return fetch(url, { method: 'HEAD' }).then(response => response.status).then(statusCode => {
                    if (statusCode !== 200) return extension.tabs.update(tab.id, { url: '404.html' })
                    extension.tabs.update(tab.id, { url: url })
                })
                .catch(err => {
                    url = 'https://ipfs.infura.io/ipfs/' + ipfsHash + domainhtml[0]
                    extension.tabs.update(tab.id, {url: url})
                    return err
                })
            })
            .catch(err => {
                clearTimeout(clearTime)
                const url = err === 'unsupport' ? 'unsupport' : 'error'
                extension.tabs.update(tab.id, {url: `${url}.html?name=${name}`})
            })
        })
        return { cancel: true }
    }, {urls: ['*://*.eth/', '*://*.eth/*']})
}
