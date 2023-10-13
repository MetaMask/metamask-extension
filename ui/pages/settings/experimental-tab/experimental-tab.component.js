import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import {
  MetaMetricsEventCategory,
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  MetaMetricsEventName,
  ///: END:ONLY_INCLUDE_IN
} from '../../../../shared/constants/metametrics';
///: BEGIN:ONLY_INCLUDE_IN(build-main)
import { showSnapAccountExperimentalToggle } from '../../../../shared/modules/snap-accounts';
///: END:ONLY_INCLUDE_IN

import { Text, Box, Tag } from '../../../components/component-library';
import {
  TextColor,
  TextVariant,
  Display,
  ///: BEGIN:ONLY_INCLUDE_IN(blockaid,desktop,keyring-snaps)
  FontWeight,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(desktop)
  AlignItems,
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
    securityAlertsEnabled: PropTypes.bool,
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    setSecurityAlertsEnabled: PropTypes.func,
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    addSnapAccountEnabled: PropTypes.bool,
    setAddSnapAccountEnabled: PropTypes.func,
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
  /**
   * toggleSecurityAlert
   *
   * @param {boolean} oldValue - the current securityAlertEnabled value.
   */
  toggleSecurityAlert(oldValue) {
    const newValue = !oldValue;
    const { setSecurityAlertsEnabled, transactionSecurityCheckEnabled } =
      this.props;
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: 'Enabled/Disable security_alerts_enabled',
      properties: {
        action: 'Enabled/Disable security_alerts_enabled',
        legacy_event: true,
      },
    });
    setSecurityAlertsEnabled(newValue);
    if (newValue && transactionSecurityCheckEnabled) {
      this.toggleTransactionSecurityCheck(true);
    }
  }
  ///: END:ONLY_INCLUDE_IN

  /**
   * toggleTransactionSecurityCheck
   *
   * @param {boolean} oldValue - the current transactionSecurityCheckEnabled value.
   */
  toggleTransactionSecurityCheck(oldValue) {
    const newValue = !oldValue;
    const { securityAlertsEnabled, setTransactionSecurityCheckEnabled } =
      this.props;
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: 'Enabled/Disable TransactionSecurityCheck',
      properties: {
        action: 'Enabled/Disable TransactionSecurityCheck',
        legacy_event: true,
      },
    });
    setTransactionSecurityCheckEnabled(newValue);
    if (newValue && securityAlertsEnabled && this.toggleSecurityAlert) {
      this.toggleSecurityAlert(true);
    }
  }

  renderSecurityAlertsToggle() {
    const { t } = this.context;

    const {
      ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
      securityAlertsEnabled,
      ///: END:ONLY_INCLUDE_IN
      transactionSecurityCheckEnabled,
    } = this.props;

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
            <Text
              variant={TextVariant.inherit}
              color={TextColor.textAlternative}
            >
              {t('securityAlerts')}
            </Text>
            <div className="settings-page__content-description">
              <Text variant={TextVariant.bodySm}>
                {t('securityAlertsDescription')}
              </Text>
              {
                ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
                <>
                  <Text
                    variant={TextVariant.bodySmBold}
                    color={TextColor.textAlternative}
                    marginTop={4}
                  >
                    {t('preferredProvider')}
                  </Text>
                  <div
                    data-testid="settings-toggle-security-alert-blockaid"
                    className="settings-page__content-item-col settings-page__content-item-col__security-toggle-option"
                  >
                    <div>
                      <Box display={Display.Flex}>
                        <Text
                          variant={TextVariant.bodyMd}
                          color={TextColor.textDefault}
                        >
                          {t('blockaid')}
                        </Text>
                        <Tag marginLeft={2} label="Recommended" />
                      </Box>
                      <Text
                        variant={TextVariant.bodySm}
                        as="h6"
                        color={TextColor.textAlternative}
                        marginTop={0}
                        marginRight={1}
                      >
                        {t('blockaidMessage')}
                      </Text>
                    </div>
                    <ToggleButton
                      value={securityAlertsEnabled}
                      onToggle={this.toggleSecurityAlert.bind(this)}
                    />
                  </div>
                </>
                ///: END:ONLY_INCLUDE_IN
              }
              <div className="settings-page__content-item-col settings-page__content-item-col__security-toggle-option">
                <div>
                  <Box display={Display.Flex}>
                    <Text
                      variant={TextVariant.bodyMd}
                      color={TextColor.textDefault}
                    >
                      {t('openSeaLabel')}
                    </Text>
                    <Tag marginLeft={2} label="Beta" />
                  </Box>
                  <Text
                    variant={TextVariant.bodySm}
                    as="h6"
                    color={TextColor.textAlternative}
                    marginTop={0}
                    marginRight={1}
                  >
                    {t('openSeaMessage')}
                  </Text>
                </div>
                <ToggleButton
                  value={transactionSecurityCheckEnabled}
                  onToggle={this.toggleTransactionSecurityCheck.bind(this)}
                />
              </div>
            </div>
          </div>
        </div>
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

  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  keyringSnapsToggle() {
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
        <Box
          ref={this.settingsRefs[1]}
          className="settings-page__content-row settings-page__content-row-experimental"
          marginBottom={3}
        >
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

              <div className="settings-page__content-item-col settings-page__content-item-col__security-toggle-option">
                <Text
                  variant={TextVariant.bodyMd}
                  as="h5"
                  color={TextColor.textDefault}
                  fontWeight={FontWeight.Medium}
                  marginBottom={0}
                >
                  {t('addSnapAccountToggle')}
                </Text>
                <ToggleButton
                  dataTestId="add-snap-account-toggle"
                  value={addSnapAccountEnabled}
                  onToggle={(value) => {
                    trackEvent({
                      event: MetaMetricsEventName.AddSnapAccountEnabled,
                      category: MetaMetricsEventCategory.Settings,
                      properties: {
                        enabled: !value,
                      },
                    });
                    setAddSnapAccountEnabled(!value);
                  }}
                />
              </div>
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                color={TextColor.textAlternative}
                marginTop={0}
              >
                {t('addSnapAccountsDescription')}
              </Text>
            </div>
          </div>
        </Box>
      </>
    );
  }
  ///: END:ONLY_INCLUDE_IN

  renderKeyringSnapsToggle() {
    let toggle = null;
    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    toggle = this.keyringSnapsToggle();
    ///: END:ONLY_INCLUDE_IN

    ///: BEGIN:ONLY_INCLUDE_IN(build-main)
    if (!showSnapAccountExperimentalToggle()) {
      toggle = null;
    }
    ///: END:ONLY_INCLUDE_IN

    return toggle;
  }

  render() {
    return (
      <div className="settings-page__body">
        {this.renderSecurityAlertsToggle()}
        {
          ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
          this.renderKeyringSnapsToggle()
          ///: END:ONLY_INCLUDE_IN
        }
        {
          ///: BEGIN:ONLY_INCLUDE_IN(desktop)
          this.renderDesktopEnableButton()
          ///: END:ONLY_INCLUDE_IN
        }
      </div>
    );
  }
}
