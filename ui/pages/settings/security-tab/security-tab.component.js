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
} from '../../../../shared/lib/ui-utils';
import SRPQuiz from '../../../components/app/srp-quiz-modal/SRPQuiz';
import {
  Button,
  BUTTON_SIZES,
  Box,
  Text,
} from '../../../components/component-library';
import TextField from '../../../components/ui/text-field';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { ADD_POPULAR_CUSTOM_NETWORK } from '../../../helpers/constants/routes';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';

import IncomingTransactionToggle from '../../../components/app/incoming-trasaction-toggle/incoming-transaction-toggle';

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
    ipfsGateway: PropTypes.string.isRequired,
    useMultiAccountBalanceChecker: PropTypes.bool.isRequired,
    setUseMultiAccountBalanceChecker: PropTypes.func.isRequired,
    useSafeChainsListValidation: PropTypes.bool.isRequired,
    setUseSafeChainsListValidation: PropTypes.func.isRequired,
    useCurrencyRateCheck: PropTypes.bool.isRequired,
    setUseCurrencyRateCheck: PropTypes.func.isRequired,
    useAddressBarEnsResolution: PropTypes.bool.isRequired,
    setUseAddressBarEnsResolution: PropTypes.func.isRequired,
    ///: BEGIN:ONLY_INCLUDE_IF(petnames)
    useExternalNameSources: PropTypes.bool.isRequired,
    setUseExternalNameSources: PropTypes.func.isRequired,
    ///: END:ONLY_INCLUDE_IF
  };

  state = {
    ipfsGateway: this.props.ipfsGateway || IPFS_DEFAULT_GATEWAY_URL,
    ipfsGatewayError: '',
    srpQuizModalVisible: false,
    ipfsToggle: this.props.ipfsGateway.length > 0,
  };

  settingsRefCounter = 0;

  settingsRefs = Array(
    getNumberOfSettingsInSection(
      this.context.t,
      this.context.t('securityAndPrivacy'),
    ),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('securityAndPrivacy'), this.settingsRefs);
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
          ref={this.settingsRefs[0]}
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

  renderIncomingTransactionsOptIn() {
    const {
      incomingTransactionsPreferences,
      allNetworks,
      setIncomingTransactionsPreferences,
    } = this.props;

    return (
      <IncomingTransactionToggle
        wrapperRef={this.settingsRefs[1]}
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
        ref={this.settingsRefs[2]}
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
        ref={this.settingsRefs[3]}
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

  renderMetaMetricsOptIn() {
    const { t } = this.context;
    const { participateInMetaMetrics, setParticipateInMetaMetrics } =
      this.props;

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
          <span>{t('participateInMetaMetrics')}</span>
          <div className="settings-page__content-description">
            <span>{t('participateInMetaMetricsDescription')}</span>
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="participateInMetaMetrics"
        >
          <ToggleButton
            value={participateInMetaMetrics}
            onToggle={(value) => setParticipateInMetaMetrics(!value)}
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
        ref={this.settingsRefs[5]}
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
        ref={this.settingsRefs[2]}
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
        ref={this.settingsRefs[6]}
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
                  this.props.setIpfsGateway('');
                } else {
                  // turning from false to true
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
          ref={this.settingsRefs[10]}
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
        ref={this.settingsRefs[7]}
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
        ref={this.settingsRefs[8]}
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
        ref={this.settingsRefs[9]}
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
        ref={this.settingsRefs[11]}
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
        ref={this.settingsRefs[12]}
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

  ///: BEGIN:ONLY_INCLUDE_IF(petnames)
  renderExternalNameSourcesToggle() {
    const { t } = this.context;
    const { useExternalNameSources, setUseExternalNameSources } = this.props;

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
  ///: END:ONLY_INCLUDE_IF

  render() {
    const { warning } = this.props;

    return (
      <div className="settings-page__body">
        {warning && <div className="settings-tab__error">{warning}</div>}
        <span className="settings-page__security-tab-sub-header__bold">
          {this.context.t('security')}
        </span>
        {this.renderSeedWords()}
        <span className="settings-page__security-tab-sub-header__bold">
          {this.context.t('privacy')}
        </span>

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
        </div>

        <span className="settings-page__security-tab-sub-header">
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

        {
          ///: BEGIN:ONLY_INCLUDE_IF(petnames)
        }
        <span className="settings-page__security-tab-sub-header">
          {this.context.t('settingsSubHeadingSignatures')}
        </span>
        <div className="settings-page__content-padded">
          {this.renderExternalNameSourcesToggle()}
        </div>
        {
          ///: END:ONLY_INCLUDE_IF
        }

        <span className="settings-page__security-tab-sub-header">
          {this.context.t('metrics')}
        </span>
        <div className="settings-page__content-padded">
          {this.renderMetaMetricsOptIn()}
        </div>
      </div>
    );
  }
}
