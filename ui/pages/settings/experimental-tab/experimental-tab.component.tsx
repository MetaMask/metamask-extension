import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
///: END:ONLY_INCLUDE_IF

import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  Text,
  ///: END:ONLY_INCLUDE_IF
  Box,
} from '../../../components/component-library';

import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  TextColor,
  TextVariant,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  FontWeight,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/design-system';

///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { SurveyUrl } from '../../../../shared/constants/urls';
///: END:ONLY_INCLUDE_IF

type ExperimentalTabProps = {
  watchAccountEnabled: boolean;
  setWatchAccountEnabled: (value: boolean) => void;
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  solanaSupportEnabled: boolean;
  setSolanaSupportEnabled: (value: boolean) => void;
  ///: END:ONLY_INCLUDE_IF
  bitcoinSupportEnabled: boolean;
  setBitcoinSupportEnabled: (value: boolean) => void;
  bitcoinTestnetSupportEnabled: boolean;
  setBitcoinTestnetSupportEnabled: (value: boolean) => void;
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  addSnapAccountEnabled: boolean;
  setAddSnapAccountEnabled: (value: boolean) => void;
  ///: END:ONLY_INCLUDE_IF
  useRequestQueue: boolean;
  setUseRequestQueue: (value: boolean) => void;
  petnamesEnabled: boolean;
  setPetnamesEnabled: (value: boolean) => void;
  featureNotificationsEnabled: boolean;
  setFeatureNotificationsEnabled: (value: boolean) => void;
  redesignedConfirmationsEnabled: boolean;
  setRedesignedConfirmationsEnabled: (value: boolean) => void;
  redesignedTransactionsEnabled: boolean;
  setRedesignedTransactionsEnabled: (value: boolean) => void;
};

