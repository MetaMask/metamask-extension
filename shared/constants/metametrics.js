/**
 * We attach context to every meta metrics event that help to qualify our analytics.
 * This type has all optional values because it represents a returned object from a
 * method call. Ideally app and userAgent are defined on every event. This is confirmed
 * in the getTrackMetaMetricsEvent function, but still provides the consumer a way to
 * override these values if necessary.
 * @typedef {Object} MetaMetricsContext
 * @property {Object} app
 * @property {string} app.name - the name of the application tracking the event
 * @property {string} app.version - the version of the application
 * @property {string} userAgent - the useragent string of the user
 * @property {Object} [page]     - an object representing details of the current page
 * @property {string} [page.path] - the path of the current page (e.g /home)
 * @property {string} [page.title] - the title of the current page (e.g 'home')
 * @property {string} [page.url]  - the fully qualified url of the current page
 * @property {Object} [referrer] - for metamask, this is the dapp that triggered an interaction
 * @property {string} [referrer.url] - the origin of the dapp issuing the notification
 */

/**
 * page and referrer from the MetaMetricsContext are very dynamic in nature and may be
 * provided as part of the initial context payload when creating the trackMetaMetricsEvent function,
 * or at the event level when calling the trackMetaMetricsEvent function.
 * @typedef {Pick<MetaMetricsContext, 'page' | 'referrer'>} MetaMetricsDynamicContext
 */

/**
 * @typedef {import('../../app/scripts/lib/enums').EnvironmentType} EnvironmentType
 */

/**
 * @typedef {Object} MetaMetricsRequiredState
 * @property {bool} participateInMetaMetrics - has the user opted into metametrics
 * @property {string} [metaMetricsId] - the user's metaMetricsId, if they have opted in
 * @property {MetaMetricsDynamicContext} context - context about the event
 * @property {string} chainId - the chain id of the current network
 * @property {string} locale - the locale string of the current user
 * @property {string} network - the name of the current network
 * @property {EnvironmentType} environmentType - environment that the event happened in
 * @property {string} [metaMetricsSendCount] - number of transactions sent, used to add metametricsId
 *  intermittently to events with onchain data attached to them used to protect identity of users.
 */

/**
 * @typedef {Object} MetaMetricsEventPayload
 * @property {string}  event - event name to track
 * @property {string}  category - category to associate event to
 * @property {boolean} [isOptIn] - happened during opt in/out workflow
 * @property {object}  [properties] - object of custom values to track, snake_case
 * @property {object}  [sensitiveProperties] - Object of sensitive values to track, snake_case.
 *  These properties will be sent in an additional event that excludes the user's metaMetricsId.
 * @property {number}  [revenue] - amount of currency that event creates in revenue for MetaMask
 * @property {string}  [currency] - ISO 4127 format currency for events with revenue, defaults to US dollars
 * @property {number}  [value] - Abstract "value" that this event has for MetaMask.
 * @property {boolean} [excludeMetaMetricsId] - whether to exclude the user's metametrics id for anonymity
 * @property {string}  [metaMetricsId] - an override for the metaMetricsId in the event one is created as part
 *  of an asynchronous workflow, such as awaiting the result of the metametrics opt-in function that generates the
 *  user's metametrics id.
 * @property {boolean} [matomoEvent] - is this event a holdover from matomo that needs further migration?
 *  when true, sends the data to a special segment source that marks the event data as not conforming to our
 *  ideal schema
 * @property {MetaMetricsDynamicContext} [eventContext] - additional context to attach to event
 */

export const METAMETRICS_ANONYMOUS_ID = '0x0000000000000000'
