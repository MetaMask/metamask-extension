import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { startCase } from 'lodash';
import ToggleButton from '../../../components/ui/toggle-button';
import TextField from '../../../components/ui/text-field';
import {
  ADD_POPULAR_CUSTOM_NETWORK,
  REVEAL_SEED_ROUTE,
} from '../../../helpers/constants/routes';
import Button from '../../../components/ui/button';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import {
  COINGECKO_LINK,
  CRYPTOCOMPARE_LINK,
  PRIVACY_POLICY_LINK,
  AUTO_DETECT_TOKEN_LEARN_MORE_LINK,
  CONSENSYS_PRIVACY_LINK,
  ETHERSCAN_PRIVACY_LINK,
} from '../../../../shared/lib/ui-utils';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import {
  addUrlProtocolPrefix,
  getEnvironmentType,
} from '../../../../app/scripts/lib/util';

export default class SecurityTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    warning: PropTypes.string,
    history: PropTypes.object,
    participateInMetaMetrics: PropTypes.bool.isRequired,
    setParticipateInMetaMetrics: PropTypes.func.isRequired,
    showIncomingTransactions: PropTypes.bool.isRequired,
    setShowIncomingTransactionsFeatureFlag: PropTypes.func.isRequired,
    setUsePhishDetect: PropTypes.func.isRequired,
    usePhishDetect: PropTypes.bool.isRequired,
    useTokenDetection: PropTypes.bool.isRequired,
    setUseTokenDetection: PropTypes.func.isRequired,
    setIpfsGateway: PropTypes.func.isRequired,
    ipfsGateway: PropTypes.string.isRequired,
    useMultiAccountBalanceChecker: PropTypes.bool.isRequired,
    setUseMultiAccountBalanceChecker: PropTypes.func.isRequired,
    useCurrencyRateCheck: PropTypes.bool.isRequired,
    setUseCurrencyRateCheck: PropTypes.func.isRequired,
    useNftDetection: PropTypes.bool,
    setUseNftDetection: PropTypes.func,
    setOpenSeaEnabled: PropTypes.func,
    openSeaEnabled: PropTypes.bool,
  };

  state = {
    ipfsGateway: this.props.ipfsGateway,
    ipfsGatewayError: '',
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
      category: EVENT.CATEGORIES.SETTINGS,
      event: eventName,
      properties: {
        action: eventAction,
        legacy_event: true,
      },
    });
    toggleMethod(!value);
  }

  renderSeedWords() {
    const { t } = this.context;
    const { history } = this.props;

    return (
      <div ref={this.settingsRefs[0]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('revealSeedWords')}</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              data-testid="reveal-seed-words"
              type="danger"
              large
              onClick={(event) => {
                event.preventDefault();
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.SETTINGS,
                  event: EVENT_NAMES.KEY_EXPORT_SELECTED,
                  properties: {
                    key_type: EVENT.KEY_TYPES.SRP,
                    location: 'Settings',
                  },
                });
                history.push(REVEAL_SEED_ROUTE);
              }}
            >
              {t('revealSeedWords')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderIncomingTransactionsOptIn() {
    const { t } = this.context;
    const { showIncomingTransactions, setShowIncomingTransactionsFeatureFlag } =
      this.props;

    return (
      <div ref={this.settingsRefs[1]} className="settings-page__content-row">
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
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={showIncomingTransactions}
              onToggle={(value) =>
                setShowIncomingTransactionsFeatureFlag(!value)
              }
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderPhishingDetectionToggle() {
    const { t } = this.context;
    const { usePhishDetect, setUsePhishDetect } = this.props;

    return (
      <div ref={this.settingsRefs[2]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('usePhishingDetection')}</span>
          <div className="settings-page__content-description">
            {t('usePhishingDetectionDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={usePhishDetect}
              onToggle={(value) => setUsePhishDetect(!value)}
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
      <div ref={this.settingsRefs[3]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('participateInMetaMetrics')}</span>
          <div className="settings-page__content-description">
            <span>{t('participateInMetaMetricsDescription')}</span>
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={participateInMetaMetrics}
              onToggle={(value) => setParticipateInMetaMetrics(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderChooseYourNetworkButton() {
    const { t } = this.context;

    return (
      <div
        ref={this.settingsRefs[5]}
        className="settings-page__content-row"
        data-testid="advanced-setting-choose-your-network"
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
        <div className="settings-page__content-item">
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
        </div>
      </div>
    );
  }

  renderIpfsGatewayControl() {
    const { t } = this.context;
    const { ipfsGatewayError } = this.state;

    const handleIpfsGatewaySave = (gateway) => {
      const url = new URL(addUrlProtocolPrefix(gateway));
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

    return (
      <div
        ref={this.settingsRefs[6]}
        className="settings-page__content-row"
        data-testid="setting-ipfs-gateway"
      >
        <div className="settings-page__content-item">
          <span>{t('addCustomIPFSGateway')}</span>
          <div className="settings-page__content-description">
            {t('addCustomIPFSGatewayDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="text"
              value={this.state.ipfsGateway}
              onChange={(e) => handleIpfsGatewayChange(e.target.value)}
              error={ipfsGatewayError}
              fullWidth
              margin="dense"
            />
          </div>
        </div>
      </div>
    );
  }

  renderAutoDectectTokensToggle() {
    const { t } = this.context;
    const { useTokenDetection, setUseTokenDetection } = this.props;

    return (
      <div
        ref={this.settingsRefs[4]}
        className="settings-page__content-row"
        data-testid="advanced-setting-gas-fee-estimation"
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
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useTokenDetection}
              onToggle={(value) => {
                this.toggleSetting(
                  value,
                  EVENT_NAMES.KEY_AUTO_DETECT_TOKENS,
                  EVENT_NAMES.KEY_AUTO_DETECT_TOKENS,
                  setUseTokenDetection,
                );
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderBatchAccountBalanceRequestsToggle() {
    const { t } = this.context;
    const { useMultiAccountBalanceChecker, setUseMultiAccountBalanceChecker } =
      this.props;

    return (
      <div ref={this.settingsRefs[8]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('useMultiAccountBalanceChecker')}</span>
          <div className="settings-page__content-description">
            {t('useMultiAccountBalanceCheckerDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useMultiAccountBalanceChecker}
              onToggle={(value) => {
                this.toggleSetting(
                  value,
                  EVENT_NAMES.KEY_BATCH_ACCOUNT_BALANCE_REQUESTS,
                  EVENT_NAMES.KEY_BATCH_ACCOUNT_BALANCE_REQUESTS,
                  setUseMultiAccountBalanceChecker,
                );
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderCollectibleDetectionToggle() {
    if (!process.env.NFTS_V1) {
      return null;
    }

    const { t } = this.context;
    const {
      useNftDetection,
      setUseNftDetection,
      openSeaEnabled,
      setOpenSeaEnabled,
    } = this.props;

    return (
      <div ref={this.settingsRefs[7]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('useCollectibleDetection')}</span>
          <div className="settings-page__content-description">
            {t('useCollectibleDetectionDescription')}
            <br />
            {t('useCollectibleDetectionDescriptionLine2')}
            <ul className="settings-page__content-unordered-list">
              <li>{t('useCollectibleDetectionDescriptionLine3')}</li>
              <li>{t('useCollectibleDetectionDescriptionLine4')}</li>
            </ul>
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useNftDetection}
              onToggle={(value) => {
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.SETTINGS,
                  event: 'Collectible Detection',
                  properties: {
                    action: 'Collectible Detection',
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
        </div>
      </div>
    );
  }

  renderCurrencyRateCheckToggle() {
    const { t } = this.context;
    const { useCurrencyRateCheck, setUseCurrencyRateCheck } = this.props;

    return (
      <div ref={this.settingsRefs[9]} className="settings-page__content-row">
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
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useCurrencyRateCheck}
              onToggle={(value) => setUseCurrencyRateCheck(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { warning } = this.props;

    return (
      <div className="settings-page__body">
        {warning ? <div className="settings-tab__error">{warning}</div> : null}
        <span className="settings-page__security-tab-sub-header__bold">
          {this.context.t('security')}
        </span>
        <div className="settings-page__content-padded">
          {this.renderSeedWords()}
        </div>
        <span className="settings-page__security-tab-sub-header__bold">
          {this.context.t('privacy')}
        </span>
        <div>
          <span className="settings-page__security-tab-sub-header">Alerts</span>
        </div>
        <div className="settings-page__content-padded">
          {this.renderPhishingDetectionToggle()}
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
          {this.context.t('tokenNftAutoDetection')}
        </span>
        <div className="settings-page__content-padded">
          {this.renderAutoDectectTokensToggle()}
          {this.renderBatchAccountBalanceRequestsToggle()}
          {this.renderCollectibleDetectionToggle()}
        </div>
        {this.renderMetaMetricsOptIn()}
      </div>
    );
  }
}
