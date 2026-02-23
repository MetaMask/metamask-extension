import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { Text, Box } from '../../../components/component-library';
import {
  TextColor,
  TextVariant,
  FontWeight,
} from '../../../helpers/constants/design-system';

type ExperimentalTabProps = {
  watchAccountEnabled: boolean;
  setWatchAccountEnabled: (value: boolean) => void;
  addSnapAccountEnabled: boolean;
  setAddSnapAccountEnabled: (value: boolean) => void;
  petnamesEnabled: boolean;
  featureNotificationsEnabled: boolean;
  setFeatureNotificationsEnabled: (value: boolean) => void;
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

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
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
  ///: END:ONLY_INCLUDE_IF

  render() {
    return (
      <div className="settings-page__body">
        {process.env.NOTIFICATIONS ? this.renderNotificationsToggle() : null}
        {/* Section: Account Management Snaps */}
        {this.renderKeyringSnapsToggle()}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
          this.renderWatchAccountToggle()
          ///: END:ONLY_INCLUDE_IF
        }
      </div>
    );
  }
}
