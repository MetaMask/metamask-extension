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
  ETHERSCAN_PRIVACY_LINK,
  PRIVACY_POLICY_LINK,
} from '../../../../shared/lib/ui-utils';
import SRPQuiz from '../../../components/app/srp-quiz-modal/SRPQuiz';
import {
  BUTTON_SIZES,
  Button,
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
    showIncomingTransactions: PropTypes.bool.isRequired,
    setShowIncomingTransactionsFeatureFlag: PropTypes.func.isRequired,
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
    useCurrencyRateCheck: PropTypes.bool.isRequired,
    setUseCurrencyRateCheck: PropTypes.func.isRequired,
    useAddressBarEnsResolution: PropTypes.bool.isRequired,
    setUseAddressBarEnsResolution: PropTypes.func.isRequired,
  };

  state = {
    ipfsGateway: this.props.ipfsGateway,
    ipfsGatewayError: '',
    srpQuizModalVisible: false,
    ipfsToggle: false,
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
    const { t } = this.context;
    const { showIncomingTransactions, setShowIncomingTransactionsFeatureFlag } =
      this.props;

    return (
      <Box
        ref={this.settingsRefs[1]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
      >
        <div className="settings-page__content-item">
          <span>{t('showIncomingTransactions')}</span>
          <div className="settings-page__content-description">
            {t('showIncomingTransactionsDescription', [
              // TODO: Update to use real link
              <a
                href={ETHERSCAN_PRIVACY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                key="etherscan-privacy-link"
              >
                {t('etherscan')}
              </a>,
              // TODO: Update to use real link
              <a
                href={CONSENSYS_PRIVACY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                key="ic-consensys-privacy-link"
              >
                {t('privacyMsg')}
              </a>,
            ])}
          </div>
        </div>
        <div
          className="settings-page__content-item-col"
          data-testid="showIncomingTransactions"
        >
          <ToggleButton
            value={showIncomingTransactions}
            onToggle={(value) => setShowIncomingTransactionsFeatureFlag(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
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
      <div ref={this.settingsRefs[3]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('use4ByteResolution')}</span>
          <div className="settings-page__content-description">
            {t('use4ByteResolutionDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
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
        </div>
      </div>
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

  renderIpfsGatewayControl() {
    const { t } = this.context;
    const { ipfsGatewayError } = this.state;
    const { useAddressBarEnsResolution, setUseAddressBarEnsResolution } =
      this.props;

    const handleIpfsGatewaySave = (gateway) => {
      const url = gateway ? new URL(addUrlProtocolPrefix(gateway)) : '';
      const { host } = url;

      this.props.setIpfsGateway(host);
    };

    const handleIpfsGatewayChange = (url) => {
      this.setState(() => {
        let ipfsError = '';

        try {
          const urlObj = new URL(addUrlProtocolPrefix(url));
          if (!urlObj.host) {
            throw new Error();
          }

          // don't allow the use of this gateway
          if (urlObj.host === 'gateway.ipfs.io') {
            throw new Error('Forbidden gateway');
          }
        } catch (error) {
          ipfsError =
            error.message === 'Forbidden gateway'
              ? t('forbiddenIpfsGateway')
              : t('invalidIpfsGateway');
        }

        handleIpfsGatewaySave(url);
        return {
          ipfsGateway: url,
          ipfsGatewayError: ipfsError,
        };
      });
    };

    const handleIpfsToggle = (url) => {
      url?.length < 1
        ? handleIpfsGatewayChange(IPFS_DEFAULT_GATEWAY_URL)
        : handleIpfsGatewayChange('');
    };
    return (
      <Box
        ref={this.settingsRefs[6]}
        className="settings-page__content-row"
        data-testid="setting-ipfs-gateway"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <div className="settings-page__content-item">
          <span>{t('ipfsGateway')}</span>
          <div className="settings-page__content-description">
            {t('ipfsGatewayDescription')}
          </div>
        </div>
        <div className="settings-page__content-item-col">
          <ToggleButton
            value={this.state.ipfsGateway}
            onToggle={(value) => {
              handleIpfsToggle(value);
              this.setState({ ipfsToggle: Boolean(value) });
            }}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
        {!this.state.ipfsToggle && (
          <div className="settings-page__content-item">
            <span>{t('addIPFSGateway')}</span>
            <div className="settings-page__content-item-col">
              <TextField
                type="text"
                disabled={!this.state.ipfsGateway}
                value={this.state.ipfsGateway}
                onChange={(e) => handleIpfsGatewayChange(e.target.value)}
                error={ipfsGatewayError}
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
          ref={this.settingsRefs[10]}
          marginTop={3}
          id="ens-domains"
        >
          <div>
            {t('ensDomainsSettingTitle')}
            <div className="settings-page__content-description">
              <Text color={TextColor.inherit} variant={TextVariant.inherit}>
                {t('ensDomainsSettingDescriptionIntro')}
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
                  {t('ensDomainsSettingDescriptionPoint1')}
                </Text>
                <Text
                  as="li"
                  color={TextColor.inherit}
                  variant={TextVariant.inherit}
                >
                  {t('ensDomainsSettingDescriptionPoint2')}
                </Text>
                <Text
                  as="li"
                  color={TextColor.inherit}
                  variant={TextVariant.inherit}
                >
                  {t('ensDomainsSettingDescriptionPoint3')}
                </Text>
              </Box>
              <Text color={TextColor.inherit} variant={TextVariant.inherit}>
                {t('ensDomainsSettingDescriptionOutro')}
              </Text>
            </div>
          </div>

          <div
            className="settings-page__content-item-col"
            data-testid="ipfs-gateway-resolution-container"
          >
            <ToggleButton
              value={useAddressBarEnsResolution}
              onToggle={(value) => setUseAddressBarEnsResolution(!value)}
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

  renderOpenSeaEnabledToggle() {
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
      >
        <div className="settings-page__content-item">
          <span>{t('useNftDetection')}</span>
          <div className="settings-page__content-description">
            <Text color={TextColor.textAlternative}>
              {t('useNftDetectionDescription')}
            </Text>
            <ul className="settings-page__content-unordered-list">
              <li>{t('useNftDetectionDescriptionLine2')}</li>
              <li>{t('useNftDetectionDescriptionLine3')}</li>
              <li>{t('useNftDetectionDescriptionLine4')}</li>
            </ul>
            <Text color={TextColor.textAlternative} paddingTop={4}>
              {t('useNftDetectionDescriptionLine5')}
            </Text>
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
          {this.renderIpfsGatewayControl()}
        </div>
        <span className="settings-page__security-tab-sub-header">
          {this.context.t('tokenAutoDetection')}
        </span>
        <div className="settings-page__content-padded">
          {this.renderAutoDetectTokensToggle()}
          {this.renderBatchAccountBalanceRequestsToggle()}
          {this.renderOpenSeaEnabledToggle()}
          {this.renderNftDetectionToggle()}
        </div>
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
