import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import {
  Text,
  Box,
  Tag,
  ButtonLink,
} from '../../../components/component-library';
import {
  TextColor,
  TextVariant,
  Display,
  FlexDirection,
  JustifyContent,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  FontWeight,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
  AlignItems,
  FlexWrap,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IF(desktop)
import DesktopEnableButton from '../../../components/app/desktop-enable-button';
///: END:ONLY_INCLUDE_IF
import { OPENSEA_TERMS_OF_USE } from '../../../../shared/lib/ui-utils';

export default class ExperimentalTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    transactionSecurityCheckEnabled: PropTypes.bool,
    setTransactionSecurityCheckEnabled: PropTypes.func,
    securityAlertsEnabled: PropTypes.bool,
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    setSecurityAlertsEnabled: PropTypes.func,
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    addSnapAccountEnabled: PropTypes.bool,
    setAddSnapAccountEnabled: PropTypes.func,
    ///: END:ONLY_INCLUDE_IF
    useRequestQueue: PropTypes.bool,
    setUseRequestQueue: PropTypes.func,
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

  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
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
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        blockaid_alerts_enabled: newValue,
      },
    });
    setSecurityAlertsEnabled(newValue);
    if (newValue && transactionSecurityCheckEnabled) {
      this.toggleTransactionSecurityCheck(true);
    }
  }
  ///: END:ONLY_INCLUDE_IF

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
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        opensea_alerts_enabled: newValue,
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
      ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
      securityAlertsEnabled,
      ///: END:ONLY_INCLUDE_IF
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
          <Text variant={TextVariant.inherit} color={TextColor.textAlternative}>
            {t('securityAlerts')}
          </Text>
          <Text variant={TextVariant.bodySm}>
            {t('securityAlertsDescription')}
          </Text>
          <div className="settings-page__content-description">
            {
              ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
              <>
                <Text
                  variant={TextVariant.bodySmBold}
                  color={TextColor.textAlternative}
                  marginTop={4}
                >
                  {t('preferredProvider')}
                </Text>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  justifyContent={JustifyContent.spaceBetween}
                  gap={4}
                  marginTop={3}
                  marginBottom={3}
                  data-testid="settings-toggle-security-alert-blockaid"
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
                </Box>
              </>
              ///: END:ONLY_INCLUDE_IF
            }
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
              gap={4}
              marginTop={3}
              marginBottom={3}
            >
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
                  {t('openSeaMessage', [
                    <ButtonLink
                      variant="bodyMd"
                      href={OPENSEA_TERMS_OF_USE}
                      externalLink
                      key="opensea-terms-of-use"
                    >
                      {t('terms')}
                    </ButtonLink>,
                  ])}
                </Text>
              </div>
              <ToggleButton
                value={transactionSecurityCheckEnabled}
                onToggle={this.toggleTransactionSecurityCheck.bind(this)}
              />
            </Box>
          </div>
        </div>
      </>
    );
  }

  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
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
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
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

              <div className="settings-page__content-item-col">
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

  ///: END:ONLY_INCLUDE_IF
  renderToggleRequestQueue() {
    const { t } = this.context;
    const { useRequestQueue, setUseRequestQueue } = this.props;
    return (
      <Box
        ref={this.settingsRefs[7]}
        className="settings-page__content-row settings-page__content-row-experimental"
        data-testid="experimental-setting-toggle-request-queue"
      >
        <div className="settings-page__content-item">
          <span>{t('toggleRequestQueueField')}</span>
          <div className="settings-page__content-description">
            {t('toggleRequestQueueDescription')}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            className="request-queue-toggle"
            value={useRequestQueue || false}
            onToggle={(value) => setUseRequestQueue(!value)}
            offLabel={t('toggleRequestQueueOff')}
            onLabel={t('toggleRequestQueueOn')}
          />
        </div>
      </Box>
    );
  }

  render() {
    return (
      <div className="settings-page__body">
        {this.renderSecurityAlertsToggle()}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          this.renderKeyringSnapsToggle()
          ///: END:ONLY_INCLUDE_IF
        }
        {
          ///: BEGIN:ONLY_INCLUDE_IF(desktop)
          this.renderDesktopEnableButton()
          ///: END:ONLY_INCLUDE_IF
        }
        {this.renderToggleRequestQueue()}
      </div>
    );
  }
}
