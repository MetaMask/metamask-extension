import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { EVENT } from '../../../../shared/constants/metametrics';
import Typography from '../../../components/ui/typography/typography';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';

export default class ExperimentalTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    useNftDetection: PropTypes.bool,
    setUseNftDetection: PropTypes.func,
    setOpenSeaEnabled: PropTypes.func,
    openSeaEnabled: PropTypes.bool,
    transactionSecurityCheckEnabled: PropTypes.bool,
    setTransactionSecurityCheckEnabled: PropTypes.func,
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

  renderOpenSeaEnabledToggle() {
    if (!process.env.NFTS_V1) {
      return null;
    }
    const { t } = this.context;
    const {
      openSeaEnabled,
      setOpenSeaEnabled,
      useNftDetection,
      setUseNftDetection,
    } = this.props;

    return (
      <div
        ref={this.settingsRefs[1]}
        className="settings-page__content-row--parent"
      >
        <div className="settings-page__content-item">
          <span>{t('enableOpenSeaAPI')}</span>
          <div className="settings-page__content-description">
            {t('enableOpenSeaAPIDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={openSeaEnabled}
              onToggle={(value) => {
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.SETTINGS,
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
        </div>
      </div>
    );
  }

  renderTransactionSecurityCheckToggle() {
    const { t } = this.context;

    const {
      transactionSecurityCheckEnabled,
      setTransactionSecurityCheckEnabled,
    } = this.props;

    return (
      <>
        <Typography
          variant={TYPOGRAPHY.H4}
          color={COLORS.TEXT_ALTERNATIVE}
          marginBottom={2}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('privacy')}
        </Typography>
        <div
          ref={this.settingsRefs[1]}
          className="settings-page__content-row settings-page__content-row-experimental"
        >
          <div className="settings-page__content-item">
            <span>{t('transactionSecurityCheck')}</span>
            <div className="settings-page__content-description">
              <Typography
                variant={TYPOGRAPHY.H6}
                color={COLORS.TEXT_ALTERNATIVE}
              >
                {t('transactionSecurityCheckDescription')}
              </Typography>
              <Typography
                marginTop={3}
                marginBottom={1}
                variant={TYPOGRAPHY.H6}
                color={COLORS.TEXT_ALTERNATIVE}
              >
                {t('selectProvider')}
              </Typography>
              <div className="settings-page__content-item-col settings-page__content-item-col-open-sea">
                <Typography
                  variant={TYPOGRAPHY.H5}
                  color={COLORS.TEXT_DEFAULT}
                  fontWeight={FONT_WEIGHT.MEDIUM}
                  marginBottom={0}
                >
                  {t('openSea')}
                </Typography>
                <ToggleButton
                  value={transactionSecurityCheckEnabled}
                  onToggle={(value) => {
                    this.context.trackEvent({
                      category: EVENT.CATEGORIES.SETTINGS,
                      event: 'Enabled/Disable TransactionSecurityCheck',
                      properties: {
                        action: 'Enabled/Disable TransactionSecurityCheck',
                        legacy_event: true,
                      },
                    });
                    setTransactionSecurityCheckEnabled(!value);
                  }}
                />
              </div>
              <Typography
                variant={TYPOGRAPHY.H6}
                color={COLORS.TEXT_ALTERNATIVE}
                marginTop={0}
              >
                {t('thisServiceIsExperimental')}
              </Typography>
              <Typography
                variant={TYPOGRAPHY.H5}
                color={COLORS.TEXT_MUTED}
                fontWeight={FONT_WEIGHT.MEDIUM}
                marginTop={2}
              >
                {t('moreComingSoon')}
              </Typography>
            </div>
          </div>
        </div>
      </>
    );
  }

  render() {
    return (
      <div className="settings-page__body">
        {process.env.TRANSACTION_SECURITY_PROVIDER &&
          this.renderTransactionSecurityCheckToggle()}
        {this.renderOpenSeaEnabledToggle()}
      </div>
    );
  }
}
