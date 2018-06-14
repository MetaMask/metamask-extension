import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import AmountMaxButton from '../amount-max-button.component.js'

const propsMethodSpies = {
  setAmountToMax: sinon.spy(),
  setMaxModeTo: sinon.spy(),
}

const MOCK_EVENT = { preventDefault: () => {} }

sinon.spy(AmountMaxButton.prototype, 'setMaxAmount')

describe('AmountMaxButton Component', function () {
  let wrapper
  let instance

  beforeEach(() => {
    wrapper = shallow(<AmountMaxButton
      balance={'mockBalance'}
      gasTotal={'mockGasTotal'}
      maxModeOn={false}
      selectedToken={ { address: 'mockTokenAddress' } }
      setAmountToMax={propsMethodSpies.setAmountToMax}
      setMaxModeTo={propsMethodSpies.setMaxModeTo}
      tokenBalance={'mockTokenBalance'}
    />, { context: { t: str => str + '_t' } })
    instance = wrapper.instance()
  })

  afterEach(() => {
    propsMethodSpies.setAmountToMax.resetHistory()
    propsMethodSpies.setMaxModeTo.resetHistory()
    AmountMaxButton.prototype.setMaxAmount.resetHistory()
  })

  describe('setMaxAmount', () => {

    it('should call setAmountToMax with the correct params', () => {
      assert.equal(propsMethodSpies.setAmountToMax.callCount, 0)
      instance.setMaxAmount()
      assert.equal(propsMethodSpies.setAmountToMax.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.setAmountToMax.getCall(0).args,
        [{
          balance: 'mockBalance',
          gasTotal: 'mockGasTotal',
          selectedToken: { address: 'mockTokenAddress' },
          tokenBalance: 'mockTokenBalance',
        }]
      )
    })

  })

  describe('render', () => {
    it('should render a div with a send-v2__amount-max class', () => {
      assert.equal(wrapper.find('.send-v2__amount-max').length, 1)
      assert(wrapper.find('.send-v2__amount-max').is('div'))
    })

    it('should call setMaxModeTo and setMaxAmount when the send-v2__amount-max div is clicked', () => {
      const {
        onClick,
      } = wrapper.find('.send-v2__amount-max').props()

      assert.equal(AmountMaxButton.prototype.setMaxAmount.callCount, 0)
      assert.equal(propsMethodSpies.setMaxModeTo.callCount, 0)
      onClick(MOCK_EVENT)
      assert.equal(AmountMaxButton.prototype.setMaxAmount.callCount, 1)
      assert.equal(propsMethodSpies.setMaxModeTo.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.setMaxModeTo.getCall(0).args,
        [true]
      )
    })

    it('should not render text when maxModeOn is true', () => {
      wrapper.setProps({ maxModeOn: true })
      assert.equal(wrapper.find('.send-v2__amount-max').text(), '')
    })

    it('should render the expected text when maxModeOn is false', () => {
      wrapper.setProps({ maxModeOn: false })
      assert.equal(wrapper.find('.send-v2__amount-max').text(), 'max_t')
    })
  })
})
