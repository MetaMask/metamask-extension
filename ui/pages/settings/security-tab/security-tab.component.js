import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import { REVEAL_SEED_ROUTE } from '../../../helpers/constants/routes';
import Button from '../../../components/ui/button';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';

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
    useMultiAccountBalanceChecker: PropTypes.bool.isRequired,
    setUseMultiAccountBalanceChecker: PropTypes.func.isRequired,
    useCurrencyRateCheck: PropTypes.bool.isRequired,
    setUseCurrencyRateCheck: PropTypes.bool.isRequired,
  };

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
            {t('showIncomingTransactionsDescription')}
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

  renderMultiAccountBalanceCheckerOptIn() {
    const { t } = this.context;
    const { useMultiAccountBalanceChecker, setUseMultiAccountBalanceChecker } =
      this.props;

    return (
      <div ref={this.settingsRefs[4]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('useMultiAccountBalanceChecker')}</span>
          <div className="settings-page__content-description">
            <span>{t('useMultiAccountBalanceCheckerDescription')}</span>
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useMultiAccountBalanceChecker}
              onToggle={(value) => setUseMultiAccountBalanceChecker(!value)}
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
      <div ref={this.settingsRefs[5]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('currencyRateCheckToggle')}</span>
          <div className="settings-page__content-description">
            {t('currencyRateCheckToggleDescription', [
              <a
                key="coingecko_link"
                href="https://www.coingecko.com/"
                rel="noreferrer"
                target="_blank"
              >
                {t('coingecko')}
              </a>,
              <a
                key="cryptocompare_link"
                href="https://www.cryptocompare.com/"
                rel="noreferrer"
                target="_blank"
              >
                {t('cryptoCompare')}
              </a>,
              <a
                key="privacy_policy_link"
                href="https://consensys.net/privacy-policy/"
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
        {this.renderSeedWords()}
        {this.renderIncomingTransactionsOptIn()}
        {this.renderPhishingDetectionToggle()}
        {this.renderMetaMetricsOptIn()}
        {this.renderMultiAccountBalanceCheckerOptIn()}
        {this.renderCurrencyRateCheckToggle()}
      </div>
    );
  }
}
