import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import availableCurrencies from '../../../helpers/constants/available-conversions.json'
import SimpleDropdown from '../../../components/app/dropdowns/simple-dropdown'
import ToggleButton from '../../../components/ui/toggle-button'
import locales from '../../../../../app/_locales/index.json'

const sortedCurrencies = availableCurrencies.sort((a, b) => {
  return a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase())
})

const currencyOptions = sortedCurrencies.map(({ code, name }) => {
  return {
    displayValue: `${code.toUpperCase()} - ${name}`,
    key: code,
    value: code,
  }
})

const localeOptions = locales.map((locale) => {
  return {
    displayValue: `${locale.name}`,
    key: locale.code,
    value: locale.code,
  }
})

export default class SettingsTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    setUseBlockie: PropTypes.func,
    setCurrentCurrency: PropTypes.func,
    warning: PropTypes.string,
    updateCurrentLocale: PropTypes.func,
    currentLocale: PropTypes.string,
    useBlockie: PropTypes.bool,
    currentCurrency: PropTypes.string,
    conversionDate: PropTypes.number,
    nativeCurrency: PropTypes.string,
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
    setUseNativeCurrencyAsPrimaryCurrencyPreference: PropTypes.func,
  }

  renderCurrentConversion() {
    const { t } = this.context
    const { currentCurrency, conversionDate, setCurrentCurrency } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('currencyConversion')}</span>
          <span className="settings-page__content-description">
            {t('updatedWithDate', [Date(conversionDate)])}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <SimpleDropdown
              placeholder={t('selectCurrency')}
              options={currencyOptions}
              selectedOption={currentCurrency}
              onSelect={(newCurrency) => setCurrentCurrency(newCurrency)}
            />
          </div>
        </div>
      </div>
    )
  }

  renderCurrentLocale() {
    const { t } = this.context
    const { updateCurrentLocale, currentLocale } = this.props
    const currentLocaleMeta = locales.find(
      (locale) => locale.code === currentLocale,
    )
    const currentLocaleName = currentLocaleMeta ? currentLocaleMeta.name : ''

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span className="settings-page__content-label">
            {t('currentLanguage')}
          </span>
          <span className="settings-page__content-description">
            {currentLocaleName}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <SimpleDropdown
              placeholder={t('selectLocale')}
              options={localeOptions}
              selectedOption={currentLocale}
              onSelect={async (newLocale) => updateCurrentLocale(newLocale)}
            />
          </div>
        </div>
      </div>
    )
  }

  renderBlockieOptIn() {
    const { t } = this.context
    const { useBlockie, setUseBlockie } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{this.context.t('blockiesIdenticon')}</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useBlockie}
              onToggle={(value) => setUseBlockie(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  renderUsePrimaryCurrencyOptions() {
    const { t } = this.context
    const {
      nativeCurrency,
      setUseNativeCurrencyAsPrimaryCurrencyPreference,
      useNativeCurrencyAsPrimaryCurrency,
    } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('primaryCurrencySetting')}</span>
          <div className="settings-page__content-description">
            {t('primaryCurrencySettingDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <div className="settings-tab__radio-buttons">
              <div className="settings-tab__radio-button">
                <input
                  type="radio"
                  id="native-primary-currency"
                  onChange={() =>
                    setUseNativeCurrencyAsPrimaryCurrencyPreference(true)
                  }
                  checked={Boolean(useNativeCurrencyAsPrimaryCurrency)}
                />
                <label
                  htmlFor="native-primary-currency"
                  className="settings-tab__radio-label"
                >
                  {nativeCurrency}
                </label>
              </div>
              <div className="settings-tab__radio-button">
                <input
                  type="radio"
                  id="fiat-primary-currency"
                  onChange={() =>
                    setUseNativeCurrencyAsPrimaryCurrencyPreference(false)
                  }
                  checked={!useNativeCurrencyAsPrimaryCurrency}
                />
                <label
                  htmlFor="fiat-primary-currency"
                  className="settings-tab__radio-label"
                >
                  {t('fiat')}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { warning } = this.props

    return (
      <div className="settings-page__body">
        {warning && <div className="settings-tab__error">{warning}</div>}
        {this.renderCurrentConversion()}
        {this.renderUsePrimaryCurrencyOptions()}
        {this.renderCurrentLocale()}
        {this.renderBlockieOptIn()}
      </div>
    )
  }
}
