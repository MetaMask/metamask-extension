import React, { Component } from 'react'
const PropTypes = require('prop-types')
const { Provider } = require('react-redux')
const { Router } = require('react-router-dom')
const Routes = require('./routes')
const I18nProvider = require('../helpers/higher-order-components/i18n-provider')
const MetaMetricsProvider = require('../helpers/higher-order-components/metametrics/metametrics.provider')

class Index extends Component {
  render () {
    const { store, history } = this.props

    return (
      <Provider store={store}>
        <Router history={history}>
          <MetaMetricsProvider>
            <I18nProvider>
              <Routes />
            </I18nProvider>
          </MetaMetricsProvider>
        </Router>
      </Provider>
    )
  }
}

Index.propTypes = {
  store: PropTypes.object,
  history: PropTypes.object,
}

module.exports = Index
