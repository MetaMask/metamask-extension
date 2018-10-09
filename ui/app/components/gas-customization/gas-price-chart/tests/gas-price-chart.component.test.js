import React from 'react'
import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import shallow from '../../../../../lib/shallow-with-context'
import * as d3 from 'd3'

const mockSelectReturn = {
  ...d3.select('div'),
  node: () => ({
    getBoundingClientRect: () => ({ x: 123, y: 321, width: 400 }),
  }),
  select: d3.select,
  attr: sinon.spy(),
  on: sinon.spy(),
}

const GasPriceChart = proxyquire('../gas-price-chart.component.js', {
  'c3': {
    generate: function () {
      return {
        internal: {
          showTooltip: () => {},
          showXGridFocus: () => {},
        },
      }
    },
  },
  'd3': {
    ...d3,
    select: function (...args) {
      const result = d3.select(...args)
      return result.empty()
        ? mockSelectReturn
        : result
    },
  },
}).default

describe('GasPriceChart Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<GasPriceChart
      priceAndTimeEstimates={[
        { gasprice: 1, expectedTime: 10 },
        { gasprice: 2, expectedTime: 20 },
        { gasprice: 3, expectedTime: 30 },
      ]}
    />)
  })

  describe('render()', () => {
    it('should render', () => {
      assert(wrapper.hasClass('gas-price-chart'))
    })

    it('should render the chart div', () => {
      assert(wrapper.childAt(0).hasClass('gas-price-chart__root'))
      assert.equal(wrapper.childAt(0).props().id, 'chart')
    })
  })

})
