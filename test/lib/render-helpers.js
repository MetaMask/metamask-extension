import React from 'react'
import { Provider } from 'react-redux'
import { render } from '@testing-library/react'
import { mount } from 'enzyme'
import { MemoryRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { LegacyI18nProvider } from '../../ui/app/contexts/i18n'
import { LegacyMetaMetricsProvider } from '../../ui/app/contexts/metametrics'

export function mountWithRouter (component, store = {}, pathname = '/') {

  // Instantiate router context
  const router = {
    history: new MemoryRouter().history,
    route: {
      location: {
        pathname,
      },
      match: {},
    },
  }

  const createContext = () => ({
    context: {
      router,
      t: (str) => str,
      metricsEvent: () => undefined,
      store,
    },
    childContextTypes: {
      router: PropTypes.object,
      t: PropTypes.func,
      metricsEvent: PropTypes.func,
      store: PropTypes.object,
    },
  })

  const Wrapper = () => (
    <MemoryRouter initialEntries={[{ pathname }]} initialIndex={0}>
      {component}
    </MemoryRouter>
  )

  return mount(<Wrapper />, createContext())
}

export default function renderWithProvider (component, store) {

  const Wrapper = () => (
    store ? (
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']} initialIndex={0}>
          <LegacyMetaMetricsProvider>
            <LegacyI18nProvider>
              { component }
            </LegacyI18nProvider>
          </LegacyMetaMetricsProvider>
        </MemoryRouter>
      </Provider>
    ) : (
      <LegacyMetaMetricsProvider>
        <LegacyI18nProvider>
          { component }
        </LegacyI18nProvider>
      </LegacyMetaMetricsProvider>
    )
  )

  return render(<Wrapper />)
}
