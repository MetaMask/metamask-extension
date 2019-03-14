import React, { Component } from 'react'
const PropTypes = require('prop-types')
const { Provider } = require('react-redux')
const { HashRouter } = require('react-router-dom')
const App = require('./app')
const I18nProvider = require('../helpers/higher-order-components/i18n-provider')
const MetaMetricsProvider = require('../helpers/higher-order-components/metametrics/metametrics.provider')

class Root extends Component {
  render () {
    const { store } = this.props

    return (
      <Provider store={store}>
        <HashRouter hashType="noslash">
          <MetaMetricsProvider>
            <I18nProvider>
              <App />
            </I18nProvider>
          </MetaMetricsProvider>
        </HashRouter>
      </Provider>
    )
  }
}

Root.propTypes = {
  store: PropTypes.object,
}

module.exports = Root
