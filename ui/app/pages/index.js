import React from 'react'
const PropTypes = require('prop-types')
const { Provider } = require('react-redux')
const { HashRouter } = require('react-router-dom')
const Routes = require('./routes')
const I18nProvider = require('../helpers/higher-order-components/i18n-provider')
const MetaMetricsProvider = require('../helpers/higher-order-components/metametrics/metametrics.provider')

const Index = props => {
  const { store } = props

  return (
    <Provider store={store}>
      <HashRouter hashType="noslash">
        <MetaMetricsProvider>
          <I18nProvider>
            <Routes />
          </I18nProvider>
        </MetaMetricsProvider>
      </HashRouter>
    </Provider>
  )
}

Index.propTypes = {
  store: PropTypes.object,
}

module.exports = Index
