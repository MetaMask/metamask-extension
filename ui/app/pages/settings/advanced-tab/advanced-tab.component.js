import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { exportAsFile } from '../../../helpers/utils/util'
import ToggleButton from '../../../components/ui/toggle-button'
import TextField from '../../../components/ui/text-field'
import Button from '../../../components/ui/button'
import { MOBILE_SYNC_ROUTE } from '../../../helpers/constants/routes'

export default class AdvancedTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    setUseNonceField: PropTypes.func,
    useNonceField: PropTypes.bool,
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
    autoLogoutTimeLimit: PropTypes.number,
    setAutoLogoutTimeLimit: PropTypes.func.isRequired,
    setShowFiatConversionOnTestnetsPreference: PropTypes.func.isRequired,
    threeBoxSyncingAllowed: PropTypes.bool.isRequired,
    setThreeBoxSyncingPermission: PropTypes.func.isRequired,
    threeBoxDisabled: PropTypes.bool.isRequired,
  }

  state = { autoLogoutTimeLimit: this.props.autoLogoutTimeLimit }

  renderMobileSync () {
    const { t } = this.context
    const { history } = this.props
    //
    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('syncWithMobile') }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
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
              type="secondary"
              large
              onClick={() => {
                window.logStateString((err, result) => {
                  if (err) {
                    displayWarning(t('stateLogError'))
                  } else {
                    exportAsFile(`${t('stateLogFileName')}.json`, result)
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
              type="warning"
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
              offLabel={t('off')}
              onLabel={t('on')}
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
              offLabel={t('off')}
              onLabel={t('on')}
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
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  renderUseNonceOptIn () {
    const { t } = this.context
    const { useNonceField, setUseNonceField } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ this.context.t('nonceField') }</span>
          <div className="settings-page__content-description">
            { t('nonceFieldDescription') }
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useNonceField}
              onToggle={value => setUseNonceField(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  renderAutoLogoutTimeLimit () {
    const { t } = this.context
    const {
      autoLogoutTimeLimit,
      setAutoLogoutTimeLimit,
    } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('autoLogoutTimeLimit') }</span>
          <div className="settings-page__content-description">
            { t('autoLogoutTimeLimitDescription') }
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="number"
              id="autoTimeout"
              placeholder="5"
              value={this.state.autoLogoutTimeLimit}
              defaultValue={autoLogoutTimeLimit}
              onChange={e => this.setState({ autoLogoutTimeLimit: Math.max(Number(e.target.value), 0) })}
              fullWidth
              margin="dense"
              min={0}
            />
            <button
              className="button btn-primary settings-tab__rpc-save-button"
              onClick={() => {
                setAutoLogoutTimeLimit(this.state.autoLogoutTimeLimit)
              }}
            >
              { t('save') }
            </button>
          </div>
        </div>
      </div>
    )
  }

  renderThreeBoxControl () {
    const { t } = this.context
    const {
      threeBoxSyncingAllowed,
      setThreeBoxSyncingPermission,
      threeBoxDisabled,
    } = this.props

    let allowed = threeBoxSyncingAllowed
    let description = t('syncWithThreeBoxDescription')

    if (threeBoxDisabled) {
      allowed = false
      description = t('syncWithThreeBoxDisabled')
    }
    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('syncWithThreeBox') }</span>
          <div className="settings-page__content-description">
            { description }
          </div>
        </div>
        <div
          className={classnames('settings-page__content-item', {
            'settings-page__content-item--disabled': threeBoxDisabled,
          })}
        >
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={allowed}
              onToggle={value => {
                if (!threeBoxDisabled) {
                  setThreeBoxSyncingPermission(!value)
                }
              }}
              offLabel={t('off')}
              onLabel={t('on')}
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
        { this.renderMobileSync() }
        { this.renderResetAccount() }
        { this.renderAdvancedGasInputInline() }
        { this.renderHexDataOptIn() }
        { this.renderShowConversionInTestnets() }
        { this.renderUseNonceOptIn() }
        { this.renderAutoLogoutTimeLimit() }
        { this.renderThreeBoxControl() }
      </div>
    )
  }

  render () {
    return this.renderContent()
  }
}
