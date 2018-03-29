const { Component } = require('react')
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const t = require('../i18n-helper').getMessage

class I18nProvider extends Component {
  getChildContext() {
    const { localeMessages } = this.props
    return {
      t: t.bind(null, localeMessages),
    }
  }

  render() {
    return h('div', [ this.props.children ])
  }
}

I18nProvider.propTypes = {
  localeMessages: PropTypes.object,
  children: PropTypes.object,
}

I18nProvider.childContextTypes = {
  t: PropTypes.func,
}

const mapStateToProps = state => {
  const { localeMessages } = state
  return {
    localeMessages,
  }
}

module.exports = connect(mapStateToProps)(I18nProvider)

