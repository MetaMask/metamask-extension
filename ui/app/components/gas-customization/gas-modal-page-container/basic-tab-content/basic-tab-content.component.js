import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Loading from '../../../loading-screen'
import GasPriceButtonGroup from '../../gas-price-button-group'

export default class BasicTabContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    gasPriceButtonGroupProps: PropTypes.object,
  }

  render () {
    const { gasPriceButtonGroupProps } = this.props

    return (
      <div className="basic-tab-content">
        <div className="basic-tab-content__title">Estimated Processing Times</div>
        <div className="basic-tab-content__blurb">Select a higher gas fee to accelerate the processing of your transaction.*</div>
        {!gasPriceButtonGroupProps.loading
            ? <GasPriceButtonGroup
              className="gas-price-button-group--alt"
              showCheck={true}
              {...gasPriceButtonGroupProps}
            />
            : <Loading />
        }
        <div className="basic-tab-content__footer-blurb">* Accelerating a transaction by using a higher gas price increases its chances of getting processed by the network faster, but it is not always guaranteed.</div>
      </div>
    )
  }
}
