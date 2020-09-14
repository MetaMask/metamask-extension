import assert from 'assert'
import React from 'react'
import render from '../../../../../../../../test/lib/render-helpers'
import BasicTabContent from '../basic-tab-content.component'
import { GAS_ESTIMATE_TYPES } from '../../../../../../helpers/constants/common'

describe('BasicTabContent Component', function () {
  let utils

  const slowProps = {
    feeInPrimaryCurrency: '$0.30',
    feeInSecondaryCurrency: '0.00354 ETH',
    timeEstimate: '~ 2 min 1 sec',
    priceInHexWei: '0xa1b2c30',
    gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
  }

  const averageProps = {
    feeInPrimaryCurrency: '$0.39',
    feeInSecondaryCurrency: '0.004 ETH',
    timeEstimate: '~ 1 min 30 sec',
    priceInHexWei: '0xa1b2c39',
    gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
  }

  const fastProps = {
    feeInPrimaryCurrency: '$0.52',
    feeInSecondaryCurrency: '0.0048 ETH',
    timeEstimate: '~ 1 min 0 sec',
    priceInHexWei: '0xa1b2c3f',
    gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
  }

  const props = {
    gasPriceButtonGroupProps: {
      loading: false,
      gasButtonInfo: [
        slowProps,
        averageProps,
        fastProps,
      ],
    },
  }

  beforeEach(function () {
    utils = render(<BasicTabContent {...props} />)
  })

  it('render slow ', function () {
    const slowButton = utils.getAllByRole('button')[0]
    const slowTimeRemaining = utils.getByText(slowProps.timeEstimate)
    const slowFee2ndCurrency = utils.getByText(slowProps.feeInSecondaryCurrency)
    const slowFeePrimaryCurrency = utils.getByText(slowProps.feeInPrimaryCurrency)

    assert(slowButton)
    assert(slowTimeRemaining)
    assert(slowFee2ndCurrency)
    assert(slowFeePrimaryCurrency)
  })

  it('render average ', function () {
    const averageButton = utils.getAllByRole('button')[1]
    const averageTimeRemaining = utils.getByText(averageProps.timeEstimate)
    const averageFee2ndCurrency = utils.getByText(averageProps.feeInSecondaryCurrency)
    const averageFeePrimaryCurrency = utils.getByText(averageProps.feeInPrimaryCurrency)

    assert(averageButton)
    assert(averageTimeRemaining)
    assert(averageFee2ndCurrency)
    assert(averageFeePrimaryCurrency)
  })

  it('render fast ', function () {
    const fastButton = utils.getAllByRole('button')[2]
    const fastTimeRemaining = utils.getByText(fastProps.timeEstimate)
    const fastFee2ndCurrency = utils.getByText(fastProps.feeInSecondaryCurrency)
    const fastFeePrimaryCurrency = utils.getByText(fastProps.feeInPrimaryCurrency)

    assert(fastButton)
    assert(fastTimeRemaining)
    assert(fastFee2ndCurrency)
    assert(fastFeePrimaryCurrency)
  })
})
