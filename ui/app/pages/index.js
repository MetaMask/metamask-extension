import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import * as Sentry from '@sentry/browser'
import ErrorPage from './error'
import Routes from './routes'
import { I18nProvider, LegacyI18nProvider } from '../contexts/i18n'
import MetaMetricsProvider from '../helpers/higher-order-components/metametrics/metametrics.provider'

class Index extends PureComponent {
  state = {}

  static getDerivedStateFromError (error) {
    return { error }
  }

  componentDidCatch (error) {
    Sentry.captureException(error)
  }

  render () {
    const { error, errorId } = this.state
    const { store } = this.props

    if (error) {
      return (
        <Provider store={store}>
          <I18nProvider>
            <LegacyI18nProvider>
              <ErrorPage
                error={error}
                errorId={errorId}
              />
            </LegacyI18nProvider>
          </I18nProvider>
        </Provider>
      )
    }

    return (
      <Provider store={store}>
        <HashRouter hashType="noslash">
          <MetaMetricsProvider>
            <I18nProvider>
              <LegacyI18nProvider>
                <Routes />
              </LegacyI18nProvider>
            </I18nProvider>
          </MetaMetricsProvider>
        </HashRouter>
      </Provider>
    )
  }
}

Index.propTypes = {
  store: PropTypes.object,
}

export default Index
