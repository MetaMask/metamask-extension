import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import infuraCurrencies from '../../../../infura-conversion.json'
import validUrl from 'valid-url'
import { exportAsFile } from '../../../../util'
import SimpleDropdown from '../../../dropdowns/simple-dropdown'
import ToggleButton from 'react-toggle-button'
import { REVEAL_SEED_ROUTE, MOBILE_SYNC_ROUTE } from '../../../../routes'
import locales from '../../../../../../app/_locales/index.json'
import TextField from '../../../text-field'
import Button from '../../../button'

const sortedCurrencies = infuraCurrencies.objects.sort((a, b) => {
  return a.quote.name.toLocaleLowerCase().localeCompare(b.quote.name.toLocaleLowerCase())
})

const infuraCurrencyOptions = sortedCurrencies.map(({ quote: { code, name } }) => {
  return {
    displayValue: `${code.toUpperCase()} - ${name}`,
    key: code,
    value: code,
  }
})

const localeOptions = locales.map(locale => {
  return {
    displayValue: `${locale.name}`,
    key: locale.code,
    value: locale.code,
  }
})

export default class SettingsTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    metamask: PropTypes.object,
    setUseBlockie: PropTypes.func,
    setHexDataFeatureFlag: PropTypes.func,
    setPrivacyMode: PropTypes.func,
    privacyMode: PropTypes.bool,
    setCurrentCurrency: PropTypes.func,
    setRpcTarget: PropTypes.func,
    delRpcTarget: PropTypes.func,
    displayWarning: PropTypes.func,
    revealSeedConfirmation: PropTypes.func,
    setFeatureFlagToBeta: PropTypes.func,
    showClearApprovalModal: PropTypes.func,
    showResetAccountConfirmationModal: PropTypes.func,
    warning: PropTypes.string,
    history: PropTypes.object,
    isMascara: PropTypes.bool,
    updateCurrentLocale: PropTypes.func,
    currentLocale: PropTypes.string,
    useBlockie: PropTypes.bool,
    sendHexData: PropTypes.bool,
    currentCurrency: PropTypes.string,
    conversionDate: PropTypes.number,
    nativeCurrency: PropTypes.string,
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
    setUseNativeCurrencyAsPrimaryCurrencyPreference: PropTypes.func,
  }

  state = {
    newRpc: '',
    chainId: '',
    showOptions: false,
    ticker: '',
    nickname: '',
  }

  renderCurrentConversion () {
    const { t } = this.context
    const { currentCurrency, conversionDate, setCurrentCurrency } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('currentConversion') }</span>
          <span className="settings-page__content-description">
            { t('updatedWithDate', [Date(conversionDate)]) }
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <SimpleDropdown
              placeholder={t('selectCurrency')}
              options={infuraCurrencyOptions}
              selectedOption={currentCurrency}
              onSelect={newCurrency => setCurrentCurrency(newCurrency)}
            />
          </div>
        </div>
      </div>
    )
  }

  renderCurrentLocale () {
    const { t } = this.context
    const { updateCurrentLocale, currentLocale } = this.props
    const currentLocaleMeta = locales.find(locale => locale.code === currentLocale)
    const currentLocaleName = currentLocaleMeta ? currentLocaleMeta.name : ''

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span className="settings-page__content-label">
            { t('currentLanguage') }
          </span>
          <span className="settings-page__content-description">
            { currentLocaleName }
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <SimpleDropdown
              placeholder={t('selectLocale')}
              options={localeOptions}
              selectedOption={currentLocale}
              onSelect={async newLocale => updateCurrentLocale(newLocale)}
            />
          </div>
        </div>
      </div>
    )
  }

  renderNewRpcUrl () {
    const { t } = this.context
    const { newRpc, chainId, ticker, nickname } = this.state

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('newNetwork') }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="text"
              id="new-rpc"
              placeholder={t('rpcURL')}
              value={newRpc}
              onChange={e => this.setState({ newRpc: e.target.value })}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  this.validateRpc(newRpc, chainId, ticker, nickname)
                }
              }}
              fullWidth
              margin="dense"
            />
            <TextField
              type="text"
              id="chainid"
              placeholder={t('optionalChainId')}
              value={chainId}
              onChange={e => this.setState({ chainId: e.target.value })}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  this.validateRpc(newRpc, chainId, ticker, nickname)
                }
              }}
              style={{
                display: this.state.showOptions ? null : 'none',
              }}
              fullWidth
              margin="dense"
            />
            <TextField
              type="text"
              id="ticker"
              placeholder={t('optionalSymbol')}
              value={ticker}
              onChange={e => this.setState({ ticker: e.target.value })}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  this.validateRpc(newRpc, chainId, ticker, nickname)
                }
              }}
              style={{
                display: this.state.showOptions ? null : 'none',
              }}
              fullWidth
              margin="dense"
            />
            <TextField
              type="text"
              id="nickname"
              placeholder={t('optionalNickname')}
              value={nickname}
              onChange={e => this.setState({ nickname: e.target.value })}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  this.validateRpc(newRpc, chainId, ticker, nickname)
                }
              }}
              style={{
                display: this.state.showOptions ? null : 'none',
              }}
              fullWidth
              margin="dense"
            />
            <div className="flex-row flex-align-center space-between">
              <span className="settings-tab__advanced-link"
                onClick={e => {
                  e.preventDefault()
                  this.setState({ showOptions: !this.state.showOptions })
                }}
              >
                { t(this.state.showOptions ? 'hideAdvancedOptions' : 'showAdvancedOptions') }
              </span>
              <button
                className="button btn-primary settings-tab__rpc-save-button"
                onClick={e => {
                  e.preventDefault()
                  this.validateRpc(newRpc, chainId, ticker, nickname)
                }}
              >
                { t('save') }
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  validateRpc (newRpc, chainId, ticker = 'ETH', nickname) {
    const { setRpcTarget, displayWarning } = this.props

    if (validUrl.isWebUri(newRpc)) {
      setRpcTarget(newRpc, chainId, ticker, nickname)
    } else {
      const appendedRpc = `http://${newRpc}`

      if (validUrl.isWebUri(appendedRpc)) {
        displayWarning(this.context.t('uriErrorMsg'))
      } else {
        displayWarning(this.context.t('invalidRPC'))
      }
    }
  }

  renderStateLogs () {
    const { t } = this.context
    const { displayWarning } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('stateLogs') }</span>
          <span className="settings-page__content-description">
            { t('stateLogsDescription') }
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="primary"
              large
              onClick={() => {
                window.logStateString((err, result) => {
                  if (err) {
                    displayWarning(t('stateLogError'))
                  } else {
                    exportAsFile('MetaMask State Logs.json', result)
                  }
                })
              }}
            >
              { t('downloadStateLogs') }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderClearApproval () {
    const { t } = this.context
    const { showClearApprovalModal } = this.props
    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('approvalData') }</span>
          <span className="settings-page__content-description">
            { t('approvalDataDescription') }
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
              large
              className="settings-tab__button--orange"
              onClick={event => {
                event.preventDefault()
                showClearApprovalModal()
              }}
            >
              { t('clearApprovalData') }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderSeedWords () {
    const { t } = this.context
    const { history } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('revealSeedWords') }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
              large
              onClick={event => {
                event.preventDefault()
                history.push(REVEAL_SEED_ROUTE)
              }}
            >
              { t('revealSeedWords') }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderMobileSync () {
    const { t } = this.context
    const { history } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('syncWithMobile') }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="primary"
              large
              onClick={event => {
                event.preventDefault()
                history.push(MOBILE_SYNC_ROUTE)
              }}
            >
              { t('syncWithMobile') }
            </Button>
          </div>
        </div>
      </div>
    )
  }


  renderOldUI () {
    const { t } = this.context
    const { setFeatureFlagToBeta } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('useOldUI') }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
              large
              className="settings-tab__button--orange"
              onClick={event => {
                event.preventDefault()
                setFeatureFlagToBeta()
              }}
            >
              { t('useOldUI') }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderResetAccount () {
    const { t } = this.context
    const { showResetAccountConfirmationModal } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('resetAccount') }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
              large
              className="settings-tab__button--orange"
              onClick={event => {
                event.preventDefault()
                showResetAccountConfirmationModal()
              }}
            >
              { t('resetAccount') }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderBlockieOptIn () {
    const { useBlockie, setUseBlockie } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ this.context.t('blockiesIdenticon') }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useBlockie}
              onToggle={value => setUseBlockie(!value)}
              activeLabel=""
              inactiveLabel=""
            />
          </div>
        </div>
      </div>
    )
  }

  renderHexDataOptIn () {
    const { t } = this.context
    const { sendHexData, setHexDataFeatureFlag } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('showHexData') }</span>
          <div className="settings-page__content-description">
            { t('showHexDataDescription') }
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={sendHexData}
              onToggle={value => setHexDataFeatureFlag(!value)}
              activeLabel=""
              inactiveLabel=""
            />
          </div>
        </div>
      </div>
    )
  }

  renderUsePrimaryCurrencyOptions () {
    const { t } = this.context
    const {
      nativeCurrency,
      setUseNativeCurrencyAsPrimaryCurrencyPreference,
      useNativeCurrencyAsPrimaryCurrency,
    } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('primaryCurrencySetting') }</span>
          <div className="settings-page__content-description">
            { t('primaryCurrencySettingDescription') }
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <div className="settings-tab__radio-buttons">
              <div className="settings-tab__radio-button">
                <input
                  type="radio"
                  id="native-primary-currency"
                  onChange={() => setUseNativeCurrencyAsPrimaryCurrencyPreference(true)}
                  checked={Boolean(useNativeCurrencyAsPrimaryCurrency)}
                />
                <label
                  htmlFor="native-primary-currency"
                  className="settings-tab__radio-label"
                >
                  { nativeCurrency }
                </label>
              </div>
              <div className="settings-tab__radio-button">
                <input
                  type="radio"
                  id="fiat-primary-currency"
                  onChange={() => setUseNativeCurrencyAsPrimaryCurrencyPreference(false)}
                  checked={!useNativeCurrencyAsPrimaryCurrency}
                />
                <label
                  htmlFor="fiat-primary-currency"
                  className="settings-tab__radio-label"
                >
                  { t('fiat') }
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderPrivacyOptIn () {
    const { t } = this.context
    const { privacyMode, setPrivacyMode } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('privacyMode') }</span>
          <div className="settings-page__content-description">
            { t('privacyModeDescription') }
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={privacyMode}
              onToggle={value => setPrivacyMode(!value)}
              activeLabel=""
              inactiveLabel=""
            />
          </div>
        </div>
      </div>
    )
  }

  render () {
    const { warning, isMascara } = this.props

    return (
      <div className="settings-page__content">
        { warning && <div className="settings-tab__error">{ warning }</div> }
        { this.renderCurrentConversion() }
        { this.renderUsePrimaryCurrencyOptions() }
        { this.renderCurrentLocale() }
        { this.renderNewRpcUrl() }
        { this.renderStateLogs() }
        { this.renderSeedWords() }
        { this.renderMobileSync() }
        { !isMascara && this.renderOldUI() }
        { this.renderResetAccount() }
        { this.renderClearApproval() }
        { this.renderPrivacyOptIn() }
        { this.renderHexDataOptIn() }
        { this.renderBlockieOptIn() }
      </div>
    )
  }
}
