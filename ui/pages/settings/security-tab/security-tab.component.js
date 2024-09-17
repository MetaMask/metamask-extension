import { startCase } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  addUrlProtocolPrefix,
  getEnvironmentType,
} from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../../shared/constants/network';
import {
  AUTO_DETECT_TOKEN_LEARN_MORE_LINK,
  COINGECKO_LINK,
  CONSENSYS_PRIVACY_LINK,
  CRYPTOCOMPARE_LINK,
  PRIVACY_POLICY_LINK,
  SECURITY_ALERTS_LEARN_MORE_LINK,
  TRANSACTION_SIMULATIONS_LEARN_MORE_LINK,
} from '../../../../shared/lib/ui-utils';
import SRPQuiz from '../../../components/app/srp-quiz-modal/SRPQuiz';
import {
  Button,
  BUTTON_SIZES,
  Icon,
  IconSize,
  IconName,
  Box,
  Text,
} from '../../../components/component-library';
import TextField from '../../../components/ui/text-field';
import ToggleButton from '../../../components/ui/toggle-button';
import Popover from '../../../components/ui/popover';
import {
  Display,
  BlockSize,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
  IconColor,
} from '../../../helpers/constants/design-system';
import { ADD_POPULAR_CUSTOM_NETWORK } from '../../../helpers/constants/routes';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';

import IncomingTransactionToggle from '../../../components/app/incoming-trasaction-toggle/incoming-transaction-toggle';
import ProfileSyncToggle from './profile-sync-toggle';
import MetametricsToggle from './metametrics-toggle';

