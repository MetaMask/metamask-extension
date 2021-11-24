import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';

export default class ExperimentalTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    useTokenDetection: PropTypes.bool,
    setUseTokenDetection: PropTypes.func,
    useCollectibleDetection: PropTypes.bool,
    setUseCollectibleDetection: PropTypes.func,
  };

  renderTokenDetectionToggle() {
    const { t } = this.context;
    const { useTokenDetection, setUseTokenDetection } = this.props;

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('useTokenDetection')}</span>
          <div className="settings-page__content-description">
            {t('useTokenDetectionDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useTokenDetection}
              onToggle={(value) => {
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Settings',
                    action: 'Token Detection',
                    name: 'Token Detection',
                  },
                });
                setUseTokenDetection(!value);
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
    const { t } = this.context;
    const { useCollectibleDetection, setUseCollectibleDetection } = this.props;

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('useCollectibleDetection')}</span>
          <div className="settings-page__content-description">
            {t('useCollectibleDetectionDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useCollectibleDetection}
              onToggle={(value) => {
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Settings',
                    action: 'Collectible Detection',
                    name: 'Collectible Detection',
                  },
                });
                setUseCollectibleDetection(!value);
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="settings-page__body">
        {this.renderTokenDetectionToggle()}
        {this.renderCollectibleDetectionToggle()}
      </div>
    );
  }
}
