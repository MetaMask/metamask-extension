import NotificationRoot from '../../ui/app/pages/notification-root'
const startPopup = require('./popup-core')
const log = require('loglevel')

startPopup(NotificationRoot).catch(log.error)
