const { Component } = require('react')
const { Switch, Route, matchPath } = require('react-router-dom')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const TabBar = require('../../tab-bar')
const Settings = require('./settings')
const Info = require('./info')
const { DEFAULT_ROUTE, SETTINGS_ROUTE, INFO_ROUTE } = require('../../../routes')

class Config extends Component {
  renderTabs () {
    const { history, location } = this.props

    return h('div.settings__tabs', [
      h(TabBar, {
        tabs: [
          { content: this.context.t('settings'), key: SETTINGS_ROUTE },
          { content: this.context.t('info'), key: INFO_ROUTE },
        ],
        isActive: key => matchPath(location.pathname, { path: key, exact: true }),
        onSelect: key => history.push(key),
      }),
    ])
  }

  render () {
    const { history } = this.props

    return (
      h('.main-container.settings', {}, [
        h('.settings__header', [
          h('div.settings__close-button', {
            onClick: () => history.push(DEFAULT_ROUTE),
          }),
          this.renderTabs(),
        ]),
        h(Switch, [
          h(Route, {
            exact: true,
            path: INFO_ROUTE,
            component: Info,
          }),
          h(Route, {
            exact: true,
            path: SETTINGS_ROUTE,
            component: Settings,
          }),
        ]),
      ])
    )
  }
}

Config.propTypes = {
  location: PropTypes.object,
  history: PropTypes.object,
  t: PropTypes.func,
}

Config.contextTypes = {
  t: PropTypes.func,
}

module.exports = Config
