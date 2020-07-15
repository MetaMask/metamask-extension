import { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { getMessage } from '../utils/i18n-helper'

const DATE_TO_LAUNCH_OCEANUS = new Date(
  'Tue Jul 18 2020 00:00:00 GMT+0800 (China Standard Time)'
)

class I18nProvider extends Component {
  tOrDefault = (key, defaultValue, ...args) => {
    if (!key) {
      return defaultValue
    }
    const { localeMessages: { current, en } = {}, currentLocale } = this.props
    return (
      getMessage(currentLocale, current, key, ...args) ||
      getMessage(currentLocale, en, key, ...args) ||
      defaultValue
    )
  }

  getChildContext () {
    const { localeMessages, currentLocale } = this.props
    const { current, en } = localeMessages
    return {
      /**
       * Returns a localized message for the given key
       * @param {string} key - The message key
       * @param {string[]} args - A list of message substitution replacements
       * @returns {string|undefined|null} - The localized message if available
       */
      t (key, ...args) {
        let trans =
          getMessage(currentLocale, current, key, ...args) ||
          getMessage(currentLocale, en, key, ...args) ||
          `[${key}]`

        if (
          new Date().getTime() >= DATE_TO_LAUNCH_OCEANUS &&
          typeof trans === 'string' &&
          /pontus/i.test(trans)
        ) {
          trans = trans.replace('Pontus', 'Oceanus')
          trans = trans.replace('pontus', 'oceanus')
        }
        return trans
      },
      tOrDefault: this.tOrDefault,
      tOrKey: (key, ...args) => {
        return this.tOrDefault(key, key, ...args)
      },
    }
  }

  render () {
    return this.props.children
  }
}

I18nProvider.propTypes = {
  localeMessages: PropTypes.object,
  currentLocale: PropTypes.string,
  children: PropTypes.object,
}

I18nProvider.childContextTypes = {
  t: PropTypes.func,
  tOrDefault: PropTypes.func,
  tOrKey: PropTypes.func,
}

const mapStateToProps = (state) => {
  const {
    localeMessages,
    metamask: { currentLocale },
  } = state
  return {
    currentLocale,
    localeMessages,
  }
}

export default connect(mapStateToProps)(I18nProvider)
