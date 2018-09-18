import React, { Component } from 'react'
import PropTypes from 'prop-types'
import GasPriceButtonGroup from '../../gas-price-button-group'

export default class BasicTabContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    gasPriceButtonGroupProps: PropTypes.object,
  }

  render () {
    return (
      <div className="basic-tab-content">
        <div className="basic-tab-content__title">Suggest gas fee increases</div>
        <GasPriceButtonGroup
          className="gas-price-button-group"
          noButtonActiveByDefault={true}
          showCheck={true}
          handleGasPriceSelection={(newPrice) => console.log('New Price:', newPrice)}
          {...this.props.gasPriceButtonGroupProps}
        />
      </div>
    )
  }
}
