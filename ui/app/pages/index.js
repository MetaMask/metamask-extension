import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import * as Sentry from '@sentry/browser'
import ErrorPage from './error'
import Routes from './routes'
import { I18nProvider, LegacyI18nProvider } from '../contexts/i18n'
import { MetaMetricsProvider, LegacyMetaMetricsProvider } from '../contexts/metametrics'
import { ThemeProvider, Typography } from '@material-ui/core'
import theme from '../helpers/constants/theme'

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
        <ThemeProvider theme={theme}>
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
        </ThemeProvider>
      )
    }

    return (
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <HashRouter hashType="noslash">
            <MetaMetricsProvider>
              <LegacyMetaMetricsProvider>
                <I18nProvider>
                  <LegacyI18nProvider>
                    <Routes />
                    <Typography variant="h7">test</Typography>
                  </LegacyI18nProvider>
                </I18nProvider>
              </LegacyMetaMetricsProvider>
            </MetaMetricsProvider>
          </HashRouter>
        </Provider>
      </ThemeProvider>
    )
  }
}

Index.propTypes = {
  store: PropTypes.object,
}

export default Index
