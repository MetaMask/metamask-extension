import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class GasPriceChart extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    return (
      <div className="gas-price-chart">
        <div className="gas-price-chart__container" id="chart"></div>
      </div>
    )
  }
}
