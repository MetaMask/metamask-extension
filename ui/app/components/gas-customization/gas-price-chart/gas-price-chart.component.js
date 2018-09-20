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

export default class GasPriceChart extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
  }

  renderChart () {
    c3.generate({
      size: {
        height: 154,
      },
      padding: {left: 36, right: 25, top: -5, bottom: 5},
      data: {
        x: 'x',
        columns: [
            ['x', 0, 0.01, 0.02, 0.03, 0.05, 0.07, 0.11, 0.15, 0.29, 0.35, 0.5, 0.55, 0.60, 0.63, 0.77, 0.88, 0.92, 0.93, 0.98, 0.99],
            ['data1', 100, 66, 55, 50, 45, 25, 22, 20.1, 20, 19.9, 15, 12, 10, 9.9, 8.0, 4.0, 3, 1, 0.5, 0.2],
        ],
        types: {
          data1: 'area',
        },
      },
      color: {
        data1: '#259de5',
      },
      axis: {
        x: {
          min: 0,
          max: 1,
          tick: {
            values: ['0', '1.00'],
            outer: false,
            format: val => val === '0' ? val : '$' + val,
          },
          padding: {left: 0.005, right: 0},
          label: {
            text: 'Gas Price ($)',
            position: 'outer-center',
          },
        },
        y: {
          padding: {top: 2, bottom: 0},
          tick: {
            values: ['5', '97'],
            outer: false,
            format: val => val === '5' ? '0' : '100',
          },
          label: {
            text: 'Confirmation time (sec)',
            position: 'outer-middle',
          },
        },
      },
      legend: {
        show: false,
      },
      grid: {
        x: {
            lines: [
                {value: 0.0833},
                {value: 0.1667},
                {value: 0.2500},
                {value: 0.3333},
                {value: 0.4167},
                {value: 0.5000},
                {value: 0.5833},
                {value: 0.6667},
                {value: 0.7500},
                {value: 0.8333},
                {value: 0.9167},
                {value: 1.0000},
            ],
        },
        lines: {
          front: false,
        },
      },
      point: {
        focus: {
          expand: {
            enabled: true,
            r: 3.5,
          },
        },
      },
      tooltip: {
        contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
          const $$ = this
          const config = $$.config
          const titleFormat = config.tooltip_format_title || defaultTitleFormat

          let text, title
          d.forEach(n => {
            if (n && (n.value || n.value === 0)) {

              if (!text) {
                  title = titleFormat ? titleFormat(n.x) : n.x
                  text = "<table class='" + 'custom-tooltip' + "'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + '</th></tr>' : '')
              }
            }
          })
          // for (i = 0; i < d.length; i++) {
          //     if (! (d[i] && (d[i].value || d[i].value === 0))) { continue; }

          //     if (! text) {
          //         title = titleFormat ? titleFormat(d[i].x) : d[i].x;
          //         text = "<table class='" + 'custom-tooltip' + "'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + "</th></tr>" : "");
          //     }
          // }
          return text + '</table>' + "<div class='tooltip-arrow'></div>"
        },
        position: function (data, width, height, element) {
          const x = d3.event.pageX - document.getElementById('chart').getBoundingClientRect().x + 19
          const y = d3.event.pageY - document.getElementById('chart').getBoundingClientRect().y + 20
          return {top: y, left: x}
        },
      },
    })

    setTimeout(() => {
      setTickPosition('y', 0, -5, 2)
      setTickPosition('y', 1, -3)
      setTickPosition('x', 0, 3)
      setTickPosition('x', 1, 3, -5)
      d3.select('.c3-axis-x-label').attr('transform', 'translate(0,-15)')
      d3.select('.c3-axis-y-label').attr('transform', 'translate(42, 2) rotate(-90)')
    }, 0)
  }

  componentDidMount () {
    this.renderChart()
  }

  render () {
    return (
      <div className="gas-price-chart" id="container">
        <div className="gas-price-chart__root" id="chart"></div>
      </div>
    )
  }
}
