import React from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import Routes from './routes'
import I18nProvider from '../helpers/higher-order-components/i18n-provider'
import MetaMetricsProvider from '../helpers/higher-order-components/metametrics/metametrics.provider'

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

export default Index
