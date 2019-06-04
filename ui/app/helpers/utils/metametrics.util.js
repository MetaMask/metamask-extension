/* eslint camelcase: 0 */

const ethUtil = require('ethereumjs-util')

const inDevelopment = process.env.NODE_ENV === 'development'

const METAMETRICS_BASE_URL = 'https://chromeextensionmm.innocraft.cloud/piwik.php'
const METAMETRICS_REQUIRED_PARAMS = `?idsite=${inDevelopment ? 1 : 2}&rec=1&apiv=1`
const METAMETRICS_BASE_FULL = METAMETRICS_BASE_URL + METAMETRICS_REQUIRED_PARAMS

const METAMETRICS_TRACKING_URL = inDevelopment
  ? 'http://www.metamask.io/metametrics'
  : 'http://www.metamask.io/metametrics-prod'

/** ***************Custom variables*************** **/
// Custon variable declarations
const METAMETRICS_CUSTOM_GAS_LIMIT_CHANGE = 'gasLimitChange'
const METAMETRICS_CUSTOM_GAS_PRICE_CHANGE = 'gasPriceChange'
const METAMETRICS_CUSTOM_FUNCTION_TYPE = 'functionType'
const METAMETRICS_CUSTOM_RECIPIENT_KNOWN = 'recipientKnown'
const METAMETRICS_CUSTOM_CONFIRM_SCREEN_ORIGIN = 'origin'
const METAMETRICS_CUSTOM_FROM_NETWORK = 'fromNetwork'
const METAMETRICS_CUSTOM_TO_NETWORK = 'toNetwork'
const METAMETRICS_CUSTOM_ERROR_FIELD = 'errorField'
const METAMETRICS_CUSTOM_ERROR_MESSAGE = 'errorMessage'
const METAMETRICS_CUSTOM_RPC_NETWORK_ID = 'networkId'
const METAMETRICS_CUSTOM_RPC_CHAIN_ID = 'chainId'
const METAMETRICS_CUSTOM_GAS_CHANGED = 'gasChanged'
const METAMETRICS_CUSTOM_ASSET_SELECTED = 'assetSelected'

const customVariableNameIdMap = {
  [METAMETRICS_CUSTOM_FUNCTION_TYPE]: 1,
  [METAMETRICS_CUSTOM_RECIPIENT_KNOWN]: 2,
  [METAMETRICS_CUSTOM_CONFIRM_SCREEN_ORIGIN]: 3,
  [METAMETRICS_CUSTOM_GAS_LIMIT_CHANGE]: 4,
  [METAMETRICS_CUSTOM_GAS_PRICE_CHANGE]: 5,

  [METAMETRICS_CUSTOM_FROM_NETWORK]: 1,
  [METAMETRICS_CUSTOM_TO_NETWORK]: 2,

  [METAMETRICS_CUSTOM_RPC_NETWORK_ID]: 1,
  [METAMETRICS_CUSTOM_RPC_CHAIN_ID]: 2,

  [METAMETRICS_CUSTOM_ERROR_FIELD]: 3,
  [METAMETRICS_CUSTOM_ERROR_MESSAGE]: 4,

  [METAMETRICS_CUSTOM_GAS_CHANGED]: 1,
  [METAMETRICS_CUSTOM_ASSET_SELECTED]: 2,
}
/** ********************************************************** **/

const METAMETRICS_CUSTOM_NETWORK = 'network'
const METAMETRICS_CUSTOM_ENVIRONMENT_TYPE = 'environmentType'
const METAMETRICS_CUSTOM_ACTIVE_CURRENCY = 'activeCurrency'
const METAMETRICS_CUSTOM_ACCOUNT_TYPE = 'accountType'
const METAMETRICS_CUSTOM_NUMBER_OF_TOKENS = 'numberOfTokens'
const METAMETRICS_CUSTOM_NUMBER_OF_ACCOUNTS = 'numberOfAccounts'


