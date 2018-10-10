import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import c3 from 'c3'

function setTickPosition (axis, n, newPosition, secondNewPosition) {
  const positionToShift = axis === 'y' ? 'x' : 'y'
  const secondPositionToShift = axis === 'y' ? 'y' : 'x'
  d3.select('#chart')
    .select(`.c3-axis-${axis}`)
    .selectAll('.tick')
    .filter((d, i) => i === n)
    .select('text')
    .attr(positionToShift, 0)
    .select('tspan')
    .attr(positionToShift, newPosition)
    .attr(secondPositionToShift, secondNewPosition || 0)
    .style('visibility', 'visible')
}

function appendOrUpdateCircle ({ circle, data, itemIndex, cx, cy, cssId, appendOnly }) {
  if (appendOnly || circle.empty()) {
    circle.data([data])
      .enter().append('circle')
      .attr('class', () => this.generateClass('c3-selected-circle', itemIndex))
      .attr('id', cssId)
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('stroke', () => this.color(data))
      .attr('r', 6)
  } else {
    circle.data([data])
      .attr('cx', cx)
      .attr('cy', cy)
  }
}

function setSelectedCircle ({ chart, gasPrices, currentPrice, chartXStart, chartWidth }) {
  const numberOfValues = chart.internal.data.xs.data1.length
  const closestLowerValueIndex = gasPrices.findIndex((e, i, a) => {
    return e <= currentPrice && a[i + 1] >= currentPrice
  })
  const closestHigherValueIndex = gasPrices.findIndex((e, i, a) => {
    return e > currentPrice
  })
  const closestHigherValue = gasPrices[closestHigherValueIndex]
  const closestLowerValue = gasPrices[closestLowerValueIndex]

  if (closestHigherValue && closestLowerValue) {
    const closestLowerCircle = d3.select(`.c3-circle-${closestLowerValueIndex}`)
    const closestHigherCircle = d3.select(`.c3-circle-${closestHigherValueIndex}`)
    const { x: lowerX, y: lowerY } = closestLowerCircle.node().getBoundingClientRect()
    const { x: higherX, y: higherY } = closestHigherCircle.node().getBoundingClientRect()
    const currentX = lowerX + (higherX - lowerX) * (currentPrice - closestLowerValue) / (closestHigherValue - closestLowerValue)
    const slope = (higherY - lowerY) / (higherX - lowerX)
    const newTimeEstimate = -1 * (slope * (higherX - currentX) - higherY)
    chart.internal.selectPointB({
      x: currentX,
      value: newTimeEstimate,
      id: 'data1',
      index: numberOfValues,
      name: 'data1',
    }, numberOfValues)
  } else {
    const setCircle = d3.select('#set-circle')
    if (!setCircle.empty()) {
      setCircle.remove()
    }
    d3.select('.c3-tooltip-container').style('display', 'none !important')
    chart.internal.hideXGridFocus()
    return
  }
}

