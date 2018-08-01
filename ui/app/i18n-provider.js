const { Component } = require('react')
const connect = require('react-redux').connect
const PropTypes = require('prop-types')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const t = require('../i18n-helper').getMessage

class I18nProvider extends Component {
  tOrDefault = (key, defaultValue, ...args) => {
    const { localeMessages: { current, en } = {} } = this.props
    return t(current, key, ...args) || t(en, key, ...args) || defaultValue
  }

  getChildContext () {
    const { localeMessages } = this.props
    const { current, en } = localeMessages
    return {
      t (key, ...args) {
        return t(current, key, ...args) || t(en, key, ...args) || `[${key}]`
      },
      tOrDefault: this.tOrDefault,
      tOrKey (key, ...args) {
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
  children: PropTypes.object,
}

I18nProvider.childContextTypes = {
  t: PropTypes.func,
  tOrDefault: PropTypes.func,
  tOrKey: PropTypes.func,
}

const mapStateToProps = state => {
  const { localeMessages } = state
  return {
    localeMessages,
  }
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps)
)(I18nProvider)