const customDimensionsNameIdMap = {
  [METAMETRICS_CUSTOM_NETWORK]: 5,
  [METAMETRICS_CUSTOM_ENVIRONMENT_TYPE]: 6,
  [METAMETRICS_CUSTOM_ACTIVE_CURRENCY]: 7,
  [METAMETRICS_CUSTOM_ACCOUNT_TYPE]: 8,
  [METAMETRICS_CUSTOM_NUMBER_OF_TOKENS]: 9,
  [METAMETRICS_CUSTOM_NUMBER_OF_ACCOUNTS]: 10,
}

function composeUrlRefParamAddition (previousPath, confirmTransactionOrigin) {
  const externalOrigin = confirmTransactionOrigin && confirmTransactionOrigin !== 'MetaMask'
  return `&urlref=${externalOrigin ? 'EXTERNAL' : encodeURIComponent(previousPath.replace(/chrome-extension:\/\/\w+/, METAMETRICS_TRACKING_URL))}`
}

// composes query params of the form &dimension[0-999]=[value]
function composeCustomDimensionParamAddition (customDimensions) {
  const customDimensionParamStrings = Object.keys(customDimensions).reduce((acc, name) => {
    return [...acc, `dimension${customDimensionsNameIdMap[name]}=${customDimensions[name]}`]
  }, [])
  return `&${customDimensionParamStrings.join('&')}`
}

// composes query params in form: &cvar={[id]:[[name],[value]]}
// Example: &cvar={"1":["OS","iphone 5.0"],"2":["Matomo Mobile Version","1.6.2"],"3":["Locale","en::en"],"4":["Num Accounts","2"]}
function composeCustomVarParamAddition (customVariables) {
  const customVariableIdValuePairs = Object.keys(customVariables).reduce((acc, name) => {
    return {
      [customVariableNameIdMap[name]]: [name, customVariables[name]],
      ...acc,
    }
  }, {})
  return `&cvar=${encodeURIComponent(JSON.stringify(customVariableIdValuePairs))}`
}

function composeParamAddition (paramValue, paramName) {
  return paramValue !== 0 && !paramValue
    ? ''
    : `&${paramName}=${paramValue}`
}

/**
  * @name composeUrl
  * @param {Object} config - configuration object for composing the metametrics url
  * @property {object} config.eventOpts Object containing event category, action and name descriptors
  * @property {object} config.customVariables Object containing custom properties with values relevant to a specific event
  * @property {object} config.pageOpts Objects containing information about a page/route the event is dispatched from
  * @property {number} config.network The selected network of the user when the event occurs
  * @property {string} config.environmentType The "environment" the user is using the app from: 'popup', 'notification' or 'fullscreen'
  * @property {string} config.activeCurrency The current the user has select as their primary currency at the time of the event
  * @property {string} config.accountType The account type being used at the time of the event: 'hardware', 'imported' or 'default'
  * @property {number} config.numberOfTokens The number of tokens that the user has added at the time of the event
  * @property {number} config.numberOfAccounts The number of accounts the user has added at the time of the event
  * @property {string} config.previousPath The location path the user was on prior to the path they are on at the time of the event
  * @property {string} config.currentPath The location path the user is on at the time of the event
  * @property {string} config.metaMetricsId A random id assigned to a user at the time of opting in to metametrics. A hexadecimal number
  * @property {string} config.confirmTransactionOrigin The origin on a transaction
  * @property {string} config.url The url to track an event at. Overrides `currentPath`
  * @property {boolean} config.excludeMetaMetricsId Whether or not the tracked event data should be associated with a metametrics id
  * @property {boolean} config.isNewVisit Whether or not the event should be tracked as a new visit/user sessions
  * @returns {String} Returns a url to be passed to fetch to make the appropriate request to matomo.
  *   Example: https://chromeextensionmm.innocraft.cloud/piwik.php?idsite=1&rec=1&apiv=1&e_c=Navigation&e_a=Home&e_n=Clicked%20Send:%20Eth&urlref=http%3A%2F%2Fwww.metamask.io%2Fmetametrics%2Fhome.html%23send&dimension5=3&dimension6=fullscreen&dimension7=ETH&dimension8=default&dimension9=0&dimension10=3&url=http%3A%2F%2Fwww.metamask.io%2Fmetametrics%2Fhome.html%23&_id=49c10aff19795e9a&rand=7906028754863992&pv_id=53acad&uid=49c1
  */
