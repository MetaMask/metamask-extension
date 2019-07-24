import React from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import I18nProvider from '../helpers/higher-order-components/i18n-provider'
import MetaMetricsProvider from '../helpers/higher-order-components/metametrics/metametrics.provider'

const Root = (props) => {
  const { children, store } = props

  return (
    <Provider store={store}>
      <HashRouter hashType="noslash">
        <MetaMetricsProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </MetaMetricsProvider>
      </HashRouter>
    </Provider>
  )
}

Root.propTypes = {
  children: PropTypes.element,
  store: PropTypes.object,
}

export default Root
