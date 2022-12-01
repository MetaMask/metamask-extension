import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
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
import { addUrlProtocolPrefix } from '../../../helpers/utils/ipfs';

import {
  LEDGER_TRANSPORT_TYPES,
  LEDGER_USB_VENDOR_ID,
} from '../../../../shared/constants/hardware-wallets';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import { exportAsFile } from '../../../helpers/utils/export-utils';
import ActionableMessage from '../../../components/ui/actionable-message';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

const CORRUPT_JSON_FILE = 'CORRUPT_JSON_FILE';

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
    ledgerTransportType: PropTypes.oneOf(Object.values(LEDGER_TRANSPORT_TYPES)),
    setLedgerTransportPreference: PropTypes.func.isRequired,
    setDismissSeedBackUpReminder: PropTypes.func.isRequired,
    dismissSeedBackUpReminder: PropTypes.bool.isRequired,
    userHasALedgerAccount: PropTypes.bool.isRequired,
    backupUserData: PropTypes.func.isRequired,
    restoreUserData: PropTypes.func.isRequired,
  };

  state = {
    autoLockTimeLimit: this.props.autoLockTimeLimit,
    lockTimeError: '',
    showLedgerTransportWarning: false,
    showResultMessage: false,
    restoreSuccessful: true,
    restoreMessage: null,
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

  async getTextFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        resolve(text);
      };

      reader.onerror = (e) => {
        reject(e);
      };

      reader.readAsText(file);
    });
  }

  async handleFileUpload(event) {
    /**
     * we need this to be able to access event.target after
     * the event handler has been called. [Synthetic Event Pooling, pre React 17]
     *
     * @see https://fb.me/react-event-pooling
     */
    event.persist();
    const file = event.target.files[0];
    const jsonString = await this.getTextFromFile(file);
    /**
     * so that we can restore same file again if we want to.
     * chrome blocks uploading same file twice.
     */
    event.target.value = '';
    try {
      const result = await this.props.restoreUserData(jsonString);
      this.setState({
        showResultMessage: true,
        restoreSuccessful: result,
        restoreMessage: null,
      });
    } catch (e) {
      if (e.message.match(/Unexpected.+JSON/iu)) {
        this.setState({
          showResultMessage: true,
          restoreSuccessful: false,
          restoreMessage: CORRUPT_JSON_FILE,
        });
      }
    }
  }

  backupUserData = async () => {
    const { fileName, data } = await this.props.backupUserData();
    exportAsFile(fileName, data);

    this.context.trackEvent({
      event: 'User Data Exported',
      category: 'Backup',
      properties: {},
    });
  };

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
                  event: EVENT_NAMES.ACCOUNT_RESET,
                  properties: {},
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

  renderShowConversionInTestnets() {
    const { t } = this.context;
    const { showFiatInTestnets, setShowFiatConversionOnTestnetsPreference } =
      this.props;

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
              data-testid="auto-lockout-time"
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
              data-testid="auto-lockout-button"
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
      <div ref={this.settingsRefs[9]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('preferredLedgerConnectionType')}</span>
          <div className="settings-page__content-description">
            {t('ledgerConnectionPreferenceDescription', [
              recommendedLedgerOption,
              <Button
                key="ledger-connection-settings-learn-more"
                type="link"
                href={ZENDESK_URLS.HARDWARE_CONNECTION}
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

  renderDismissSeedBackupReminderControl() {
    const { t } = this.context;
    const { dismissSeedBackUpReminder, setDismissSeedBackUpReminder } =
      this.props;

    return (
      <div
        ref={this.settingsRefs[10]}
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

  renderUserDataBackup() {
    const { t } = this.context;
    return (
      <div
        ref={this.settingsRefs[11]}
        className="settings-page__content-row"
        data-testid="advanced-setting-data-backup"
      >
        <div className="settings-page__content-item">
          <span>{t('backupUserData')}</span>
          <span className="settings-page__content-description">
            {t('backupUserDataDescription')}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              data-testid="backup-button"
              type="secondary"
              large
              onClick={() => this.backupUserData()}
            >
              {t('backup')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderRestoreUserData() {
    const { t } = this.context;
    const { showResultMessage, restoreSuccessful, restoreMessage } = this.state;

    const defaultRestoreMessage = restoreSuccessful
      ? t('restoreSuccessful')
      : t('restoreFailed');
    const restoreMessageToRender =
      restoreMessage === CORRUPT_JSON_FILE
        ? t('dataBackupSeemsCorrupt')
        : defaultRestoreMessage;

    return (
      <div
        ref={this.settingsRefs[12]}
        className="settings-page__content-row"
        data-testid="advanced-setting-data-restore"
      >
        <div className="settings-page__content-item">
          <span>{t('restoreUserData')}</span>
          <span className="settings-page__content-description">
            {t('restoreUserDataDescription')}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <label
              htmlFor="restore-file"
              className="button btn btn--rounded btn-secondary btn--large settings-page__button"
            >
              {t('restore')}
            </label>
            <input
              id="restore-file"
              data-testid="restore-file"
              style={{ visibility: 'hidden' }}
              type="file"
              accept=".json"
              onChange={(e) => this.handleFileUpload(e)}
            />
          </div>
          {showResultMessage && (
            <ActionableMessage
              type={restoreSuccessful ? 'success' : 'danger'}
              message={restoreMessageToRender}
              primaryActionV2={{
                label: t('dismiss'),
                onClick: () => {
                  this.setState({
                    showResultMessage: false,
                    restoreSuccessful: true,
                    restoreMessage: null,
                  });
                },
              }}
            />
          )}
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
        {this.renderHexDataOptIn()}
        {this.renderShowConversionInTestnets()}
        {this.renderToggleTestNetworks()}
        {this.renderUseNonceOptIn()}
        {this.renderAutoLockTimeLimit()}
        {this.renderUserDataBackup()}
        {this.renderRestoreUserData()}
        {notUsingFirefox ? this.renderLedgerLiveControl() : null}
        {this.renderDismissSeedBackupReminderControl()}
      </div>
    );
  }
}
