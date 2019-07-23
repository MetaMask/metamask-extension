const log = require('loglevel')
const Root = require('../../ui/app/pages')
const startPopup = require('./popup-core')

startPopup(Root).catch(log.error)

