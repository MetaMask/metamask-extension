import assert from 'assert'
import React from 'react'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import * as d3 from 'd3'
import shallow from '../../../../../../lib/shallow-with-context'

function timeout(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

describe('GasPriceChart Component', function () {
  let GasPriceChart
  let gasPriceChartUtilsSpies
  let propsMethodSpies
  let selectReturnSpies
  let testProps
  let wrapper

  beforeEach(function () {
    propsMethodSpies = {
      updateCustomGasPrice: sinon.spy(),
    }

    selectReturnSpies = {
      empty: sinon.spy(),
      remove: sinon.spy(),
      style: sinon.spy(),
      select: d3.select,
      attr: sinon.spy(),
      on: sinon.spy(),
      datum: sinon.stub().returns({ x: 'mockX' }),
    }

    const mockSelectReturn = {
      ...d3.select('div'),
      node: () => ({
        getBoundingClientRect: () => ({ x: 123, y: 321, width: 400 }),
      }),
      ...selectReturnSpies,
    }

    gasPriceChartUtilsSpies = {
      appendOrUpdateCircle: sinon.spy(),
      generateChart: sinon.stub().returns({ mockChart: true }),
      generateDataUIObj: sinon.spy(),
      getAdjacentGasPrices: sinon.spy(),
      getCoordinateData: sinon
        .stub()
        .returns({ x: 'mockCoordinateX', width: 'mockWidth' }),
      getNewXandTimeEstimate: sinon.spy(),
      handleChartUpdate: sinon.spy(),
      hideDataUI: sinon.spy(),
      setSelectedCircle: sinon.spy(),
      setTickPosition: sinon.spy(),
      handleMouseMove: sinon.spy(),
    }

    testProps = {
      gasPrices: [1.5, 2.5, 4, 8],
      estimatedTimes: [100, 80, 40, 10],
      gasPricesMax: 9,
      estimatedTimesMax: 100,
      currentPrice: 6,
      updateCustomGasPrice: propsMethodSpies.updateCustomGasPrice,
    }

    GasPriceChart = proxyquire('../gas-price-chart.component.js', {
      './gas-price-chart.utils.js': gasPriceChartUtilsSpies,
      d3: {
        ...d3,
        select(...args) {
          const result = d3.select(...args)
          return result.empty() ? mockSelectReturn : result
        },
        event: {
          clientX: 'mockClientX',
        },
      },
    }).default
    sinon.spy(GasPriceChart.prototype, 'renderChart')

    wrapper = shallow(<GasPriceChart {...testProps} />)
  })

  afterEach(function () {
    sinon.restore()
  })

  describe('render()', function () {
    it('should render', function () {
      assert(wrapper.hasClass('gas-price-chart'))
    })

    it('should render the chart div', function () {
      assert(wrapper.childAt(0).hasClass('gas-price-chart__root'))
      assert.equal(wrapper.childAt(0).props().id, 'chart')
    })
  })

  describe('componentDidMount', function () {
    it('should call this.renderChart', function () {
      assert(GasPriceChart.prototype.renderChart.callCount, 1)
      wrapper.instance().componentDidMount()
      assert(GasPriceChart.prototype.renderChart.callCount, 2)
    })
  })

  describe('componentDidUpdate', function () {
    it('should call handleChartUpdate if props.currentPrice has changed', function () {
      gasPriceChartUtilsSpies.handleChartUpdate.resetHistory()
      wrapper.instance().componentDidUpdate({ currentPrice: 7 })
      assert.equal(gasPriceChartUtilsSpies.handleChartUpdate.callCount, 1)
    })

    it('should call handleChartUpdate with the correct props', function () {
      gasPriceChartUtilsSpies.handleChartUpdate.resetHistory()
      wrapper.instance().componentDidUpdate({ currentPrice: 7 })
      assert.deepEqual(
        gasPriceChartUtilsSpies.handleChartUpdate.getCall(0).args,
        [
          {
            chart: { mockChart: true },
            gasPrices: [1.5, 2.5, 4, 8],
            newPrice: 6,
            cssId: '#set-circle',
          },
        ],
      )
    })

    it('should not call handleChartUpdate if props.currentPrice has not changed', function () {
      gasPriceChartUtilsSpies.handleChartUpdate.resetHistory()
      wrapper.instance().componentDidUpdate({ currentPrice: 6 })
      assert.equal(gasPriceChartUtilsSpies.handleChartUpdate.callCount, 0)
    })
  })

  describe('renderChart', function () {
    it('should call setTickPosition 4 times, with the expected props', async function () {
      await timeout(0)
      gasPriceChartUtilsSpies.setTickPosition.resetHistory()
      assert.equal(gasPriceChartUtilsSpies.setTickPosition.callCount, 0)
      wrapper.instance().renderChart(testProps)
      await timeout(0)
      assert.equal(gasPriceChartUtilsSpies.setTickPosition.callCount, 4)
      assert.deepEqual(
        gasPriceChartUtilsSpies.setTickPosition.getCall(0).args,
        ['y', 0, -5, 8],
      )
      assert.deepEqual(
        gasPriceChartUtilsSpies.setTickPosition.getCall(1).args,
        ['y', 1, -3, -5],
      )
      assert.deepEqual(
        gasPriceChartUtilsSpies.setTickPosition.getCall(2).args,
        ['x', 0, 3],
      )
      assert.deepEqual(
        gasPriceChartUtilsSpies.setTickPosition.getCall(3).args,
        ['x', 1, 3, -8],
      )
    })

    it('should call handleChartUpdate with the correct props', async function () {
      await timeout(0)
      gasPriceChartUtilsSpies.handleChartUpdate.resetHistory()
      wrapper.instance().renderChart(testProps)
      await timeout(0)
      assert.deepEqual(
        gasPriceChartUtilsSpies.handleChartUpdate.getCall(0).args,
        [
          {
            chart: { mockChart: true },
            gasPrices: [1.5, 2.5, 4, 8],
            newPrice: 6,
            cssId: '#set-circle',
          },
        ],
      )
    })

    it('should add three events to the chart', async function () {
      await timeout(0)
      selectReturnSpies.on.resetHistory()
      assert.equal(selectReturnSpies.on.callCount, 0)
      wrapper.instance().renderChart(testProps)
      await timeout(0)
      assert.equal(selectReturnSpies.on.callCount, 3)

      const firstOnEventArgs = selectReturnSpies.on.getCall(0).args
      assert.equal(firstOnEventArgs[0], 'mouseout')
      const secondOnEventArgs = selectReturnSpies.on.getCall(1).args
      assert.equal(secondOnEventArgs[0], 'click')
      const thirdOnEventArgs = selectReturnSpies.on.getCall(2).args
      assert.equal(thirdOnEventArgs[0], 'mousemove')
    })

    it('should hide the data UI on mouseout', async function () {
      await timeout(0)
      selectReturnSpies.on.resetHistory()
      wrapper.instance().renderChart(testProps)
      gasPriceChartUtilsSpies.hideDataUI.resetHistory()
      await timeout(0)
      const mouseoutEventArgs = selectReturnSpies.on.getCall(0).args
      assert.equal(gasPriceChartUtilsSpies.hideDataUI.callCount, 0)
      mouseoutEventArgs[1]()
      assert.equal(gasPriceChartUtilsSpies.hideDataUI.callCount, 1)
      assert.deepEqual(gasPriceChartUtilsSpies.hideDataUI.getCall(0).args, [
        { mockChart: true },
        '#overlayed-circle',
      ])
    })

    it('should updateCustomGasPrice on click', async function () {
      await timeout(0)
      selectReturnSpies.on.resetHistory()
      wrapper.instance().renderChart(testProps)
      propsMethodSpies.updateCustomGasPrice.resetHistory()
      await timeout(0)
      const mouseoutEventArgs = selectReturnSpies.on.getCall(1).args
      assert.equal(propsMethodSpies.updateCustomGasPrice.callCount, 0)
      mouseoutEventArgs[1]()
      assert.equal(propsMethodSpies.updateCustomGasPrice.callCount, 1)
      assert.equal(
        propsMethodSpies.updateCustomGasPrice.getCall(0).args[0],
        'mockX',
      )
    })

    it('should handle mousemove', async function () {
      await timeout(0)
      selectReturnSpies.on.resetHistory()
      wrapper.instance().renderChart(testProps)
      gasPriceChartUtilsSpies.handleMouseMove.resetHistory()
      await timeout(0)
      const mouseoutEventArgs = selectReturnSpies.on.getCall(2).args
      assert.equal(gasPriceChartUtilsSpies.handleMouseMove.callCount, 0)
      mouseoutEventArgs[1]()
      assert.equal(gasPriceChartUtilsSpies.handleMouseMove.callCount, 1)
      assert.deepEqual(
        gasPriceChartUtilsSpies.handleMouseMove.getCall(0).args,
        [
          {
            xMousePos: 'mockClientX',
            chartXStart: 'mockCoordinateX',
            chartWidth: 'mockWidth',
            gasPrices: testProps.gasPrices,
            estimatedTimes: testProps.estimatedTimes,
            chart: { mockChart: true },
          },
        ],
      )
    })
  })
})
