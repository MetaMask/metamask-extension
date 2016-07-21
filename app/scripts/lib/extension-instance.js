const apis = [
  'alarms',
  'bookmarks',
  'browserAction',
  'commands',
  'contextMenus',
  'cookies',
  'downloads',
  'events',
  'extension',
  'extensionTypes',
  'history',
  'i18n',
  'idle',
  'notifications',
  'pageAction',
  'runtime',
  'storage',
  'tabs',
  'webNavigation',
  'webRequest',
  'windows',
]

function Extension () {
  const _this = this
  let global = window

  if (window.chrome) {
    global = window.chrome
  }

  apis.forEach(function (api) {
    _this[api] = global[api]
  })
}

module.exports = Extension
