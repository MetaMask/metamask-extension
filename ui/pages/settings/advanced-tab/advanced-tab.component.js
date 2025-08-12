import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../../shared/constants/preferences';
import {
  SMART_ACCOUNT_LEARN_MORE_URL,
  SMART_TRANSACTIONS_LEARN_MORE_URL,
} from '../../../../shared/constants/smartTransactions';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';
import Button from '../../../components/ui/button';
import TextField from '../../../components/ui/text-field';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
  AlignItems,
} from '../../../helpers/constants/design-system';
import {
  ExportableContentType,
  exportAsFile,
} from '../../../helpers/utils/export-utils';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';

export default class AdvancedTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    setHexDataFeatureFlag: PropTypes.func,
    displayErrorInSettings: PropTypes.func,
    hideErrorInSettings: PropTypes.func,
    showResetAccountConfirmationModal: PropTypes.func,
    errorInSettings: PropTypes.string,
    sendHexData: PropTypes.bool,
    showFiatInTestnets: PropTypes.bool,
    showTestNetworks: PropTypes.bool,
    smartTransactionsEnabled: PropTypes.bool,
    autoLockTimeLimit: PropTypes.number,
    setAutoLockTimeLimit: PropTypes.func.isRequired,
    setShowFiatConversionOnTestnetsPreference: PropTypes.func.isRequired,
    setShowTestNetworks: PropTypes.func.isRequired,
    setSmartTransactionsEnabled: PropTypes.func.isRequired,
    setDismissSeedBackUpReminder: PropTypes.func.isRequired,
    dismissSeedBackUpReminder: PropTypes.bool.isRequired,
    backupUserData: PropTypes.func.isRequired,
    showExtensionInFullSizeView: PropTypes.bool,
    setShowExtensionInFullSizeView: PropTypes.func.isRequired,
    manageInstitutionalWallets: PropTypes.bool,
    setManageInstitutionalWallets: PropTypes.func.isRequired,
    dismissSmartAccountSuggestionEnabled: PropTypes.bool.isRequired,
    setDismissSmartAccountSuggestionEnabled: PropTypes.func.isRequired,
    smartAccountOptIn: PropTypes.bool.isRequired,
    setSmartAccountOptIn: PropTypes.func.isRequired,
  };

  state = {
    autoLockTimeLimit: this.props.autoLockTimeLimit,
    autoLockTimeLimitBeforeNormalization: this.props.autoLockTimeLimit,
    lockTimeError: '',
  };

  settingsRefs = Array(
    getNumberOfSettingRoutesInTab(this.context.t, this.context.t('advanced')),
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
    const { hideErrorInSettings } = this.props;
    handleSettingsRefs(t, t('advanced'), this.settingsRefs);
    hideErrorInSettings();
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

  backupUserData = async () => {
    const { fileName, data } = await this.props.backupUserData();
    exportAsFile(fileName, data, ExportableContentType.JSON);

    this.context.trackEvent({
      event: 'User Data Exported',
      category: 'Backup',
      properties: {},
    });
  };

  renderStateLogs() {
    const { t } = this.context;
    const { displayErrorInSettings } = this.props;

    return (
      <Box
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        ref={this.settingsRefs[0]}
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
              data-testid="advanced-setting-state-logs-button"
              onClick={() => {
                window.logStateString(async (err, result) => {
                  if (err) {
                    displayErrorInSettings(t('stateLogError'));
                  } else {
                    try {
                      await exportAsFile(
                        `${t('stateLogFileName')}.json`,
                        result,
                        ExportableContentType.JSON,
                      );
                    } catch (error) {
                      displayErrorInSettings(error.message);
                    }
                  }
                });
              }}
            >
              {t('downloadStateLogs')}
            </Button>
          </div>
        </div>
      </Box>
    );
  }

  renderResetAccount() {
    const { t } = this.context;
    const { showResetAccountConfirmationModal } = this.props;

    return (
      <Box
        ref={this.settingsRefs[1]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
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
      </Box>
    );
  }

  renderToggleSmartAccountOptIn() {
    const { t } = this.context;
    const { smartAccountOptIn, setSmartAccountOptIn } = this.props;

    const learMoreLink = (
      <ButtonLink
        size={ButtonLinkSize.Inherit}
        textProps={{
          variant: TextVariant.bodyMd,
          alignItems: AlignItems.flexStart,
        }}
        as="a"
        href={SMART_ACCOUNT_LEARN_MORE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('learnMoreUpperCase')}
      </ButtonLink>
    );

    return (
      <Box
        ref={this.settingsRefs[2]}
        className="settings-page__content-row"
        data-testid="advanced-setting-smart-account-optin"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
      >
        <div className="settings-page__content-item">
          <span> {t('useSmartAccountTitle')}</span>
          <div className="settings-page__content-description">
            {`${t('useSmartAccountDescription')} `}
            {learMoreLink}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={smartAccountOptIn}
            onToggle={(oldValue) => {
              const newValue = !oldValue;
              setSmartAccountOptIn(newValue);
            }}
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="settings-page-smart-account-optin"
          />
        </div>
      </Box>
    );
  }

  renderToggleDismissSmartAccountSuggestion() {
    const { t } = this.context;
    const {
      dismissSmartAccountSuggestionEnabled,
      setDismissSmartAccountSuggestionEnabled,
    } = this.props;

    return (
      <Box
        ref={this.settingsRefs[3]}
        className="settings-page__content-row"
        data-testid="advanced-setting-dismiss-smart-account-suggestion-enabled"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
      >
        <div className="settings-page__content-item">
          <span> {t('dismissSmartAccountSuggestionEnabledTitle')}</span>
          <div className="settings-page__content-description">
            {t('dismissSmartAccountSuggestionEnabledDescription')}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={dismissSmartAccountSuggestionEnabled}
            onToggle={(oldValue) => {
              const newValue = !oldValue;
              setDismissSmartAccountSuggestionEnabled(newValue);
            }}
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="settings-page-dismiss-smart-account-suggestion-enabled-toggle"
          />
        </div>
      </Box>
    );
  }

  renderToggleStxOptIn() {
    const { t } = this.context;
    const { smartTransactionsEnabled, setSmartTransactionsEnabled } =
      this.props;

    const learMoreLink = (
      <ButtonLink
        size={ButtonLinkSize.Inherit}
        textProps={{
          variant: TextVariant.bodyMd,
          alignItems: AlignItems.flexStart,
        }}
        as="a"
        href={SMART_TRANSACTIONS_LEARN_MORE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('learnMoreUpperCase')}
      </ButtonLink>
    );

    return (
      <Box
        ref={this.settingsRefs[4]}
        className="settings-page__content-row"
        data-testid="advanced-setting-enable-smart-transactions"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
      >
        <div className="settings-page__content-item">
          <span>{t('smartTransactions')}</span>
          <div className="settings-page__content-description">
            {t('stxOptInSupportedNetworksDescription', [learMoreLink])}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={smartTransactionsEnabled}
            onToggle={(oldValue) => {
              const newValue = !oldValue;
              setSmartTransactionsEnabled(newValue);
            }}
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="settings-page-stx-opt-in-toggle"
          />
        </div>
      </Box>
    );
  }

  renderHexDataOptIn() {
    const { t } = this.context;
    const { sendHexData, setHexDataFeatureFlag } = this.props;

    return (
      <Box
        ref={this.settingsRefs[5]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
        data-testid="advanced-setting-hex-data"
      >
        <div className="settings-page__content-item">
          <span>{t('showHexData')}</span>
          <div className="settings-page__content-description">
            {t('showHexDataDescription')}
          </div>
        </div>
        <div className="settings-page__content-item-col">
          <ToggleButton
            value={sendHexData}
            onToggle={(value) => setHexDataFeatureFlag(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
            className="hex-data-toggle"
          />
        </div>
      </Box>
    );
  }

  renderShowConversionInTestnets() {
    const { t } = this.context;
    const { showFiatInTestnets, setShowFiatConversionOnTestnetsPreference } =
      this.props;

    return (
      <Box
        ref={this.settingsRefs[6]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
        data-testid="advanced-setting-show-testnet-conversion"
      >
        <div className="settings-page__content-item">
          <span>{t('showFiatConversionInTestnets')}</span>
          <div className="settings-page__content-description">
            {t('showFiatConversionInTestnetsDescription')}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={showFiatInTestnets}
            onToggle={(value) =>
              setShowFiatConversionOnTestnetsPreference(!value)
            }
            offLabel={t('off')}
            onLabel={t('on')}
            className="show-fiat-on-testnets-toggle"
          />
        </div>
      </Box>
    );
  }

  renderToggleTestNetworks() {
    const { t } = this.context;
    const { showTestNetworks, setShowTestNetworks } = this.props;

    return (
      <Box
        ref={this.settingsRefs[5]}
        className="settings-page__content-row"
        data-testid="advanced-setting-show-testnet-conversion"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
      >
        <div className="settings-page__content-item">
          <span>{t('showTestnetNetworks')}</span>
          <div className="settings-page__content-description">
            {t('showTestnetNetworksDescription')}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={showTestNetworks}
            onToggle={(value) => setShowTestNetworks(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderToggleExtensionInFullSizeView() {
    const { t } = this.context;
    const { showExtensionInFullSizeView, setShowExtensionInFullSizeView } =
      this.props;

    return (
      <Box
        ref={this.settingsRefs[8]}
        className="settings-page__content-row"
        data-testid="advanced-setting-show-extension-in-full-size-view"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
      >
        <div className="settings-page__content-item">
          <span>{t('showExtensionInFullSizeView')}</span>
          <div className="settings-page__content-description">
            {t('showExtensionInFullSizeViewDescription')}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={showExtensionInFullSizeView}
            onToggle={(value) => setShowExtensionInFullSizeView(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderAutoLockTimeLimit() {
    const { t } = this.context;
    const { lockTimeError } = this.state;
    const { setAutoLockTimeLimit } = this.props;

    return (
      <Box
        ref={this.settingsRefs[7]}
        className="settings-page__content-row"
        data-testid="advanced-setting-auto-lock"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
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
              id="autoTimeout"
              data-testid="auto-lockout-time"
              placeholder="0"
              value={this.state.autoLockTimeLimitBeforeNormalization}
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
      </Box>
    );
  }

  renderDismissSeedBackupReminderControl() {
    const { t } = this.context;
    const { dismissSeedBackUpReminder, setDismissSeedBackUpReminder } =
      this.props;

    return (
      <Box
        ref={this.settingsRefs[9]}
        className="settings-page__content-row"
        data-testid="advanced-setting-dismiss-reminder"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
      >
        <div className="settings-page__content-item">
          <span>{t('dismissReminderField')}</span>
          <div className="settings-page__content-description">
            {t('dismissReminderDescriptionField')}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={dismissSeedBackUpReminder}
            onToggle={(value) => setDismissSeedBackUpReminder(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  handleLockChange(autoLockTimeLimitBeforeNormalization) {
    const { t } = this.context;

    if (autoLockTimeLimitBeforeNormalization === '') {
      this.setState({
        autoLockTimeLimitBeforeNormalization,
        autoLockTimeLimit: DEFAULT_AUTO_LOCK_TIME_LIMIT,
        lockTimeError: '',
      });
      return;
    }

    const autoLockTimeLimitAfterNormalization = Number(
      autoLockTimeLimitBeforeNormalization,
    );

    if (
      Number.isNaN(autoLockTimeLimitAfterNormalization) ||
      autoLockTimeLimitAfterNormalization < 0 ||
      autoLockTimeLimitAfterNormalization > 10080
    ) {
      this.setState({
        autoLockTimeLimitBeforeNormalization,
        autoLockTimeLimit: null,
        lockTimeError: t('lockTimeInvalid'),
      });
      return;
    }

    const autoLockTimeLimit = autoLockTimeLimitAfterNormalization;

    this.setState({
      autoLockTimeLimitBeforeNormalization,
      autoLockTimeLimit,
      lockTimeError: '',
    });
  }

  renderUserDataBackup() {
    const { t } = this.context;
    return (
      <Box
        ref={this.settingsRefs[10]}
        className="settings-page__content-row"
        data-testid="advanced-setting-data-backup"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <div className="settings-page__content-item">
          <span>{t('exportYourData')}</span>
          <span className="settings-page__content-description">
            {t('exportYourDataDescription')}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              data-testid="export-data-button"
              type="secondary"
              large
              onClick={this.backupUserData}
            >
              {t('exportYourDataButton')}
            </Button>
          </div>
        </div>
      </Box>
    );
  }

  renderManageInstitutionalWallets() {
    const { t } = this.context;
    const { manageInstitutionalWallets, setManageInstitutionalWallets } =
      this.props;

    return (
      <Box
        ref={this.settingsRefs[9]}
        className="settings-page__content-row"
        data-testid="advanced-setting-dismiss-reminder"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
      >
        <div className="settings-page__content-item">
          <span>{t('manageInstitutionalWallets')}</span>
          <div className="settings-page__content-description">
            {t('manageInstitutionalWalletsDescription')}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={manageInstitutionalWallets}
            onToggle={(value) => setManageInstitutionalWallets(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  render() {
    const { errorInSettings } = this.props;
    // When adding/removing/editing the order of renders, double-check the order of the settingsRefs. This affects settings-search.js
    return (
      <div className="settings-page__body">
        {errorInSettings ? (
          <div className="settings-tab__error">{errorInSettings}</div>
        ) : null}
        {this.renderStateLogs()}
        {this.renderResetAccount()}
        {this.renderToggleSmartAccountOptIn()}
        {this.renderToggleDismissSmartAccountSuggestion()}
        {this.renderToggleStxOptIn()}
        {this.renderHexDataOptIn()}
        {this.renderShowConversionInTestnets()}
        {this.renderToggleTestNetworks()}
        {this.renderManageInstitutionalWallets()}
        {this.renderToggleExtensionInFullSizeView()}
        {this.renderAutoLockTimeLimit()}
        {this.renderUserDataBackup()}
        {this.renderDismissSeedBackupReminderControl()}
      </div>
    );
  }
}
