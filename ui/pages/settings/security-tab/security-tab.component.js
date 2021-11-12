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
      allowlistInputValue: this.props.allowlistValues.join(','),
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
    useAllowlistMode: PropTypes.bool.isRequired,
    setUseAllowlistMode: PropTypes.func.isRequired,
    allowlistValues: PropTypes.array.isRequired,
    setAllowlistValues: PropTypes.array.isRequired,
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

  renderAllowlistModeToggle() {
    const { t } = this.context;
    const { useAllowlistMode, setUseAllowlistMode } = this.props;

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('useAllowlistMode')}</span>
          <div className="settings-page__content-description">
            {t('useAllowlistModeDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useAllowlistMode}
              onToggle={(value) => setUseAllowlistMode(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderAllowlistModeInput() {
    const { t } = this.context;
    const { allowlistInputValue } = this.state;
    const { useAllowlistMode, setAllowlistValues } = this.props;
    const onChange = ({ target }) => {
      this.setState({ allowlistInputValue: target.value });
    };
    const submitAllowlist = () => {
      const newAllowlist = allowlistInputValue
        .split(',')
        .map((v) => (isValidDomainName(v.trim()) ? v.trim() : null))
        .filter((v) => v);

      setAllowlistValues(newAllowlist);
      this.setState({ allowlistInputValue: newAllowlist.join(',') });
    };

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('allowlistValue')}</span>
          <div className="settings-page__content-description">
            {t('allowlistValueDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="text"
              id="allowlist-values"
              placeholder="metamask.io,consensys.net,etherscan.io"
              autoComplete="off"
              onChange={onChange}
              onBlur={submitAllowlist}
              fullWidth
              margin="dense"
              value={allowlistInputValue}
              disabled={!useAllowlistMode}
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
        {this.renderAllowlistModeToggle()}
        {this.renderAllowlistModeInput()}
        {this.renderMetaMetricsOptIn()}
      </div>
    );
  }
}