function composeUrl (config) {
  const {
    eventOpts = {},
    customVariables = '',
    pageOpts = '',
    network,
    environmentType,
    activeCurrency,
    accountType,
    numberOfTokens,
    numberOfAccounts,
    previousPath = '',
    currentPath,
    metaMetricsId,
    confirmTransactionOrigin,
    url: configUrl,
    excludeMetaMetricsId,
    isNewVisit,
  } = config
  const base = METAMETRICS_BASE_FULL

  const e_c = composeParamAddition(eventOpts.category, 'e_c')
  const e_a = composeParamAddition(eventOpts.action, 'e_a')
  const e_n = composeParamAddition(eventOpts.name, 'e_n')
  const new_visit = isNewVisit ? `&new_visit=1` : ''

  const cvar = customVariables && composeCustomVarParamAddition(customVariables) || ''

  const action_name = ''

  const urlref = previousPath && composeUrlRefParamAddition(previousPath, confirmTransactionOrigin)

  const dimensions = !pageOpts.hideDimensions ? composeCustomDimensionParamAddition({
    network,
    environmentType,
    activeCurrency,
    accountType,
    numberOfTokens: customVariables && customVariables.numberOfTokens || numberOfTokens,
    numberOfAccounts: customVariables && customVariables.numberOfAccounts || numberOfAccounts,
  }) : ''
  const url = configUrl || currentPath ? `&url=${encodeURIComponent(currentPath.replace(/chrome-extension:\/\/\w+/, METAMETRICS_TRACKING_URL))}` : ''
  const _id = metaMetricsId && !excludeMetaMetricsId ? `&_id=${metaMetricsId.slice(2, 18)}` : ''
  const rand = `&rand=${String(Math.random()).slice(2)}`
  const pv_id = (url || currentPath) && `&pv_id=${ethUtil.bufferToHex(ethUtil.sha3(url || currentPath.match(/chrome-extension:\/\/\w+\/(.+)/)[0])).slice(2, 8)}` || ''
  const uid = metaMetricsId && !excludeMetaMetricsId
    ? `&uid=${metaMetricsId.slice(2, 18)}`
    : excludeMetaMetricsId
      ? '&uid=0000000000000000'
      : ''

  return [ base, e_c, e_a, e_n, cvar, action_name, urlref, dimensions, url, _id, rand, pv_id, uid, new_visit ].join('')
}

export function sendMetaMetricsEvent (config, permissionPreferences) {
  return fetch(composeUrl(config, permissionPreferences), {
    'headers': {},
    'method': 'GET',
  })
}

export function verifyUserPermission (config, props) {
  const {
    eventOpts = {},
  } = config
  const { userPermissionPreferences } = props
  const {
    allowAll,
    allowNone,
    allowSendMetrics,
  } = userPermissionPreferences

  if (allowNone) {
    return false
  } else if (allowAll) {
    return true
  } else if (allowSendMetrics && eventOpts.name === 'send') {
    return true
  } else {
    return false
  }
}

const trackableSendCounts = {
  1: true,
  10: true,
  30: true,
  50: true,
  100: true,
  250: true,
  500: true,
  1000: true,
  2500: true,
  5000: true,
  10000: true,
  25000: true,
}

export function sendCountIsTrackable (sendCount) {
  return Boolean(trackableSendCounts[sendCount])
}
