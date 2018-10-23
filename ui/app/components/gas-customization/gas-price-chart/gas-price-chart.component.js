import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import {
  generateChart,
  getCoordinateData,
  handleChartUpdate,
  hideDataUI,
  setTickPosition,
  handleMouseMove,
} from './gas-price-chart.utils.js'

export default class GasPriceChart extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    gasPrices: PropTypes.array,
    estimatedTimes: PropTypes.array,
    gasPricesMax: PropTypes.number,
    estimatedTimesMax: PropTypes.number,
    currentPrice: PropTypes.number,
    updateCustomGasPrice: PropTypes.func,
  }

  renderChart ({
    currentPrice,
    gasPrices,
    estimatedTimes,
    gasPricesMax,
    estimatedTimesMax,
    updateCustomGasPrice,
  }) {
    const chart = generateChart(gasPrices, estimatedTimes, gasPricesMax, estimatedTimesMax)

    setTimeout(function () {
      setTickPosition('y', 0, -5, 8)
      setTickPosition('y', 1, -3, -5)
      setTickPosition('x', 0, 3, 15)
      setTickPosition('x', 1, 3, -8)

      // TODO: Confirm the below constants work with all data sets and screen sizes
      d3.select('.c3-axis-x-label').attr('transform', 'translate(0,-15)')
      d3.select('.c3-axis-y-label').attr('transform', 'translate(52, 2) rotate(-90)')
      d3.select('.c3-xgrid-focus line').attr('y2', 98)

      d3.select('.c3-chart').on('mouseout', () => {
        hideDataUI(chart, '#overlayed-circle')
      })

      d3.select('.c3-chart').on('click', () => {
        const { x: newGasPrice } = d3.select('#overlayed-circle').datum()
        updateCustomGasPrice(newGasPrice)
      })

      const { x: chartXStart, width: chartWidth } = getCoordinateData('.c3-areas-data1')

      handleChartUpdate({
        chart,
        gasPrices,
        newPrice: currentPrice,
        cssId: '#set-circle',
      })

      d3.select('.c3-chart').on('mousemove', function () {
        handleMouseMove({
          xMousePos: d3.event.clientX,
          chartXStart,
          chartWidth,
          gasPrices,
          estimatedTimes,
          chart,
        })
      })
    }, 0)

    this.chart = chart
  }

  componentDidUpdate (prevProps) {
    const { gasPrices, currentPrice: newPrice } = this.props

    if (prevProps.currentPrice !== newPrice) {
      handleChartUpdate({
        chart: this.chart,
        gasPrices,
        newPrice,
        cssId: '#set-circle',
      })
    }
  }

  componentDidMount () {
    this.renderChart(this.props)
  }

  render () {
    return (
      <div className="gas-price-chart" id="container">
        <div className="gas-price-chart__root" id="chart"></div>
      </div>
    )
  }
}
