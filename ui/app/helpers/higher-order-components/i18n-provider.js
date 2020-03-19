import { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { getMessage } from '../utils/i18n-helper'

class I18nProvider extends Component {
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
        return getMessage(currentLocale, current, key, ...args) || getMessage(currentLocale, en, key, ...args)
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
}

const mapStateToProps = (state) => {
  const { localeMessages, metamask: { currentLocale } } = state
  return {
    currentLocale,
    localeMessages,
  }
}

export default connect(mapStateToProps)(I18nProvider)
