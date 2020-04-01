import React from 'react'
import { addDecorator, addParameters } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs/react'
import { I18nProvider, LegacyI18nProvider } from '../ui/app/contexts/i18n'
import { Provider } from 'react-redux'
import configureStore from '../ui/app/store/store'
import '../ui/app/css/index.scss'
import en from '../app/_locales/en/messages'

addParameters({
  backgrounds: [
    { name: 'light', value: '#FFFFFF'},
    { name: 'dark', value: '#333333' },
  ],
})

const styles = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const store = configureStore({
  metamask: { metamask: { currentLocale: 'en' } },

  localeMessages: {
    current: en,
    en: en,
  },
})

const metamaskDecorator = story => (
  <Provider store={store}>
    <I18nProvider>
      <LegacyI18nProvider>
        <div style={styles}>
          { story() }
        </div>
      </LegacyI18nProvider>
    </I18nProvider>
  </Provider>
)

addDecorator(withKnobs)
addDecorator(metamaskDecorator)
