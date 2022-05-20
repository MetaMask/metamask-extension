import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { exportAsFile } from '../../../helpers/utils/util';
import ToggleButton from '../../../components/ui/toggle-button';
import TextField from '../../../components/ui/text-field';
import Button from '../../../components/ui/button';
import { MOBILE_SYNC_ROUTE } from '../../../helpers/constants/routes';
import Dropdown from '../../../components/ui/dropdown';
import Dialog from '../../../components/ui/dialog';

import { getPlatform } from '../../../../app/scripts/lib/util';

import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';

import {
  LEDGER_TRANSPORT_TYPES,
  LEDGER_USB_VENDOR_ID,
} from '../../../../shared/constants/hardware-wallets';
import { EVENT } from '../../../../shared/constants/metametrics';

export default class AdvancedTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    setUseNonceField: PropTypes.func,
    useNonceField: PropTypes.bool,
    setHexDataFeatureFlag: PropTypes.func,
    displayWarning: PropTypes.func,
    showResetAccountConfirmationModal: PropTypes.func,
    warning: PropTypes.string,
    history: PropTypes.object,
    sendHexData: PropTypes.bool,
    setAdvancedInlineGasFeatureFlag: PropTypes.func,
    advancedInlineGas: PropTypes.bool,
    showFiatInTestnets: PropTypes.bool,
    showTestNetworks: PropTypes.bool,
    autoLockTimeLimit: PropTypes.number,
    setAutoLockTimeLimit: PropTypes.func.isRequired,
    setShowFiatConversionOnTestnetsPreference: PropTypes.func.isRequired,
    setShowTestNetworks: PropTypes.func.isRequired,
    threeBoxSyncingAllowed: PropTypes.bool.isRequired,
    setThreeBoxSyncingPermission: PropTypes.func.isRequired,
    threeBoxDisabled: PropTypes.bool.isRequired,
    setIpfsGateway: PropTypes.func.isRequired,
    ipfsGateway: PropTypes.string.isRequired,
    ledgerTransportType: PropTypes.oneOf(Object.values(LEDGER_TRANSPORT_TYPES)),
    setLedgerTransportPreference: PropTypes.func.isRequired,
    setDismissSeedBackUpReminder: PropTypes.func.isRequired,
    dismissSeedBackUpReminder: PropTypes.bool.isRequired,
    userHasALedgerAccount: PropTypes.bool.isRequired,
    useTokenDetection: PropTypes.bool.isRequired,
    setUseTokenDetection: PropTypes.func.isRequired,
  };

  state = {
    autoLockTimeLimit: this.props.autoLockTimeLimit,
    lockTimeError: '',
    ipfsGateway: this.props.ipfsGateway,
    ipfsGatewayError: '',
    showLedgerTransportWarning: false,
  };

  settingsRefs = Array(
    getNumberOfSettingsInSection(this.context.t, this.context.t('advanced')),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('advanced'), this.settingsRefs);
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('advanced'), this.settingsRefs);
  }

  renderMobileSync() {
    const { t } = this.context;
    const { history } = this.props;

    return (
      <div
        ref={this.settingsRefs[1]}
        className="settings-page__content-row"
        data-testid="advanced-setting-mobile-sync"
      >
        <div className="settings-page__content-item">
          <span>{t('syncWithMobile')}</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
              large
              onClick={(event) => {
                event.preventDefault();
                history.push(MOBILE_SYNC_ROUTE);
              }}
            >
              {t('syncWithMobile')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderStateLogs() {
    const { t } = this.context;
    const { displayWarning } = this.props;

    return (
      <div
        ref={this.settingsRefs[0]}
        className="settings-page__content-row"
        data-testid="advanced-setting-state-logs"
      >
        <div className="settings-page__content-item">
          <span>{t('stateLogs')}</span>
          <span className="settings-page__content-description">
            {t('stateLogsDescription')}
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
                    displayWarning(t('stateLogError'));
                  } else {
                    exportAsFile(`${t('stateLogFileName')}.json`, result);
                  }
                });
              }}
            >
              {t('downloadStateLogs')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderResetAccount() {
    const { t } = this.context;
    const { showResetAccountConfirmationModal } = this.props;

    return (
      <div
        ref={this.settingsRefs[2]}
        className="settings-page__content-row"
        data-testid="advanced-setting-reset-account"
      >
        <div className="settings-page__content-item">
          <span>{t('resetAccount')}</span>
          <span className="settings-page__content-description">
            {t('resetAccountDescription')}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="danger"
              large
              className="settings-tab__button--red"
              onClick={(event) => {
                event.preventDefault();
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.SETTINGS,
                  event: 'Reset Account',
                  properties: {
                    action: 'Reset Account',
                    legacy_event: true,
                  },
                });
                showResetAccountConfirmationModal();
              }}
            >
              {t('resetAccount')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderHexDataOptIn() {
    const { t } = this.context;
    const { sendHexData, setHexDataFeatureFlag } = this.props;

    return (
      <div
        ref={this.settingsRefs[4]}
        className="settings-page__content-row"
        data-testid="advanced-setting-hex-data"
      >
        <div className="settings-page__content-item">
          <span>{t('showHexData')}</span>
          <div className="settings-page__content-description">
            {t('showHexDataDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={sendHexData}
              onToggle={(value) => setHexDataFeatureFlag(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderAdvancedGasInputInline() {
    const { t } = this.context;
    const { advancedInlineGas, setAdvancedInlineGasFeatureFlag } = this.props;

    return (
      <div
        ref={this.settingsRefs[3]}
        className="settings-page__content-row"
        data-testid="advanced-setting-advanced-gas-inline"
      >
        <div className="settings-page__content-item">
          <span>{t('showAdvancedGasInline')}</span>
          <div className="settings-page__content-description">
            {t('showAdvancedGasInlineDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={advancedInlineGas}
              onToggle={(value) => setAdvancedInlineGasFeatureFlag(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderToggleTestNetworks() {
    const { t } = this.context;
    const { showTestNetworks, setShowTestNetworks } = this.props;

    return (
      <div
        ref={this.settingsRefs[6]}
        className="settings-page__content-row"
        data-testid="advanced-setting-show-testnet-conversion"
      >
        <div className="settings-page__content-item">
          <span>{t('showTestnetNetworks')}</span>
          <div className="settings-page__content-description">
            {t('showTestnetNetworksDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={showTestNetworks}
              onToggle={(value) => setShowTestNetworks(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderShowConversionInTestnets() {
    const { t } = this.context;
    const {
      showFiatInTestnets,
      setShowFiatConversionOnTestnetsPreference,
    } = this.props;

    return (
      <div
        ref={this.settingsRefs[5]}
        className="settings-page__content-row"
        data-testid="advanced-setting-show-testnet-conversion"
      >
        <div className="settings-page__content-item">
          <span>{t('showFiatConversionInTestnets')}</span>
          <div className="settings-page__content-description">
            {t('showFiatConversionInTestnetsDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={showFiatInTestnets}
              onToggle={(value) =>
                setShowFiatConversionOnTestnetsPreference(!value)
              }
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderUseNonceOptIn() {
    const { t } = this.context;
    const { useNonceField, setUseNonceField } = this.props;

    return (
      <div
        ref={this.settingsRefs[7]}
        className="settings-page__content-row"
        data-testid="advanced-setting-custom-nonce"
      >
        <div className="settings-page__content-item">
          <span>{t('nonceField')}</span>
          <div className="settings-page__content-description">
            {t('nonceFieldDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useNonceField}
              onToggle={(value) => setUseNonceField(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  handleLockChange(time) {
    const { t } = this.context;
    const autoLockTimeLimit = Math.max(Number(time), 0);

    this.setState(() => {
      let lockTimeError = '';

      if (autoLockTimeLimit > 10080) {
        lockTimeError = t('lockTimeTooGreat');
      }

      return {
        autoLockTimeLimit,
        lockTimeError,
      };
    });
  }

  renderAutoLockTimeLimit() {
    const { t } = this.context;
    const { lockTimeError } = this.state;
    const { setAutoLockTimeLimit } = this.props;

    return (
      <div
        ref={this.settingsRefs[8]}
        className="settings-page__content-row"
        data-testid="advanced-setting-auto-lock"
      >
        <div className="settings-page__content-item">
          <span>{t('autoLockTimeLimit')}</span>
          <div className="settings-page__content-description">
            {t('autoLockTimeLimitDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="number"
              id="autoTimeout"
              placeholder="5"
              value={this.state.autoLockTimeLimit}
              onChange={(e) => this.handleLockChange(e.target.value)}
              error={lockTimeError}
              fullWidth
              margin="dense"
              min={0}
            />
            <Button
              type="primary"
              className="settings-tab__rpc-save-button"
              disabled={lockTimeError !== ''}
              onClick={() => {
                setAutoLockTimeLimit(this.state.autoLockTimeLimit);
              }}
            >
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderThreeBoxControl() {
    const { t } = this.context;
    const {
      threeBoxSyncingAllowed,
      setThreeBoxSyncingPermission,
      threeBoxDisabled,
    } = this.props;

    let allowed = threeBoxSyncingAllowed;
    let description = t('syncWithThreeBoxDescription');

    if (threeBoxDisabled) {
      allowed = false;
      description = t('syncWithThreeBoxDisabled');
    }
    return (
      <div
        ref={this.settingsRefs[9]}
        className="settings-page__content-row"
        data-testid="advanced-setting-3box"
      >
        <div className="settings-page__content-item">
          <span>{t('syncWithThreeBox')}</span>
          <div className="settings-page__content-description">
            {description}
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
              onToggle={(value) => {
                if (!threeBoxDisabled) {
                  setThreeBoxSyncingPermission(!value);
                }
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderLedgerLiveControl() {
    const { t } = this.context;
    const {
      ledgerTransportType,
      setLedgerTransportPreference,
      userHasALedgerAccount,
    } = this.props;

    const LEDGER_TRANSPORT_NAMES = {
      LIVE: t('ledgerLive'),
      WEBHID: t('webhid'),
      U2F: t('u2f'),
    };

    const transportTypeOptions = [
      {
        name: LEDGER_TRANSPORT_NAMES.LIVE,
        value: LEDGER_TRANSPORT_TYPES.LIVE,
      },
      {
        name: LEDGER_TRANSPORT_NAMES.U2F,
        value: LEDGER_TRANSPORT_TYPES.U2F,
      },
    ];

    if (window.navigator.hid) {
      transportTypeOptions.push({
        name: LEDGER_TRANSPORT_NAMES.WEBHID,
        value: LEDGER_TRANSPORT_TYPES.WEBHID,
      });
    }

    const recommendedLedgerOption = window.navigator.hid
      ? LEDGER_TRANSPORT_NAMES.WEBHID
      : LEDGER_TRANSPORT_NAMES.U2F;

    return (
      <div ref={this.settingsRefs[11]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('preferredLedgerConnectionType')}</span>
          <div className="settings-page__content-description">
            {t('ledgerConnectionPreferenceDescription', [
              recommendedLedgerOption,
              <Button
                key="ledger-connection-settings-learn-more"
                type="link"
                href="https://metamask.zendesk.com/hc/en-us/articles/360020394612-How-to-connect-a-Trezor-or-Ledger-Hardware-Wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="settings-page__inline-link"
              >
                {t('learnMore')}
              </Button>,
            ])}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Dropdown
              id="select-ledger-transport-type"
              options={transportTypeOptions}
              selectedOption={ledgerTransportType}
              onChange={async (transportType) => {
                if (
                  ledgerTransportType === LEDGER_TRANSPORT_TYPES.LIVE &&
                  transportType === LEDGER_TRANSPORT_TYPES.WEBHID
                ) {
                  this.setState({ showLedgerTransportWarning: true });
                }
                setLedgerTransportPreference(transportType);
                if (
                  transportType === LEDGER_TRANSPORT_TYPES.WEBHID &&
                  userHasALedgerAccount
                ) {
                  await window.navigator.hid.requestDevice({
                    filters: [{ vendorId: LEDGER_USB_VENDOR_ID }],
                  });
                }
              }}
            />
            {this.state.showLedgerTransportWarning ? (
              <Dialog type="message">
                <div className="settings-page__content-item-dialog">
                  {t('ledgerTransportChangeWarning')}
                </div>
              </Dialog>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  handleIpfsGatewayChange(url) {
    const { t } = this.context;

    this.setState(() => {
      let ipfsGatewayError = '';

      try {
        const urlObj = new URL(addUrlProtocolPrefix(url));
        if (!urlObj.host) {
          throw new Error();
        }

        // don't allow the use of this gateway
        if (urlObj.host === 'gateway.ipfs.io') {
          throw new Error('Forbidden gateway');
        }
      } catch (error) {
        ipfsGatewayError =
          error.message === 'Forbidden gateway'
            ? t('forbiddenIpfsGateway')
            : t('invalidIpfsGateway');
      }

      return {
        ipfsGateway: url,
        ipfsGatewayError,
      };
    });
  }

  handleIpfsGatewaySave() {
    const url = new URL(addUrlProtocolPrefix(this.state.ipfsGateway));
    const { host } = url;

    this.props.setIpfsGateway(host);
  }

  renderIpfsGatewayControl() {
    const { t } = this.context;
    const { ipfsGatewayError } = this.state;

    return (
      <div
        ref={this.settingsRefs[10]}
        className="settings-page__content-row"
        data-testid="advanced-setting-ipfs-gateway"
      >
        <div className="settings-page__content-item">
          <span>{t('ipfsGateway')}</span>
          <div className="settings-page__content-description">
            {t('ipfsGatewayDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="text"
              value={this.state.ipfsGateway}
              onChange={(e) => this.handleIpfsGatewayChange(e.target.value)}
              error={ipfsGatewayError}
              fullWidth
              margin="dense"
            />
            <Button
              type="primary"
              className="settings-tab__rpc-save-button"
              disabled={Boolean(ipfsGatewayError)}
              onClick={() => {
                this.handleIpfsGatewaySave();
              }}
            >
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderDismissSeedBackupReminderControl() {
    const { t } = this.context;
    const {
      dismissSeedBackUpReminder,
      setDismissSeedBackUpReminder,
    } = this.props;

    return (
      <div
        ref={this.settingsRefs[12]}
        className="settings-page__content-row"
        data-testid="advanced-setting-dismiss-reminder"
      >
        <div className="settings-page__content-item">
          <span>{t('dismissReminderField')}</span>
          <div className="settings-page__content-description">
            {t('dismissReminderDescriptionField')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={dismissSeedBackUpReminder}
              onToggle={(value) => setDismissSeedBackUpReminder(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderTokenDetectionToggle() {
    if (!process.env.TOKEN_DETECTION_V2) {
      return null;
    }

    const { t } = this.context;
    const { useTokenDetection, setUseTokenDetection } = this.props;

    return (
      <div
        ref={this.settingsRefs[13]}
        className="settings-page__content-row"
        data-testid="advanced-setting-token-detection"
      >
        <div className="settings-page__content-item">
          <span>{t('tokenDetection')}</span>
          <div className="settings-page__content-description">
            {t('tokenDetectionToggleDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useTokenDetection}
              onToggle={(value) => {
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.SETTINGS,
                  event: 'Token Detection',
                  properties: {
                    action: 'Token Detection',
                    legacy_event: true,
                  },
                });
                setUseTokenDetection(!value);
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { warning } = this.props;

    const notUsingFirefox = getPlatform() !== PLATFORM_FIREFOX;

    return (
      <div className="settings-page__body">
        {warning ? <div className="settings-tab__error">{warning}</div> : null}
        {this.renderStateLogs()}
        {this.renderMobileSync()}
        {this.renderResetAccount()}
        {this.renderAdvancedGasInputInline()}
        {this.renderTokenDetectionToggle()}
        {this.renderHexDataOptIn()}
        {this.renderShowConversionInTestnets()}
        {this.renderToggleTestNetworks()}
        {this.renderUseNonceOptIn()}
        {this.renderAutoLockTimeLimit()}
        {this.renderThreeBoxControl()}
        {this.renderIpfsGatewayControl()}
        {notUsingFirefox ? this.renderLedgerLiveControl() : null}
        {this.renderDismissSeedBackupReminderControl()}
      </div>
    );
  }
}

function addUrlProtocolPrefix(urlString) {
  if (!urlString.match(/(^http:\/\/)|(^https:\/\/)/u)) {
    return `https://${urlString}`;
  }
  return urlString;
}
