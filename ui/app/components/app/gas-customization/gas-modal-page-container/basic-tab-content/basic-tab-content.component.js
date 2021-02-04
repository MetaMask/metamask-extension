import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Loading from '../../../../ui/loading-screen';
import GasPriceButtonGroup from '../../gas-price-button-group';

export default class BasicTabContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    gasPriceButtonGroupProps: PropTypes.object,
  };

  render() {
    const { t } = this.context;
    const { gasPriceButtonGroupProps } = this.props;

    return (
      <div className="basic-tab-content">
        <div className="basic-tab-content__title">
          {t('estimatedProcessingTimes')}
        </div>
        <div className="basic-tab-content__blurb">
          {t('selectAHigherGasFee')}
        </div>
        {gasPriceButtonGroupProps.loading ? (
          <Loading />
        ) : (
          <GasPriceButtonGroup
            className="gas-price-button-group--alt"
            showCheck
            {...gasPriceButtonGroupProps}
          />
        )}
        <div className="basic-tab-content__footer-blurb">
          {t('acceleratingATransaction')}
        </div>
      </div>
    );
  }
}