export default class SecurityTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    warning: PropTypes.string,
    history: PropTypes.object,
    openSeaEnabled: PropTypes.bool,
    setOpenSeaEnabled: PropTypes.func,
    useNftDetection: PropTypes.bool,
    setUseNftDetection: PropTypes.func,
    dataCollectionForMarketing: PropTypes.bool,
    setDataCollectionForMarketing: PropTypes.func.isRequired,
    participateInMetaMetrics: PropTypes.bool.isRequired,
    setParticipateInMetaMetrics: PropTypes.func.isRequired,
    incomingTransactionsPreferences: PropTypes.object.isRequired,
    allNetworks: PropTypes.array.isRequired,
    setIncomingTransactionsPreferences: PropTypes.func.isRequired,
    setUsePhishDetect: PropTypes.func.isRequired,
    usePhishDetect: PropTypes.bool.isRequired,
    setUse4ByteResolution: PropTypes.func.isRequired,
    use4ByteResolution: PropTypes.bool.isRequired,
    useTokenDetection: PropTypes.bool.isRequired,
    setUseTokenDetection: PropTypes.func.isRequired,
    setIpfsGateway: PropTypes.func.isRequired,
    setIsIpfsGatewayEnabled: PropTypes.func.isRequired,
    ipfsGateway: PropTypes.string.isRequired,
    useMultiAccountBalanceChecker: PropTypes.bool.isRequired,
    setUseMultiAccountBalanceChecker: PropTypes.func.isRequired,
    useSafeChainsListValidation: PropTypes.bool.isRequired,
    setUseSafeChainsListValidation: PropTypes.func.isRequired,
    useCurrencyRateCheck: PropTypes.bool.isRequired,
    setUseCurrencyRateCheck: PropTypes.func.isRequired,
    useAddressBarEnsResolution: PropTypes.bool.isRequired,
    setUseAddressBarEnsResolution: PropTypes.func.isRequired,
    useExternalNameSources: PropTypes.bool.isRequired,
    setUseExternalNameSources: PropTypes.func.isRequired,
    setBasicFunctionalityModalOpen: PropTypes.func.isRequired,
    setUseTransactionSimulations: PropTypes.func.isRequired,
    useTransactionSimulations: PropTypes.bool.isRequired,
    petnamesEnabled: PropTypes.bool.isRequired,
    securityAlertsEnabled: PropTypes.bool,
    useExternalServices: PropTypes.bool,
    toggleExternalServices: PropTypes.func.isRequired,
    setSecurityAlertsEnabled: PropTypes.func,
  };

  state = {
    ipfsGateway: this.props.ipfsGateway || IPFS_DEFAULT_GATEWAY_URL,
    ipfsGatewayError: '',
    srpQuizModalVisible: false,
    showDataCollectionDisclaimer: false,
    ipfsToggle: this.props.ipfsGateway.length > 0,
  };

  settingsRefCounter = 0;

  settingsRefs = Array(
    getNumberOfSettingRoutesInTab(
      this.context.t,
      this.context.t('securityAndPrivacy'),
    ),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  componentDidUpdate(prevProps) {
    const { t } = this.context;
    handleSettingsRefs(t, t('securityAndPrivacy'), this.settingsRefs);

    if (
      prevProps.dataCollectionForMarketing === true &&
      this.props.participateInMetaMetrics === true &&
      this.props.dataCollectionForMarketing === false
    ) {
      this.setState({ showDataCollectionDisclaimer: true });
    }
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('securityAndPrivacy'), this.settingsRefs);
  }

  toggleSetting(value, eventName, eventAction, toggleMethod) {
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: eventName,
      properties: {
        action: eventAction,
        legacy_event: true,
      },
    });
    toggleMethod(!value);
  }

  hideSrpQuizModal = () => this.setState({ srpQuizModalVisible: false });

  renderSeedWords() {
    const { t } = this.context;

    return (
      <>
        <div
          ref={this.settingsRefs[1]}
          className="settings-page__security-tab-sub-header"
        >
          {t('secretRecoveryPhrase')}
        </div>
        <div className="settings-page__content-padded">
          <Button
            data-testid="reveal-seed-words"
            type="danger"
            size={BUTTON_SIZES.LG}
            onClick={(event) => {
              event.preventDefault();
              this.context.trackEvent({
                category: MetaMetricsEventCategory.Settings,
                event: MetaMetricsEventName.KeyExportSelected,
                properties: {
                  key_type: MetaMetricsEventKeyType.Srp,
                  location: 'Settings',
                },
              });
              this.context.trackEvent({
                category: MetaMetricsEventCategory.Settings,
                event: MetaMetricsEventName.SrpRevealClicked,
                properties: {
                  key_type: MetaMetricsEventKeyType.Srp,
                  location: 'Settings',
                },
              });
              this.setState({ srpQuizModalVisible: true });
            }}
          >
            {t('revealSeedWords')}
          </Button>
          {this.state.srpQuizModalVisible && (
            <SRPQuiz
              isOpen={this.state.srpQuizModalVisible}
              onClose={this.hideSrpQuizModal}
            />
          )}
        </div>
      </>
    );
  }

  renderSecurityAlertsToggle() {
    const { t } = this.context;
    const { securityAlertsEnabled } = this.props;

    return (
      <>
        <div ref={this.settingsRefs[16]}>
          <span className="settings-page__security-tab-sub-header">
            {t('securityAlerts')}
          </span>
        </div>
        <div className="settings-page__content-padded">
          <Box
            ref={this.settingsRefs[3]}
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
                onToggle={this.toggleSecurityAlert.bind(this)}
                offLabel={t('off')}
                onLabel={t('on')}
              />
            </div>
          </Box>
        </div>
      </>
    );
  }

  renderIncomingTransactionsOptIn() {
    const {
      incomingTransactionsPreferences,
      allNetworks,
      setIncomingTransactionsPreferences,
    } = this.props;

    return (
      <IncomingTransactionToggle
        wrapperRef={this.settingsRefs[2]}
        allNetworks={allNetworks}
        setIncomingTransactionsPreferences={setIncomingTransactionsPreferences}
        incomingTransactionsPreferences={incomingTransactionsPreferences}
      />
    );
  }

  renderPhishingDetectionToggle() {
    const { t } = this.context;
    const { usePhishDetect, setUsePhishDetect } = this.props;

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
          <span>{t('usePhishingDetection')}</span>
          <div className="settings-page__content-description">
            {t('usePhishingDetectionDescription')}
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="usePhishingDetection"
        >
          <ToggleButton
            value={usePhishDetect}
            onToggle={(value) => setUsePhishDetect(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderUse4ByteResolutionToggle() {
    const { t } = this.context;
    const { use4ByteResolution, setUse4ByteResolution } = this.props;
    return (
      <Box
        ref={this.settingsRefs[4]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('use4ByteResolution')}</span>
          <div className="settings-page__content-description">
            {t('use4ByteResolutionDescription')}
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="4byte-resolution-container"
        >
          <ToggleButton
            value={use4ByteResolution}
            onToggle={(value) => setUse4ByteResolution(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderDataCollectionForMarketing() {
    const { t } = this.context;
    const {
      dataCollectionForMarketing,
      participateInMetaMetrics,
      setDataCollectionForMarketing,
      setParticipateInMetaMetrics,
    } = this.props;

    return (
      <Box
        ref={this.settingsRefs[19]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('dataCollectionForMarketing')}</span>
          <div className="settings-page__content-description">
            <span>{t('dataCollectionForMarketingDescription')}</span>
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="dataCollectionForMarketing"
        >
          <ToggleButton
            value={dataCollectionForMarketing}
            onToggle={(value) => {
              setDataCollectionForMarketing(!value);
              if (participateInMetaMetrics) {
                this.context.trackEvent({
                  category: MetaMetricsEventCategory.Settings,
                  event: MetaMetricsEventName.AnalyticsPreferenceSelected,
                  properties: {
                    is_metrics_opted_in: true,
                    has_marketing_consent: false,
                    location: 'Settings',
                  },
                });
              } else {
                setParticipateInMetaMetrics(true);
              }
            }}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderChooseYourNetworkButton() {
    const { t } = this.context;

    return (
      <Box
        className="settings-page__content-row"
        data-testid="advanced-setting-choose-your-network"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('chooseYourNetwork')}</span>
          <div className="settings-page__content-description">
            {t('chooseYourNetworkDescription', [
              // TODO: Update to use real link
              <a
                href={CONSENSYS_PRIVACY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                key="cyn-consensys-privacy-link"
              >
                {t('privacyMsg')}
              </a>,
            ])}
          </div>
        </div>
        <div className="settings-page__content-item-col">
          <Button
            type="secondary"
            className="settings-page__button"
            onClick={() => {
              getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                ? global.platform.openExtensionInBrowser(
                    ADD_POPULAR_CUSTOM_NETWORK,
                  )
                : this.props.history.push(ADD_POPULAR_CUSTOM_NETWORK);
            }}
          >
            {t('addCustomNetwork')}
          </Button>
        </div>
      </Box>
    );
  }

  renderSafeChainsListValidationToggle() {
    const { t } = this.context;
    const { useSafeChainsListValidation, setUseSafeChainsListValidation } =
      this.props;

    const useSafeChainsListValidationWebsite = t(
      'useSafeChainsListValidationWebsite',
    );

    return (
      <Box
        ref={this.settingsRefs[14]}
        className="settings-page__content-row"
        data-testid="setting-safe-chains-validation"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <Box
          className="settings-page__content-row"
          gap={4}
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
        >
          <div className="settings-page__content-item">
            <span>{t('useSafeChainsListValidation')}</span>
            <div className="settings-page__content-description">
              {t('useSafeChainsListValidationDescription', [
                <b key="safechain-list-validation-website">
                  {useSafeChainsListValidationWebsite}
                </b>,
              ])}
            </div>
          </div>

          <div
            className="settings-page__content-item-col"
            data-testid="useSafeChainsListValidation"
          >
            <ToggleButton
              value={useSafeChainsListValidation}
              onToggle={(value) => setUseSafeChainsListValidation(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </Box>
      </Box>
    );
  }

  renderIpfsGatewayControl() {
    const { t } = this.context;
    let ipfsError = '';

    const handleIpfsGatewayChange = (url) => {
      if (url.length > 0) {
        try {
          const validUrl = addUrlProtocolPrefix(url);

          if (!validUrl) {
            ipfsError = t('invalidIpfsGateway');
          }

          const urlObj = new URL(validUrl);

          // don't allow the use of this gateway
          if (urlObj.host === 'gateway.ipfs.io') {
            ipfsError = t('forbiddenIpfsGateway');
          }

          if (ipfsError.length === 0) {
            this.props.setIpfsGateway(urlObj.host);
          }
        } catch (error) {
          ipfsError = t('invalidIpfsGateway');
        }
      } else {
        ipfsError = t('invalidIpfsGateway');
      }

      this.setState({
        ipfsGateway: url,
        ipfsGatewayError: ipfsError,
      });
    };

    return (
      <Box
        ref={this.settingsRefs[7]}
        className="settings-page__content-row"
        data-testid="setting-ipfs-gateway"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <Box
          className="settings-page__content-row"
          gap={4}
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
        >
          <div className="settings-page__content-item">
            <span>{t('ipfsGateway')}</span>
            <div className="settings-page__content-description">
              {t('ipfsGatewayDescription')}
            </div>
          </div>
          <div
            className="settings-page__content-item-col"
            data-testid="ipfsToggle"
          >
            <ToggleButton
              value={this.state.ipfsToggle}
              onToggle={(value) => {
                if (value) {
                  // turning from true to false
                  this.props.setIsIpfsGatewayEnabled(false);
                  this.props.setIpfsGateway('');
                } else {
                  // turning from false to true
                  this.props.setIsIpfsGatewayEnabled(true);
                  handleIpfsGatewayChange(this.state.ipfsGateway);
                }

                this.setState({ ipfsToggle: !value });
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </Box>
        {this.state.ipfsToggle && (
          <div className="settings-page__content-item">
            <span>{t('addIPFSGateway')}</span>
            <div className="settings-page__content-item-col">
              <TextField
                type="text"
                value={this.state.ipfsGateway}
                onChange={(e) => handleIpfsGatewayChange(e.target.value)}
                error={this.state.ipfsGatewayError}
                fullWidth
                margin="dense"
              />
            </div>
          </div>
        )}
        <Box
          className="settings-page__content-row"
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          gap={4}
          ref={this.settingsRefs[11]}
          marginTop={3}
          id="ens-domains"
        >
          <div>
            {t('ensDomainsSettingTitle')}
            <div className="settings-page__content-description">
              <Text color={TextColor.inherit} variant={TextVariant.inherit}>
                {t('ensDomainsSettingDescriptionIntroduction')}
              </Text>
              <Box
                as="ul"
                marginTop={4}
                marginBottom={4}
                paddingInlineStart={4}
                style={{ listStyleType: 'circle' }}
              >
                <Text
                  as="li"
                  color={TextColor.inherit}
                  variant={TextVariant.inherit}
                >
                  {t('ensDomainsSettingDescriptionPart1')}
                </Text>
                <Text
                  as="li"
                  color={TextColor.inherit}
                  variant={TextVariant.inherit}
                >
                  {t('ensDomainsSettingDescriptionPart2')}
                </Text>
              </Box>
              <Text color={TextColor.inherit} variant={TextVariant.inherit}>
                {t('ensDomainsSettingDescriptionOutroduction')}
              </Text>
            </div>
          </div>

          <div
            className="settings-page__content-item-col"
            data-testid="ipfs-gateway-resolution-container"
          >
            <ToggleButton
              value={this.props.useAddressBarEnsResolution}
              onToggle={(value) =>
                this.props.setUseAddressBarEnsResolution(!value)
              }
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </Box>
      </Box>
    );
  }

  renderAutoDetectTokensToggle() {
    const { t } = this.context;
    const { useTokenDetection, setUseTokenDetection } = this.props;

    return (
      <Box
        ref={this.settingsRefs[8]}
        className="settings-page__content-row"
        data-testid="advanced-setting-gas-fee-estimation"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
        id="advanced-settings-autodetect-tokens"
      >
        <div className="settings-page__content-item">
          <span>{t('autoDetectTokens')}</span>
          <div className="settings-page__content-description">
            {t('autoDetectTokensDescription', [
              // TODO: Update to use real link
              <a
                href={AUTO_DETECT_TOKEN_LEARN_MORE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                key="cyn-consensys-privacy-link"
              >
                {startCase(t('learnMore'))}
              </a>,
            ])}
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="autoDetectTokens"
        >
          <ToggleButton
            value={useTokenDetection}
            onToggle={(value) => {
              this.toggleSetting(
                value,
                MetaMetricsEventName.KeyAutoDetectTokens,
                MetaMetricsEventName.KeyAutoDetectTokens,
                setUseTokenDetection,
              );
            }}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderBatchAccountBalanceRequestsToggle() {
    const { t } = this.context;
    const { useMultiAccountBalanceChecker, setUseMultiAccountBalanceChecker } =
      this.props;

    return (
      <Box
        ref={this.settingsRefs[9]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('useMultiAccountBalanceChecker')}</span>
          <div className="settings-page__content-description">
            {t('useMultiAccountBalanceCheckerSettingDescription')}
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="useMultiAccountBalanceChecker"
        >
          <ToggleButton
            value={useMultiAccountBalanceChecker}
            onToggle={(value) => {
              this.toggleSetting(
                value,
                MetaMetricsEventName.KeyBatchAccountBalanceRequests,
                MetaMetricsEventName.KeyBatchAccountBalanceRequests,
                setUseMultiAccountBalanceChecker,
              );
            }}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderCurrencyRateCheckToggle() {
    const { t } = this.context;
    const { useCurrencyRateCheck, setUseCurrencyRateCheck } = this.props;

    return (
      <Box
        ref={this.settingsRefs[10]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('currencyRateCheckToggle')}</span>
          <div className="settings-page__content-description">
            {t('currencyRateCheckToggleDescription', [
              <a
                key="coingecko_link"
                href={COINGECKO_LINK}
                rel="noreferrer"
                target="_blank"
              >
                {t('coingecko')}
              </a>,
              <a
                key="cryptocompare_link"
                href={CRYPTOCOMPARE_LINK}
                rel="noreferrer"
                target="_blank"
              >
                {t('cryptoCompare')}
              </a>,
              <a
                key="privacy_policy_link"
                href={PRIVACY_POLICY_LINK}
                rel="noreferrer"
                target="_blank"
              >
                {t('privacyMsg')}
              </a>,
            ])}
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="currencyRateCheckToggle"
        >
          <ToggleButton
            value={useCurrencyRateCheck}
            onToggle={(value) => setUseCurrencyRateCheck(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderDisplayNftMediaToggle() {
    const { t } = this.context;
    const {
      openSeaEnabled,
      setOpenSeaEnabled,
      useNftDetection,
      setUseNftDetection,
    } = this.props;

    return (
      <Box
        ref={this.settingsRefs[12]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
        id="display-nft-media"
      >
        <div className="settings-page__content-item">
          <span>{t('displayNftMedia')}</span>
          <div className="settings-page__content-description">
            {t('displayNftMediaDescription')}
          </div>
        </div>
        <div
          className="settings-page__content-item-col"
          data-testid="displayNftMedia"
        >
          <ToggleButton
            value={openSeaEnabled}
            onToggle={(value) => {
              this.context.trackEvent({
                category: MetaMetricsEventCategory.Settings,
                event: 'Enabled/Disable OpenSea',
                properties: {
                  action: 'Enabled/Disable OpenSea',
                  legacy_event: true,
                },
              });
              // value is positive when being toggled off
              if (value && useNftDetection) {
                setUseNftDetection(false);
              }
              setOpenSeaEnabled(!value);
            }}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderNftDetectionToggle() {
    const { t } = this.context;
    const {
      openSeaEnabled,
      setOpenSeaEnabled,
      useNftDetection,
      setUseNftDetection,
    } = this.props;
    return (
      <Box
        ref={this.settingsRefs[13]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('useNftDetection')}</span>
          <div className="settings-page__content-description">
            {t('useNftDetectionDescriptionText')}
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="useNftDetection"
        >
          <ToggleButton
            value={useNftDetection}
            onToggle={(value) => {
              this.context.trackEvent({
                category: MetaMetricsEventCategory.Settings,
                event: 'NFT Detected',
                properties: {
                  action: 'NFT Detected',
                  legacy_event: true,
                },
              });
              if (!value && !openSeaEnabled) {
                setOpenSeaEnabled(!value);
              }
              setUseNftDetection(!value);
            }}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderExternalNameSourcesToggle() {
    const { t } = this.context;
    const { useExternalNameSources, setUseExternalNameSources } = this.props;

    return (
      <Box
        ref={this.settingsRefs[15]}
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

  renderSimulationsToggle() {
    const { t } = this.context;
    const { useTransactionSimulations, setUseTransactionSimulations } =
      this.props;

    return (
      <Box
        ref={this.settingsRefs[18]}
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
          />
        </div>
      </Box>
    );
  }

  /**
   * toggleSecurityAlert
   *
   * @param {boolean} oldValue - the current securityAlertEnabled value.
   */
  toggleSecurityAlert(oldValue) {
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
  }

  renderUseExternalServices() {
    const { t } = this.context;
    const {
      useExternalServices,
      toggleExternalServices,
      setBasicFunctionalityModalOpen,
    } = this.props;

    return (
      <Box
        ref={this.settingsRefs[0]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
        data-testid="advanced-setting-show-testnet-conversion"
      >
        <div className="settings-page__content-item">
          <span>{t('basicConfigurationLabel')}</span>
          <div className="settings-page__content-description">
            {t('basicConfigurationDescription', [
              <a
                href="https://consensys.io/privacy-policy"
                key="link"
                target="_blank"
                rel="noreferrer noopener"
              >
                {t('privacyMsg')}
              </a>,
            ])}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={useExternalServices}
            onToggle={() => {
              if (useExternalServices) {
                // If we are going to be disabling external services, then we want to show the "turn off" warning modal
                setBasicFunctionalityModalOpen();
              } else {
                toggleExternalServices(true);
                this.context.trackEvent({
                  category: MetaMetricsEventCategory.Settings,
                  event: MetaMetricsEventName.SettingsUpdated,
                  properties: {
                    settings_group: 'security_privacy',
                    settings_type: 'basic_functionality',
                    old_value: false,
                    new_value: true,
                    // these values will always be set to false
                    // when basic functionality is re-enabled
                    was_notifications_on: false,
                    was_profile_syncing_on: false,
                  },
                });
              }
            }}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderDataCollectionWarning = () => {
    const { t } = this.context;

    return (
      <Popover
        wrapTitle
        centerTitle
        onClose={() => this.setState({ showDataCollectionDisclaimer: false })}
        title={
          <Icon
            size={IconSize.Xl}
            name={IconName.Danger}
            color={IconColor.warningDefault}
          />
        }
        footer={
          <Button
            width={BlockSize.Full}
            type="primary"
            onClick={() =>
              this.setState({ showDataCollectionDisclaimer: false })
            }
          >
            {t('dataCollectionWarningPopoverButton')}
          </Button>
        }
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
          margin={4}
        >
          <Text>{t('dataCollectionWarningPopoverDescription')}</Text>
        </Box>
      </Popover>
    );
  };

  render() {
    const {
      warning,
      petnamesEnabled,
      dataCollectionForMarketing,
      setDataCollectionForMarketing,
    } = this.props;
    const { showDataCollectionDisclaimer } = this.state;

    return (
      <div className="settings-page__body">
        {this.renderUseExternalServices()}
        {showDataCollectionDisclaimer
          ? this.renderDataCollectionWarning()
          : null}

        {warning && <div className="settings-tab__error">{warning}</div>}
        <span className="settings-page__security-tab-sub-header__bold">
          {this.context.t('security')}
        </span>
        {this.renderSeedWords()}
        {this.renderSecurityAlertsToggle()}
        <span className="settings-page__security-tab-sub-header__bold">
          {this.context.t('privacy')}
        </span>

        <div className="settings-page__content-padded">
          <ProfileSyncToggle />
        </div>

        <div>
          <span className="settings-page__security-tab-sub-header">
            {this.context.t('alerts')}
          </span>
        </div>
        <div className="settings-page__content-padded">
          {this.renderPhishingDetectionToggle()}
        </div>

        <div>
          <span className="settings-page__security-tab-sub-header">
            {this.context.t('smartContracts')}
          </span>
        </div>
        <div className="settings-page__content-padded">
          {this.renderUse4ByteResolutionToggle()}
        </div>

        <span className="settings-page__security-tab-sub-header">
          {this.context.t('transactions')}
        </span>
        <div className="settings-page__content-padded">
          {this.renderCurrencyRateCheckToggle()}
          {this.renderIncomingTransactionsOptIn()}
          {this.renderSimulationsToggle()}
        </div>

        <span
          className="settings-page__security-tab-sub-header"
          ref={this.settingsRefs[6]}
        >
          {this.context.t('networkProvider')}
        </span>
        <div className="settings-page__content-padded">
          {this.renderChooseYourNetworkButton()}
          {this.renderSafeChainsListValidationToggle()}
          {this.renderIpfsGatewayControl()}
        </div>

        <span className="settings-page__security-tab-sub-header">
          {this.context.t('tokenAutoDetection')}
        </span>
        <div className="settings-page__content-padded">
          {this.renderAutoDetectTokensToggle()}
          {this.renderBatchAccountBalanceRequestsToggle()}
          {this.renderDisplayNftMediaToggle()}
          {this.renderNftDetectionToggle()}
        </div>

        {petnamesEnabled && (
          <>
            <span className="settings-page__security-tab-sub-header">
              {this.context.t('settingsSubHeadingSignaturesAndTransactions')}
            </span>
            <div className="settings-page__content-padded">
              {this.renderExternalNameSourcesToggle()}
            </div>
          </>
        )}

        <span className="settings-page__security-tab-sub-header">
          {this.context.t('metrics')}
        </span>
        <div className="settings-page__content-padded">
          <MetametricsToggle
            dataCollectionForMarketing={dataCollectionForMarketing}
            setDataCollectionForMarketing={setDataCollectionForMarketing}
          />
          {this.renderDataCollectionForMarketing()}
        </div>
      </div>
    );
  }
}
