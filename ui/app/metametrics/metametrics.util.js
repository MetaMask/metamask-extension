/* eslint camelcase: 0 */

const ethUtil = require('ethereumjs-util')

const METAMETRICS_BASE_URL = 'https://chromeextensionmm.innocraft.cloud/piwik.php'
const METAMETRICS_REQUIRED_PARAMS = '?idsite=1&rec=1&apiv=1'
const METAMETRICS_BASE_FULL = METAMETRICS_BASE_URL + METAMETRICS_REQUIRED_PARAMS

const METAMETRICS_CUSTOM_HAD_ERROR = 'hadError'
const METAMETRICS_CUSTOM_HEX_DATA = 'hexData'
const METAMETRICS_CUSTOM_FUNCTION_TYPE = 'functionType'
const METAMETRICS_CUSTOM_GAS_LIMIT_CHANGE = 'gasLimitChange'
const METAMETRICS_CUSTOM_GAS_PRICE_CHANGE = 'gasPriceChange'
const METAMETRICS_CUSTOM_RECIPIENT_KNOWN = 'recipientKnown'
const METAMETRICS_CUSTOM_CONFIRM_SCREEN_ORIGIN = 'origin'

const METAMETRICS_CUSTOM_NETWORK = 'network'
const METAMETRICS_CUSTOM_ENVIRONMENT_TYPE = 'environmentType'
const METAMETRICS_CUSTOM_ACTIVE_CURRENCY = 'activeCurrency'
const METAMETRICS_CUSTOM_ACCOUNT_TYPE = 'accountType'
const METAMETRICS_CUSTOM_NUMBER_OF_TOKENS = 'numberOfTokens'
const METAMETRICS_CUSTOM_NUMBER_OF_ACCOUNTS = 'numberOfAccounts'

const customVariableNameIdMap = {
  [METAMETRICS_CUSTOM_HAD_ERROR]: 1,
  [METAMETRICS_CUSTOM_HEX_DATA]: 2,
  [METAMETRICS_CUSTOM_FUNCTION_TYPE]: 3,
  [METAMETRICS_CUSTOM_GAS_LIMIT_CHANGE]: 4,
  [METAMETRICS_CUSTOM_GAS_PRICE_CHANGE]: 5,
  [METAMETRICS_CUSTOM_RECIPIENT_KNOWN]: 6,
  [METAMETRICS_CUSTOM_CONFIRM_SCREEN_ORIGIN]: 7,
}

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
  return `&urlref=${externalOrigin ? 'EXTERNAL' : encodeURIComponent(previousPath.replace(/chrome-extension:\/\/\w+/, 'http://www.metamask.io/metametrics'))}`
}

function composeCustomDimensionParamAddition (customDimensions) {
  const customDimensionParamStrings = Object.keys(customDimensions).reduce((acc, name) => {
    return [...acc, `dimension${customDimensionsNameIdMap[name]}=${customDimensions[name]}`]
  }, [])
  return `&${customDimensionParamStrings.join('&')}`
}

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

function composeUrl (config, permissionPreferences = {}) {
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
  const url = configUrl || `&url=${encodeURIComponent(currentPath.replace(/chrome-extension:\/\/\w+/, 'http://www.metamask.io/metametrics'))}`
  const _id = metaMetricsId && !excludeMetaMetricsId ? `&_id=${metaMetricsId.slice(2, 18)}` : ''
  const rand = `&rand=${String(Math.random()).slice(2)}`
  const pv_id = `&pv_id=${ethUtil.bufferToHex(ethUtil.sha3(url || currentPath.match(/chrome-extension:\/\/\w+\/(.+)/)[0])).slice(2, 8)}`
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
