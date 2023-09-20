import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';

import { Text, Box } from '../../../components/component-library';
import {
  TextColor,
  TextVariant,
  FontWeight,
  ///: BEGIN:ONLY_INCLUDE_IN(desktop)
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IN(desktop)
import DesktopEnableButton from '../../../components/app/desktop-enable-button';
///: END:ONLY_INCLUDE_IN

export default class ExperimentalTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    transactionSecurityCheckEnabled: PropTypes.bool,
    setTransactionSecurityCheckEnabled: PropTypes.func,
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    securityAlertsEnabled: PropTypes.bool,
    setSecurityAlertsEnabled: PropTypes.func,
    ///: END:ONLY_INCLUDE_IN
  };

  settingsRefs = Array(
    getNumberOfSettingsInSection(
      this.context.t,
      this.context.t('experimental'),
    ),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('experimental'), this.settingsRefs);
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('experimental'), this.settingsRefs);
  }

  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  renderSecurityAlertsToggle() {
    const { t } = this.context;

    const { securityAlertsEnabled, setSecurityAlertsEnabled } = this.props;

    return (
      <>
        <Text
          variant={TextVariant.headingSm}
          color={TextColor.textAlternative}
          marginBottom={2}
        >
          {t('security')}
        </Text>
        <div
          ref={this.settingsRefs[1]}
          className="settings-page__content-row settings-page__content-row-experimental"
        >
          <div className="settings-page__content-item">
            <span>{t('securityAlerts')}</span>
            <div className="settings-page__content-description">
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {t('securityAlertsDescription')}
              </Text>
              <div
                data-testid="settings-toggle-security-alert-blockaid"
                className="settings-page__content-item-col settings-page__content-item-col__security-toggle-option"
              >
                <Text
                  variant={TextVariant.bodyMd}
                  color={TextColor.textDefault}
                >
                  {t('blockaid')}
                </Text>
                <ToggleButton
                  value={securityAlertsEnabled}
                  onToggle={(value) => {
                    this.context.trackEvent({
                      category: MetaMetricsEventCategory.Settings,
                      event: 'Enabled/Disable security_alerts_enabled',
                      properties: {
                        action: 'Enabled/Disable security_alerts_enabled',
                        legacy_event: true,
                      },
                    });
                    setSecurityAlertsEnabled(!value || false);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  ///: END:ONLY_INCLUDE_IN

  renderTransactionSecurityCheckToggle() {
    const { t } = this.context;

    const {
      transactionSecurityCheckEnabled,
      setTransactionSecurityCheckEnabled,
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
          {t('privacy')}
        </Text>
        <Box
          ref={this.settingsRefs[1]}
          className="settings-page__content-row settings-page__content-row-experimental"
          marginBottom={3}
        >
          <div className="settings-page__content-item">
            <span>{t('transactionSecurityCheck')}</span>
            <div className="settings-page__content-description">
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                color={TextColor.textAlternative}
              >
                {t('transactionSecurityCheckDescription')}
              </Text>
              <div className="settings-page__content-item-col settings-page__content-item-col__security-toggle-option">
                <Text
                  variant={TextVariant.bodyMd}
                  as="h5"
                  color={TextColor.textDefault}
                  fontWeight={FontWeight.Medium}
                  marginBottom={0}
                >
                  {t('openSea')}
                </Text>
                <ToggleButton
                  value={transactionSecurityCheckEnabled}
                  onToggle={(value) => {
                    this.context.trackEvent({
                      category: MetaMetricsEventCategory.Settings,
                      event: 'Enabled/Disable TransactionSecurityCheck',
                      properties: {
                        action: 'Enabled/Disable TransactionSecurityCheck',
                        legacy_event: true,
                      },
                    });
                    setTransactionSecurityCheckEnabled(!value);
                  }}
                />
              </div>
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                color={TextColor.textAlternative}
                marginTop={0}
              >
                {t('thisServiceIsExperimental', [
                  <a
                    href="http://opensea.io/securityproviderterms"
                    key="termsOfUse"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t('termsOfUse')}
                  </a>,
                ])}
              </Text>
            </div>
          </div>
        </Box>
      </>
    );
  }

  ///: BEGIN:ONLY_INCLUDE_IN(desktop)
  renderDesktopEnableButton() {
    const { t } = this.context;

    return (
      <>
        <Text
          variant={TextVariant.headingSm}
          color={TextColor.textAlternative}
          marginBottom={2}
        >
          {t('desktopApp')}
        </Text>
        <Box
          ref={this.settingsRefs[6]}
          data-testid="advanced-setting-desktop-pairing"
          display={Display.Flex}
          alignItems={AlignItems.center}
          flexDirection={FlexDirection.Row}
          flexWrap={FlexWrap.Wrap}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Text marginTop={3} paddingRight={2}>
            {t('desktopEnableButtonDescription')}
          </Text>
          <Box className="settings-page__content-item-col" paddingTop={3}>
            <DesktopEnableButton />
          </Box>
        </Box>
      </>
    );
  }
  ///: END:ONLY_INCLUDE_IN

  render() {
    return (
      <div className="settings-page__body">
        {
          ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
          this.renderSecurityAlertsToggle()
          ///: END:ONLY_INCLUDE_IN
        }
        {this.renderTransactionSecurityCheckToggle()}
        {
          ///: BEGIN:ONLY_INCLUDE_IN(desktop)
          this.renderDesktopEnableButton()
          ///: END:ONLY_INCLUDE_IN
        }
      </div>
    );
  }
}
