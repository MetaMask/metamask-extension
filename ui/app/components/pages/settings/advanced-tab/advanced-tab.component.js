import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import validUrl from 'valid-url'
import { exportAsFile } from '../../../../util'
import ToggleButton from 'react-toggle-button'
import {SETTINGS_ROUTE, DEFAULT_ROUTE} from '../../../../routes'
import TextField from '../../../text-field'
import Button from '../../../button'

export default class AdvancedTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    setHexDataFeatureFlag: PropTypes.func,
    setRpcTarget: PropTypes.func,
    displayWarning: PropTypes.func,
    showResetAccountConfirmationModal: PropTypes.func,
    warning: PropTypes.string,
    history: PropTypes.object,
    sendHexData: PropTypes.bool,
    setAdvancedInlineGasFeatureFlag: PropTypes.func,
    advancedInlineGas: PropTypes.bool,
    showFiatInTestnets: PropTypes.bool,
    setShowFiatConversionOnTestnetsPreference: PropTypes.func.isRequired,
  }

  state = {
    newRpc: '',
    chainId: '',
    showOptions: false,
    ticker: '',
    nickname: '',
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
      this.context.metricsEvent({
        eventOpts: {
          category: 'Settings',
          action: 'Custom RPC',
          name: 'Success',
        },
        customVariables: {
          networkId: newRpc,
          chainId,
        },
      })
      if (!!chainId && Number.isNaN(parseInt(chainId))) {
        return displayWarning(`${this.context.t('invalidInput')} chainId`)
      }

      setRpcTarget(newRpc, chainId, ticker, nickname)
    } else {
      this.context.metricsEvent({
        eventOpts: {
          category: 'Settings',
          action: 'Custom RPC',
          name: 'Error',
        },
        customVariables: {
          networkId: newRpc,
          chainId,
        },
      })
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
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Settings',
                    action: 'Reset Account',
                    name: 'Reset Account',
                  },
                })
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

  renderAdvancedGasInputInline () {
    const { t } = this.context
    const { advancedInlineGas, setAdvancedInlineGasFeatureFlag } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('showAdvancedGasInline') }</span>
          <div className="settings-page__content-description">
            { t('showAdvancedGasInlineDescription') }
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={advancedInlineGas}
              onToggle={value => setAdvancedInlineGasFeatureFlag(!value)}
              activeLabel=""
              inactiveLabel=""
            />
          </div>
        </div>
      </div>
    )
  }

  renderShowConversionInTestnets () {
    const { t } = this.context
    const {
      showFiatInTestnets,
      setShowFiatConversionOnTestnetsPreference,
    } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('showFiatConversionInTestnets') }</span>
          <div className="settings-page__content-description">
            { t('showFiatConversionInTestnetsDescription') }
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={showFiatInTestnets}
              onToggle={value => setShowFiatConversionOnTestnetsPreference(!value)}
              activeLabel=""
              inactiveLabel=""
            />
          </div>
        </div>
      </div>
    )
  }

  renderContent () {
    const { warning } = this.props

    return (
      <div className="settings-page__body">
        { warning && <div className="settings-tab__error">{ warning }</div> }
        { this.renderStateLogs() }
        { this.renderResetAccount() }
        { this.renderNewRpcUrl() }
        { this.renderAdvancedGasInputInline() }
        { this.renderHexDataOptIn() }
        { this.renderShowConversionInTestnets() }
      </div>
    )
  }

  render () {
    const { t } = this.context
    const { history } = this.props

    return (
      <div className="main-container settings-page">
        <div className="settings-page__header">
          <div
            className="settings-page__back-button"
            onClick={() => history.push(SETTINGS_ROUTE)}
          />
          <div className="settings-page__header__title">
            {t('advanced')}
          </div>
          <div
            className="settings-page__close-button"
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
        </div>
        <div className="settings-page__content">
          { this.renderContent() }
        </div>
      </div>
    )
  }
}
