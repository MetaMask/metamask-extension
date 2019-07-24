import Root from '../../ui/app/pages/ui-root'
const log = require('loglevel')
const startPopup = require('./popup-core')

startPopup(Root).catch(log.error)

