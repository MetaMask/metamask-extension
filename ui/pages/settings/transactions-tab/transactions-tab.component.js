import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  SECURITY_ALERTS_LEARN_MORE_LINK,
  TRANSACTION_SIMULATIONS_LEARN_MORE_LINK,
} from '../../../../shared/lib/ui-utils';
import { SMART_TRANSACTIONS_LEARN_MORE_URL } from '../../../../shared/constants/smartTransactions';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
  AlignItems,
} from '../../../helpers/constants/design-system';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';

export default class TransactionsTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    securityAlertsEnabled: PropTypes.bool,
    setSecurityAlertsEnabled: PropTypes.func,
    useTransactionSimulations: PropTypes.bool.isRequired,
    setUseTransactionSimulations: PropTypes.func.isRequired,
    useExternalNameSources: PropTypes.bool.isRequired,
    setUseExternalNameSources: PropTypes.func.isRequired,
    smartTransactionsEnabled: PropTypes.bool,
    setSmartTransactionsEnabled: PropTypes.func.isRequired,
    sendHexData: PropTypes.bool,
    setHexDataFeatureFlag: PropTypes.func.isRequired,
    hasActiveShieldSubscription: PropTypes.bool,
    dismissSmartAccountSuggestionEnabled: PropTypes.bool.isRequired,
    setDismissSmartAccountSuggestionEnabled: PropTypes.func.isRequired,
  };

  settingsRefs = Array(
    getNumberOfSettingRoutesInTab(
      this.context.t,
      this.context.t('transactions'),
    ),
  )
    .fill(undefined)
    .map(() => React.createRef());

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('transactions'), this.settingsRefs);
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('transactions'), this.settingsRefs);
  }

  toggleSecurityAlert = (oldValue) => {
    const newValue = !oldValue;
    const { setSecurityAlertsEnabled } = this.props;
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        blockaid_alerts_enabled: newValue,
      },
    });
    setSecurityAlertsEnabled(newValue);
  };

  renderEstimateBalanceChangesToggle() {
    const { t } = this.context;
    const {
      useTransactionSimulations,
      setUseTransactionSimulations,
      hasActiveShieldSubscription,
    } = this.props;

    return (
      <Box
        ref={this.settingsRefs[0]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('simulationsSettingSubHeader')}</span>
          <div className="settings-page__content-description">
            {t('simulationsSettingDescription', [
              <a
                key="learn_more_link"
                href={TRANSACTION_SIMULATIONS_LEARN_MORE_LINK}
                rel="noreferrer"
                target="_blank"
              >
                {t('learnMoreUpperCase')}
              </a>,
            ])}
          </div>
        </div>
        <div
          className="settings-page__content-item-col"
          data-testid="useTransactionSimulations"
        >
          <ToggleButton
            value={useTransactionSimulations}
            onToggle={(value) => setUseTransactionSimulations(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
            disabled={hasActiveShieldSubscription}
          />
        </div>
      </Box>
    );
  }

  renderSecurityAlertsToggle() {
    const { t } = this.context;
    const { securityAlertsEnabled, hasActiveShieldSubscription } = this.props;

    return (
      <>
        <div ref={this.settingsRefs[1]}>
          <span className="settings-page__security-tab-sub-header">
            {t('securityAlerts')}
          </span>
        </div>
        <div className="settings-page__content-padded">
          <Box
            className="settings-page__content-row"
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            gap={4}
          >
            <div className="settings-page__content-item">
              <div className="settings-page__content-description">
                {t('securityAlertsDescription', [
                  <a
                    key="learn_more_link"
                    href={SECURITY_ALERTS_LEARN_MORE_LINK}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t('learnMoreUpperCase')}
                  </a>,
                ])}
              </div>
            </div>
            <div
              className="settings-page__content-item-col"
              data-testid="securityAlert"
            >
              <ToggleButton
                value={securityAlertsEnabled}
                onToggle={this.toggleSecurityAlert}
                offLabel={t('off')}
                onLabel={t('on')}
                disabled={hasActiveShieldSubscription}
              />
            </div>
          </Box>
        </div>
      </>
    );
  }

  renderSmartTransactionsToggle() {
    const { t } = this.context;
    const { smartTransactionsEnabled, setSmartTransactionsEnabled } =
      this.props;

    const learnMoreLink = (
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
        ref={this.settingsRefs[2]}
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
            {t('stxOptInSupportedNetworksDescription', [learnMoreLink])}
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

  renderProposedNicknamesToggle() {
    const { t } = this.context;
    const { useExternalNameSources, setUseExternalNameSources } = this.props;

    return (
      <Box
        ref={this.settingsRefs[3]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('externalNameSourcesSetting')}</span>
          <div className="settings-page__content-description">
            {t('externalNameSourcesSettingDescription')}
          </div>
        </div>
        <div
          className="settings-page__content-item-col"
          data-testid="useExternalNameSources"
        >
          <ToggleButton
            value={useExternalNameSources}
            onToggle={(value) => setUseExternalNameSources(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderShowHexDataToggle() {
    const { t } = this.context;
    const { sendHexData, setHexDataFeatureFlag } = this.props;

    return (
      <Box
        ref={this.settingsRefs[4]}
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

  renderCustomizeTransactionNonceInfo() {
    const { t } = this.context;
    // Customize nonce is available in the transaction confirmation screen; no global toggle.
    return (
      <Box
        ref={this.settingsRefs[5]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('customizeTransactionNonce')}</span>
          <div className="settings-page__content-description">
            {t('customizeTransactionNonceDescription')}
          </div>
        </div>
      </Box>
    );
  }

  renderDismissSmartAccountSuggestionToggle() {
    const { t } = this.context;
    const {
      dismissSmartAccountSuggestionEnabled,
      setDismissSmartAccountSuggestionEnabled,
    } = this.props;

    return (
      <Box
        ref={this.settingsRefs[6]}
        className="settings-page__content-row"
        data-testid="advanced-setting-dismiss-smart-account-suggestion-enabled"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={[null, 4]}
      >
        <div className="settings-page__content-item">
          <span>{t('dismissSmartAccountSuggestionEnabledTitle')}</span>
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

  render() {
    return (
      <div className="settings-page__body">
        <div className="settings-page__content-row">
          {this.renderEstimateBalanceChangesToggle()}
        </div>
        {this.renderSecurityAlertsToggle()}
        <div className="settings-page__content-row">
          {this.renderSmartTransactionsToggle()}
        </div>
        <div className="settings-page__content-row">
          {this.renderProposedNicknamesToggle()}
        </div>
        <div className="settings-page__content-row">
          {this.renderShowHexDataToggle()}
        </div>
        <div className="settings-page__content-row">
          {this.renderCustomizeTransactionNonceInfo()}
        </div>
        <div className="settings-page__content-row">
          {this.renderDismissSmartAccountSuggestionToggle()}
        </div>
      </div>
    );
  }
}