export default class GasPriceChart extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    priceAndTimeEstimates: PropTypes.array,
    currentPrice: PropTypes.number,
    updateCustomGasPrice: PropTypes.func,
  }

  renderChart (currentPrice, priceAndTimeEstimates, updateCustomGasPrice) {
    const gasPrices = priceAndTimeEstimates.map(({ gasprice }) => gasprice)
    const gasPricesMax = gasPrices[gasPrices.length - 1] + 1
    const estimatedTimes = priceAndTimeEstimates.map(({ expectedTime }) => expectedTime)

    const estimatedTimesMax = estimatedTimes[0]
    const chart = c3.generate({
      size: {
        height: 165,
      },
      transition: {
        duration: 0,
      },
      padding: {left: 20, right: 15, top: 6, bottom: 10},
      data: {
          x: 'x',
          columns: [
              ['x', ...gasPrices],
              ['data1', ...estimatedTimes],
          ],
          types: {
            data1: 'area',
          },
          selection: {
            enabled: false,
          },
      },
      color: {
        data1: '#259de5',
      },
      axis: {
        x: {
          min: gasPrices[0],
          max: gasPricesMax,
          tick: {
            values: [Math.floor(gasPrices[0]), Math.ceil(gasPricesMax)],
            outer: false,
            format: function (val) { return val + ' GWEI' },
          },
          padding: {left: gasPricesMax / 50, right: gasPricesMax / 50},
          label: {
            text: 'Gas Price ($)',
            position: 'outer-center',
          },
        },
        y: {
          padding: {top: 7, bottom: 7},
          tick: {
            values: [Math.floor(estimatedTimesMax * 0.05), Math.ceil(estimatedTimesMax * 0.97)],
            outer: false,
          },
          label: {
            text: 'Confirmation time (sec)',
            position: 'outer-middle',
          },
          min: 0,
        },
      },
      legend: {
          show: false,
      },
      grid: {
          x: {},
          lines: {
            front: false,
          },
      },
      point: {
        focus: {
          expand: {
            enabled: false,
            r: 3.5,
          },
        },
      },
      tooltip: {
        format: {
          title: (v) => v.toPrecision(4),
        },
        contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
          const config = this.config
          const titleFormat = config.tooltip_format_title || defaultTitleFormat
          let text
          let title
          d.forEach(el => {
            if (el && (el.value || el.value === 0) && !text) {
              title = titleFormat ? titleFormat(el.x) : el.x
              text = "<table class='" + 'custom-tooltip' + "'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + '</th></tr>' : '')
            }
          })
          return text + '</table>' + "<div class='tooltip-arrow'></div>"
        },
        position: function (data, width, height, element) {
          const overlayedCircle = d3.select('#overlayed-circle')
          if (overlayedCircle.empty()) {
            return { top: -100, left: -100 }
          }

          const { x: circleX, y: circleY, width: circleWidth } = overlayedCircle.node().getBoundingClientRect()
          const { x: chartXStart, y: chartYStart } = d3.select('.c3-chart').node().getBoundingClientRect()

          // TODO: Confirm the below constants work with all data sets and screen sizes
          // TODO: simplify l149-l159
          let y = circleY - chartYStart - 19
          if (circleY - circleWidth < chartYStart + 5) {
            y = y + circleWidth + 38
            d3.select('.tooltip-arrow').style('margin-top', '-16px')
          } else {
            d3.select('.tooltip-arrow').style('margin-top', '4px')
          }
          return {
            top: y,
            left: circleX - chartXStart + circleWidth - (gasPricesMax / 50),
          }
        },
        show: true,
      },
    })

    chart.internal.selectPoint = function (data, itemIndex = (data.index || 0)) {
      const { x: circleX, y: circleY, width: circleWidth } = d3.select('#overlayed-circle')
        .node()
        .getBoundingClientRect()
      const { x: chartXStart, y: chartYStart } = d3.select('.c3-areas-data1')
        .node()
        .getBoundingClientRect()

      d3.select('#set-circle').remove()

      const circle = this.main
        .select('.' + 'c3-selected-circles' + this.getTargetSelectorSuffix(data.id))
        .selectAll('.' + 'c3-selected-circle' + '-' + itemIndex)

      appendOrUpdateCircle.bind(this)({
        circle,
        data,
        itemIndex,
        cx: () => circleX - chartXStart + circleWidth + 2,
        cy: () => circleY - chartYStart + circleWidth + 1,
        cssId: 'set-circle',
        appendOnly: true,
      })
    }

    chart.internal.selectPointB = function (data, itemIndex = (data.index || 0)) {
      const { x: chartXStart, y: chartYStart } = d3.select('.c3-areas-data1')
        .node()
        .getBoundingClientRect()

      d3.select('#set-circle').remove()

      const circle = this.main
        .select('.' + 'c3-selected-circles' + this.getTargetSelectorSuffix(data.id))
        .selectAll('.' + 'c3-selected-circle' + '-' + itemIndex)

      appendOrUpdateCircle.bind(this)({
        circle,
        data,
        itemIndex,
        cx: () => data.x - chartXStart + 11,
        cy: () => data.value - chartYStart + 10,
        cssId: 'set-circle',
        appendOnly: true,
      })
    }

    chart.internal.overlayPoint = function (data, itemIndex) {
        const circle = this.main
          .select('.' + 'c3-selected-circles' + this.getTargetSelectorSuffix(data.id))
          .selectAll('.' + 'c3-selected-circle' + '-' + itemIndex)

        appendOrUpdateCircle.bind(this)({
          circle,
          data,
          itemIndex,
          cx: this.circleX.bind(this),
          cy: this.circleY.bind(this),
          cssId: 'overlayed-circle',
        })
    }

    chart.internal.setCurrentCircle = function (data, itemIndex) {
      const circle = this.main
        .select('.' + 'c3-selected-circles' + this.getTargetSelectorSuffix(data.id))
        .selectAll('#current-circle')

      appendOrUpdateCircle.bind(this)({
        circle,
        data,
        itemIndex,
        cx: this.circleX.bind(this),
        cy: this.circleY.bind(this),
        cssId: 'current-circle',
      })
    }

    chart.internal.showTooltip = function (selectedData, element) {
      const $$ = this
      const config = $$.config
      const forArc = $$.hasArcType()
      const dataToShow = selectedData.filter((d) => d && (d.value || d.value === 0))
      const positionFunction = config.tooltip_position || chart.internal.prototype.tooltipPosition
      if (dataToShow.length === 0 || !config.tooltip_show) {
        return
      }
      $$.tooltip.html(config.tooltip_contents.call($$, selectedData, $$.axis.getXAxisTickFormat(), $$.getYFormat(forArc), $$.color)).style('display', 'flex')

      // Get tooltip dimensions
      const tWidth = $$.tooltip.property('offsetWidth')
      const tHeight = $$.tooltip.property('offsetHeight')
      const position = positionFunction.call(this, dataToShow, tWidth, tHeight, element)
      // Set tooltip
      $$.tooltip.style('top', position.top + 'px').style('left', position.left + 'px')
    }

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
        const overLayedCircle = d3.select('#overlayed-circle')
        if (!overLayedCircle.empty()) {
          overLayedCircle.remove()
        }
        d3.select('.c3-tooltip-container').style('display', 'none !important')
      })

      const chartRect = d3.select('.c3-areas-data1')
      const { x: chartXStart, width: chartWidth } = chartRect.node().getBoundingClientRect()

      d3.select('.c3-chart').on('click', () => {
        const overlayedCircle = d3.select('#overlayed-circle')
        const numberOfValues = chart.internal.data.xs.data1.length
        const { x: circleX, y: circleY } = overlayedCircle.node().getBoundingClientRect()
        const { x: xData } = overlayedCircle.datum()
        chart.internal.selectPoint({
          x: circleX - chartXStart,
          value: circleY - 1.5,
          id: 'data1',
          index: numberOfValues,
          name: 'data1',
        }, numberOfValues)
        updateCustomGasPrice(xData)
      })

      setSelectedCircle({ chart, gasPrices, currentPrice, chartXStart, chartWidth })

      d3.select('.c3-chart').on('mousemove', function () {
        const chartMouseXPos = d3.event.clientX - chartXStart
        const posPercentile = chartMouseXPos / chartWidth

        const currentPosValue = (gasPrices[gasPrices.length - 1] - gasPrices[0]) * posPercentile + gasPrices[0]
        const closestLowerValueIndex = gasPrices.findIndex((e, i, a) => {
          return e <= currentPosValue && a[i + 1] >= currentPosValue
        })
        const closestLowerValue = gasPrices[closestLowerValueIndex]
        const estimatedClosestLowerTimeEstimate = estimatedTimes[closestLowerValueIndex]

        const closestHigherValueIndex = gasPrices.findIndex((e, i, a) => {
          return e > currentPosValue
        })
        const closestHigherValue = gasPrices[closestHigherValueIndex]
        if (!closestHigherValue || !closestLowerValue) {
          const overLayedCircle = d3.select('#overlayed-circle')
          if (!overLayedCircle.empty()) {
            overLayedCircle.remove()
          }
          d3.select('.c3-tooltip-container').style('display', 'none !important')
          chart.internal.hideXGridFocus()
          return
        }
        const estimatedClosestHigherTimeEstimate = estimatedTimes[closestHigherValueIndex]

        const slope = (estimatedClosestHigherTimeEstimate - estimatedClosestLowerTimeEstimate) / (closestHigherValue - closestLowerValue)
        const newTimeEstimate = -1 * (slope * (closestHigherValue - currentPosValue) - estimatedClosestHigherTimeEstimate)

        const newEstimatedTimes = [...estimatedTimes, newTimeEstimate]
        chart.internal.overlayPoint({
          x: currentPosValue,
          value: newTimeEstimate,
          id: 'data1',
          index: newEstimatedTimes.length,
          name: 'data1',
        }, newEstimatedTimes.length)
        chart.internal.showTooltip([{
          x: currentPosValue,
          value: newTimeEstimate,
          id: 'data1',
          index: newEstimatedTimes.length,
          name: 'data1',
        }], chartRect._groups[0])
        chart.internal.showXGridFocus([{
          x: currentPosValue,
          value: newTimeEstimate,
          id: 'data1',
          index: newEstimatedTimes.length,
          name: 'data1',
        }])
      })
    }, 0)

    this.chart = chart
  }

  componentDidUpdate (prevProps) {
    if (prevProps.currentPrice !== this.props.currentPrice) {
      const chartRect = d3.select('.c3-areas-data1')
      const { x: chartXStart, width: chartWidth } = chartRect.node().getBoundingClientRect()
      setSelectedCircle({
        chart: this.chart,
        currentPrice: this.props.currentPrice,
        gasPrices: this.props.priceAndTimeEstimates.map(({ gasprice }) => gasprice),
        chartXStart,
        chartWidth,
      })
    }
  }

  componentDidMount () {
    const { currentPrice, priceAndTimeEstimates, updateCustomGasPrice } = this.props
    this.renderChart(currentPrice, priceAndTimeEstimates, updateCustomGasPrice)
  }

  render () {
    return (
      <div className="gas-price-chart" id="container">
        <div className="gas-price-chart__root" id="chart"></div>
      </div>
    )
  }
}
