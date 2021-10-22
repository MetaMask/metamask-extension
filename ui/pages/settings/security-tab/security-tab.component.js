import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import TextField from '../../../components/ui/text-field';
import { REVEAL_SEED_ROUTE } from '../../../helpers/constants/routes';
import { isValidDomainName } from '../../../helpers/utils/util';
import Button from '../../../components/ui/button';

export default class SecurityTab extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      whitelistInputValue: this.props.whitelistValues.join(','),
    };
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
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
    useWhitelistMode: PropTypes.bool.isRequired,
    setUseWhitelistMode: PropTypes.func.isRequired,
    whitelistValues: PropTypes.array.isRequired,
    setWhitelistValues: PropTypes.array.isRequired,
  };

  renderSeedWords() {
    const { t } = this.context;
    const { history } = this.props;

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('revealSeedWords')}</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="danger"
              large
              onClick={(event) => {
                event.preventDefault();
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Settings',
                    action: 'Reveal Seed Phrase',
                    name: 'Reveal Seed Phrase',
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

  renderMetaMetricsOptIn() {
    const { t } = this.context;
    const {
      participateInMetaMetrics,
      setParticipateInMetaMetrics,
    } = this.props;

    return (
      <div className="settings-page__content-row">
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

  renderIncomingTransactionsOptIn() {
    const { t } = this.context;
    const {
      showIncomingTransactions,
      setShowIncomingTransactionsFeatureFlag,
    } = this.props;

    return (
      <div className="settings-page__content-row">
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
      <div className="settings-page__content-row">
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

  renderWhitelistModeToggle() {
    const { t } = this.context;
    const { useWhitelistMode, setUseWhitelistMode } = this.props;

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('useWhitelistMode')}</span>
          <div className="settings-page__content-description">
            {t('useWhitelistModeDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useWhitelistMode}
              onToggle={(value) => setUseWhitelistMode(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderWhitelistModeInput() {
    const { t } = this.context;
    const { whitelistInputValue } = this.state;
    const { useWhitelistMode, setWhitelistValues } = this.props;
    const onChange = ({ target }) => {
      this.setState({ whitelistInputValue: target.value });
    };
    const submitWhitelist = () => {
      const newWhitelist = whitelistInputValue
        .split(',')
        .map((v) => (isValidDomainName(v.trim()) ? v.trim() : null))
        .filter((v) => v);

      setWhitelistValues(newWhitelist);
      this.setState({ whitelistInputValue: newWhitelist.join(',') });
    };

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('whitelistValue')}</span>
          <div className="settings-page__content-description">
            {t('whitelistValueDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="text"
              id="whitelist-values"
              placeholder="metamask.io,consensys.net,etherscan.io"
              autoComplete="off"
              onChange={onChange}
              onBlur={submitWhitelist}
              fullWidth
              margin="dense"
              value={whitelistInputValue}
              disabled={!useWhitelistMode}
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
        {warning && <div className="settings-tab__error">{warning}</div>}
        {this.renderSeedWords()}
        {this.renderIncomingTransactionsOptIn()}
        {this.renderPhishingDetectionToggle()}
        {this.renderWhitelistModeToggle()}
        {this.renderWhitelistModeInput()}
        {this.renderMetaMetricsOptIn()}
      </div>
    );
  }
}
