// cross-browser connection to extension i18n API
import React from 'react'
import log from 'loglevel'

import * as Sentry from '@sentry/browser'

const warned = {}
const missingMessageErrors = {}

/**
 * Returns a localized message for the given key
 * @param {string} localeCode - The code for the current locale
 * @param {Object} localeMessages - The map of messages for the current locale
 * @param {string} key - The message key
 * @param {string[]} substitutions - A list of message substitution replacements
 * @returns {null|string} - The localized message
 */
export const getMessage = (localeCode, localeMessages, key, substitutions) => {
  if (!localeMessages) {
    return null
  }
  if (!localeMessages[key]) {
    if (localeCode === 'en') {
      if (!missingMessageErrors[key]) {
        missingMessageErrors[key] = new Error(`Unable to find value of key "${key}" for locale "${localeCode}"`)
        Sentry.captureException(missingMessageErrors[key])
        log.error(missingMessageErrors[key])
        if (process.env.IN_TEST === 'true') {
          throw missingMessageErrors[key]
        }
      }
    } else if (!warned[localeCode] || !warned[localeCode][key]) {
      if (!warned[localeCode]) {
        warned[localeCode] = {}
      }
      warned[localeCode][key] = true
      log.warn(`Translator - Unable to find value of key "${key}" for locale "${localeCode}"`)
    }
    return null
  }
  const entry = localeMessages[key]
  let phrase = entry.message

  const hasSubstitutions = Boolean(substitutions && substitutions.length)
  const hasReactSubstitutions = hasSubstitutions &&
    substitutions.some((element) => typeof element === 'function' || typeof element === 'object')

  // perform substitutions
  if (hasSubstitutions) {
    const parts = phrase.split(/(\$\d)/g)
    const partsToReplace = phrase.match(/(\$\d)/g)

    if (partsToReplace.length > substitutions.length) {
      throw new Error(`Insufficient number of substitutions for message: '${phrase}'`)
    }

    const substitutedParts = parts.map((part) => {
      const subMatch = part.match(/\$(\d)/)
      return subMatch ? substitutions[Number(subMatch[1]) - 1] : part
    })

    phrase = hasReactSubstitutions
      ? <span> { substitutedParts } </span>
      : substitutedParts.join('')
  }

  return phrase
}

export async function fetchLocale (localeCode) {
  try {
    const response = await fetch(`./_locales/${localeCode}/messages.json`)
    return await response.json()
  } catch (error) {
    log.error(`failed to fetch ${localeCode} locale because of ${error}`)
    return {}
  }
}