export default class ExperimentalTab extends PureComponent<ExperimentalTabProps> {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  settingsRefs = Array(
    getNumberOfSettingRoutesInTab(
      this.context.t,
      this.context.t('experimental'),
    ),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef<HTMLSpanElement>();
    });

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('experimental'), this.settingsRefs);
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('experimental'), this.settingsRefs);
  }

  renderToggleSection({
    title,
    description,
    toggleValue,
    toggleCallback,
    toggleDataTestId,
    toggleContainerDataTestId,
    toggleOffLabel,
    toggleOnLabel,
  }: {
    title: string;
    description: string;
    toggleValue: boolean;
    toggleCallback: (value: boolean) => void;
    toggleContainerDataTestId?: string;
    toggleDataTestId: string;
    toggleOffLabel: string;
    toggleOnLabel: string;
  }) {
    return (
      <Box
        ref={this.settingsRefs[0]}
        className="settings-page__content-row settings-page__content-row-experimental"
      >
        <div className="settings-page__content-item">
          <span>{title}</span>
          <div className="settings-page__content-description">
            {description}
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid={toggleContainerDataTestId}
        >
          <ToggleButton
            value={toggleValue}
            onToggle={toggleCallback}
            offLabel={toggleOffLabel}
            onLabel={toggleOnLabel}
            dataTestId={toggleDataTestId}
          />
        </div>
      </Box>
    );
  }

  renderTogglePetnames() {
    const { t } = this.context;
    const { petnamesEnabled, setPetnamesEnabled } = this.props;

    return this.renderToggleSection({
      title: t('petnamesEnabledToggle'),
      description: t('petnamesEnabledToggleDescription'),
      toggleValue: petnamesEnabled,
      toggleCallback: (value) => setPetnamesEnabled(!value),
      toggleDataTestId: 'toggle-petnames',
      toggleOffLabel: t('off'),
      toggleOnLabel: t('on'),
    });
  }

  renderToggleRedesignedSignatures() {
    const { t } = this.context;
    const {
      redesignedConfirmationsEnabled,
      setRedesignedConfirmationsEnabled,
    } = this.props;

    return this.renderToggleSection({
      title: t('redesignedConfirmationsEnabledToggle'),
      description: t('redesignedConfirmationsToggleDescription'),
      toggleValue: redesignedConfirmationsEnabled,
      toggleCallback: (value) => setRedesignedConfirmationsEnabled(!value),
      toggleContainerDataTestId: 'toggle-redesigned-confirmations-container',
      toggleDataTestId: 'toggle-redesigned-confirmations',
      toggleOffLabel: t('off'),
      toggleOnLabel: t('on'),
    });
  }

  renderToggleRedesignedTransactions() {
    const { t } = this.context;
    const { redesignedTransactionsEnabled, setRedesignedTransactionsEnabled } =
      this.props;

    return this.renderToggleSection({
      title: t('redesignedTransactionsEnabledToggle'),
      description: t('redesignedTransactionsToggleDescription'),
      toggleValue: redesignedTransactionsEnabled,
      toggleCallback: (value) => setRedesignedTransactionsEnabled(!value),
      toggleContainerDataTestId: 'toggle-redesigned-transactions-container',
      toggleDataTestId: 'toggle-redesigned-transactions',
      toggleOffLabel: t('off'),
      toggleOnLabel: t('on'),
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  renderKeyringSnapsToggle() {
    const { t, trackEvent } = this.context;
    const { addSnapAccountEnabled, setAddSnapAccountEnabled } = this.props;

    return (
      <>
        <Text
          variant={TextVariant.headingSm}
          as="h4"
          color={TextColor.textAlternative}
          marginBottom={2}
          fontWeight={FontWeight.Bold}
        >
          {t('snaps')}
        </Text>
        <div className="settings-page__content-item">
          <span>{t('snapAccounts')}</span>
          <div className="settings-page__content-description">
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              color={TextColor.textAlternative}
            >
              {t('snapAccountsDescription')}
            </Text>
          </div>
        </div>
        {this.renderToggleSection({
          title: t('addSnapAccountToggle'),
          description: t('addSnapAccountsDescription'),
          toggleValue: addSnapAccountEnabled,
          toggleCallback: (value) => {
            trackEvent({
              event: MetaMetricsEventName.AddSnapAccountEnabled,
              category: MetaMetricsEventCategory.Settings,
              properties: {
                enabled: !value,
              },
            });
            setAddSnapAccountEnabled(!value);
          },
          toggleContainerDataTestId: 'add-account-snap-toggle-div',
          toggleDataTestId: 'add-account-snap-toggle-button',
          toggleOffLabel: t('off'),
          toggleOnLabel: t('on'),
        })}
      </>
    );
  }
  ///: END:ONLY_INCLUDE_IF

  renderToggleRequestQueue() {
    const { t } = this.context;
    const { useRequestQueue, setUseRequestQueue } = this.props;
    return this.renderToggleSection({
      title: t('toggleRequestQueueField'),
      description: t('toggleRequestQueueDescription'),
      toggleValue: useRequestQueue || false,
      toggleCallback: (value) => setUseRequestQueue(!value),
      toggleContainerDataTestId: 'experimental-setting-toggle-request-queue',
      toggleDataTestId: 'experimental-setting-toggle-request-queue',
      toggleOffLabel: t('toggleRequestQueueOff'),
      toggleOnLabel: t('toggleRequestQueueOn'),
    });
  }

  renderNotificationsToggle() {
    const { t } = this.context;
    const { featureNotificationsEnabled, setFeatureNotificationsEnabled } =
      this.props;

    return this.renderToggleSection({
      title: t('notificationsFeatureToggle'),
      description: t('notificationsFeatureToggleDescription'),
      toggleValue: featureNotificationsEnabled,
      toggleCallback: (value) => setFeatureNotificationsEnabled(!value),
      toggleDataTestId: 'toggle-notifications',
      toggleOffLabel: t('off'),
      toggleOnLabel: t('on'),
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  renderWatchAccountToggle() {
    const { t, trackEvent } = this.context;
    const { watchAccountEnabled, setWatchAccountEnabled } = this.props;

    return this.renderToggleSection({
      title: t('watchEthereumAccountsToggle'),
      description: t('watchEthereumAccountsDescription', [
        <a
          key="watch-account-feedback-form__link-text"
          href="https://www.getfeedback.com/r/7Je8ckkq"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('form')}
        </a>,
      ]),
      toggleValue: watchAccountEnabled,
      toggleCallback: (value) => {
        trackEvent({
          event: MetaMetricsEventName.WatchEthereumAccountsToggled,
          category: MetaMetricsEventCategory.Settings,
          properties: {
            enabled: !value,
          },
        });
        setWatchAccountEnabled(!value);
      },
      toggleContainerDataTestId: 'watch-account-toggle-div',
      toggleDataTestId: 'watch-account-toggle',
      toggleOffLabel: t('off'),
      toggleOnLabel: t('on'),
    });
  }

  // We're only setting the code fences here since
  // we should remove it for the feature release
  renderBitcoinSupport() {
    const { t, trackEvent } = this.context;
    const {
      bitcoinSupportEnabled,
      setBitcoinSupportEnabled,
      bitcoinTestnetSupportEnabled,
      setBitcoinTestnetSupportEnabled,
    } = this.props;

    return (
      <>
        <Text
          variant={TextVariant.headingSm}
          as="h4"
          color={TextColor.textAlternative}
          marginBottom={2}
          fontWeight={FontWeight.Bold}
        >
          {t('bitcoinSupportSectionTitle')}
        </Text>
        {this.renderToggleSection({
          title: t('bitcoinSupportToggleTitle'),
          description: t('bitcoinSupportToggleDescription', [
            <a
              key="btc-account-feedback-form__link-text"
              href={SurveyUrl.BtcSupport}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('form')}
            </a>,
          ]),
          toggleValue: bitcoinSupportEnabled,
          toggleCallback: (value) => {
            trackEvent({
              event: MetaMetricsEventName.BitcoinSupportToggled,
              category: MetaMetricsEventCategory.Settings,
              properties: {
                enabled: !value,
              },
            });
            setBitcoinSupportEnabled(!value);
          },
          toggleContainerDataTestId: 'bitcoin-support-toggle-div',
          toggleDataTestId: 'bitcoin-support-toggle',
          toggleOffLabel: t('off'),
          toggleOnLabel: t('on'),
        })}
        {this.renderToggleSection({
          title: t('bitcoinTestnetSupportToggleTitle'),
          description: t('bitcoinTestnetSupportToggleDescription'),
          toggleValue: bitcoinTestnetSupportEnabled,
          toggleCallback: (value) => {
            trackEvent({
              event: MetaMetricsEventName.BitcoinTestnetSupportToggled,
              category: MetaMetricsEventCategory.Settings,
              properties: {
                enabled: !value,
              },
            });
            setBitcoinTestnetSupportEnabled(!value);
          },
          toggleDataTestId: 'bitcoin-testnet-accounts-toggle',
          toggleOffLabel: t('off'),
          toggleOnLabel: t('on'),
        })}
      </>
    );
  }
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  renderSolanaSupport() {
    const { t, trackEvent } = this.context;
    const { solanaSupportEnabled, setSolanaSupportEnabled } = this.props;

    return (
      <>
        <Text
          variant={TextVariant.headingSm}
          as="h4"
          color={TextColor.textAlternative}
          marginBottom={2}
          fontWeight={FontWeight.Bold}
        >
          {t('solanaSupportSectionTitle')}
        </Text>
        {this.renderToggleSection({
          title: t('solanaSupportToggleTitle'),
          description: t('solanaSupportToggleDescription'),
          toggleValue: solanaSupportEnabled,
          toggleCallback: (value) => {
            trackEvent({
              event: MetaMetricsEventName.SolanaSupportToggled,
              category: MetaMetricsEventCategory.Settings,
              properties: {
                enabled: !value,
              },
            });
            setSolanaSupportEnabled(!value);
          },
          toggleContainerDataTestId: 'solana-support-toggle-div',
          toggleDataTestId: 'solana-support-toggle',
          toggleOffLabel: t('off'),
          toggleOnLabel: t('on'),
        })}
      </>
    );
  }
  ///: END:ONLY_INCLUDE_IF

  render() {
    return (
      <div className="settings-page__body">
        {this.renderTogglePetnames()}
        {this.renderToggleRedesignedSignatures()}
        {this.renderToggleRedesignedTransactions()}
        {process.env.NOTIFICATIONS ? this.renderNotificationsToggle() : null}
        {this.renderToggleRequestQueue()}
        {/* Section: Account Management Snaps */}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
          this.renderKeyringSnapsToggle()
          ///: END:ONLY_INCLUDE_IF
        }
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          this.renderWatchAccountToggle()
          ///: END:ONLY_INCLUDE_IF
        }
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          // We're only setting the code fences here since
          // we should remove it for the feature release
          /* Section: Bitcoin Accounts */
          this.renderBitcoinSupport()
          ///: END:ONLY_INCLUDE_IF
        }
        {
          ///: BEGIN:ONLY_INCLUDE_IF(solana)
          this.renderSolanaSupport()
          ///: END:ONLY_INCLUDE_IF
        }
      </div>
    );
  }
}
