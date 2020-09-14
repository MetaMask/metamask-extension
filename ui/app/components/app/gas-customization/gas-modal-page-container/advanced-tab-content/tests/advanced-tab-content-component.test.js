import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import render from '../../../../../../../../test/lib/render-helpers'
import AdvancedTabContent from '../advanced-tab-content.component'

describe('AdvancedTabContent Component', function () {
  let utils

  const mockStore = {
    metamask: {},
  }

  const props = {
    updateCustomGasPrice: sinon.spy(),
    updateCustomGasLimit: sinon.spy(),
    gasChartProps: {
      estimatedTimes: [],
      gasPrices: [],
    },
    customModalGasPriceInHex: '0x3b9aca00', // 1000000000
    customModalGasLimitInHex: '0x5208', // 21000
    timeRemining: '> 24 min 52 sec',
    transactionFee: '0.000021 ETH',
    gasEstimatesLoading: false,
    customPriceIsSafe: true,
    isEthereumNetwork: true,
    insufficientBalance: false,
    isSpeedUp: false,

  }

  const store = configureMockStore()(mockStore)

  beforeEach(function () {
    utils = render(<AdvancedTabContent {...props} />, store)
  })

  after(function () {
    sinon.restore()
  })

  it('renders transaction fee', function () {
    const transactionFee = utils.getByText(props.transactionFee)

    assert(transactionFee)
  })

  it('should display gas price value calculate from hex', function () {
    const gasPriceInput = utils.getByDisplayValue('1')
    assert.equal(gasPriceInput.value, '1')
  })

  it('should display gas limit value from hex', function () {
    const gasLimitInput = utils.getByDisplayValue('21000')
    assert.equal(gasLimitInput.value, '21000')
  })
})
