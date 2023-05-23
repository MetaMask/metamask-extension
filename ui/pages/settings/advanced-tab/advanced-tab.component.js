import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import TextField from '../../../components/ui/text-field';
import Button from '../../../components/ui/button';

import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { exportAsFile } from '../../../helpers/utils/export-utils';
import ActionableMessage from '../../../components/ui/actionable-message';
import { BannerAlert } from '../../../components/component-library';
import {
  SEVERITIES,
  TextVariant,
} from '../../../helpers/constants/design-system';

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
    showEthSignModal: PropTypes.func,
    warning: PropTypes.string,
    sendHexData: PropTypes.bool,
    showFiatInTestnets: PropTypes.bool,
    showTestNetworks: PropTypes.bool,
    autoLockTimeLimit: PropTypes.number,
    setAutoLockTimeLimit: PropTypes.func.isRequired,
    setShowFiatConversionOnTestnetsPreference: PropTypes.func.isRequired,
    setShowTestNetworks: PropTypes.func.isRequired,
    setDismissSeedBackUpReminder: PropTypes.func.isRequired,
    dismissSeedBackUpReminder: PropTypes.bool.isRequired,
    backupUserData: PropTypes.func.isRequired,
    restoreUserData: PropTypes.func.isRequired,
    setDisabledRpcMethodPreference: PropTypes.func.isRequired,
    disabledRpcMethodPreferences: PropTypes.shape({
      eth_sign: PropTypes.bool.isRequired,
    }),
  };

  state = {
    autoLockTimeLimit: this.props.autoLockTimeLimit,
    lockTimeError: '',
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
          <span>{t('clearActivity')}</span>
          <span className="settings-page__content-description">
            {t('clearActivityDescription')}
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
                  category: MetaMetricsEventCategory.Settings,
                  event: MetaMetricsEventName.AccountReset,
                  properties: {},
                });
                showResetAccountConfirmationModal();
              }}
            >
              {t('clearActivityButton')}
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
        ref={this.settingsRefs[3]}
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
        ref={this.settingsRefs[4]}
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
        ref={this.settingsRefs[5]}
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
        ref={this.settingsRefs[6]}
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
        ref={this.settingsRefs[7]}
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

  renderDismissSeedBackupReminderControl() {
    const { t } = this.context;
    const { dismissSeedBackUpReminder, setDismissSeedBackUpReminder } =
      this.props;

    return (
      <div
        ref={this.settingsRefs[9]}
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

  renderToggleEthSignControl() {
    const { t, trackEvent } = this.context;
    const {
      disabledRpcMethodPreferences,
      showEthSignModal,
      setDisabledRpcMethodPreference,
    } = this.props;
    const toggleOff = (value) => {
      setDisabledRpcMethodPreference('eth_sign', !value);
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.OnboardingWalletAdvancedSettings,
        properties: {
          location: 'Settings',
          enable_eth_sign: false,
        },
      });
    };
    return (
      <div
        ref={this.settingsRefs[10]}
        className="settings-page__content-row"
        data-testid="advanced-setting-toggle-ethsign"
      >
        <div className="settings-page__content-item">
          <span>{t('toggleEthSignField')}</span>
          <div className="settings-page__content-description">
            {t('toggleEthSignDescriptionField')}
          </div>
        </div>

        {disabledRpcMethodPreferences?.eth_sign === true ? (
          <BannerAlert
            severity={SEVERITIES.DANGER}
            marginBottom={5}
            descriptionProps={{ variant: TextVariant.bodyMd }}
          >
            {t('toggleEthSignBannerDescription')}
          </BannerAlert>
        ) : null}
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              className="eth-sign-toggle"
              value={disabledRpcMethodPreferences?.eth_sign || false}
              onToggle={(value) => {
                value ? toggleOff(value) : showEthSignModal();
              }}
              offLabel={t('toggleEthSignOff')}
              onLabel={t('toggleEthSignOn')}
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

    return (
      <div className="settings-page__body">
        {warning ? <div className="settings-tab__error">{warning}</div> : null}
        {this.renderStateLogs()}
        {this.renderResetAccount()}
        {this.renderHexDataOptIn()}
        {this.renderShowConversionInTestnets()}
        {this.renderToggleTestNetworks()}
        {this.renderUseNonceOptIn()}
        {this.renderAutoLockTimeLimit()}
        {this.renderUserDataBackup()}
        {this.renderRestoreUserData()}
        {this.renderDismissSeedBackupReminderControl()}
        {this.renderToggleEthSignControl()}
      </div>
    );
  }
}
