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

  apis.forEach(function (api) {
    _this[api] = chrome !== undefined && chrome[api] ? chrome[api]
      : window[api] ? window[api]
        : browser && browser.extension && browser.extension[api]
          ? browser.extension[api] : null
  })
}

module.exports = Extension
