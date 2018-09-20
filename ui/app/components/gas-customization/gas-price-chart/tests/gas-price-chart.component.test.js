import React from 'react'
import assert from 'assert'
import shallow from '../../../../../lib/shallow-with-context'
import GasPriceChart from '../gas-price-chart.component.js'

describe('GasPriceChart Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<GasPriceChart />)
  })

  describe('render()', () => {
    it('should render', () => {
      console.log('wrapper', wrapper.html())
      assert(wrapper.hasClass('gas-price-chart'))
    })

    it('should render the chart div', () => {
      assert(wrapper.childAt(0).hasClass('gas-price-chart__container'))
      assert.equal(wrapper.childAt(0).props().id, 'chart')
    })
  })

})
