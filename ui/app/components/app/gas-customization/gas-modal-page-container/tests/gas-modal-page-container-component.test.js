import assert from 'assert'
import { describe } from 'mocha'
import React from 'react'
import sinon from 'sinon'
import { fireEvent } from '@testing-library/react'
import render from '../../../../../../../test/lib/render-helpers'
import { GAS_ESTIMATE_TYPES } from '../../../../../helpers/constants/common'
import GasModalPageContainer from '../gas-modal-page-container.component'

describe('GasModalPageContainer Component', function () {

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

  const infoRowProps = {
    originalTotalFiat: 'mockOriginalTotalFiat',
    originalTotalEth: 'mockOriginalTotalEth',
    newTotalFiat: 'mockNewTotalFiat',
    newTotalEth: 'mockNewTotalEth',
    sendAmount: 'mockSendAmount',
    transactionFee: 'mockTransactionFee',
  }

  const props = {
    infoRowProps,
    gasPriceButtonGroupProps: {
      gasButtonInfo: [
        slowProps,
        averageProps,
        fastProps,
      ],
    },
    fetchBasicGasAndTimeEstimates: sinon.stub().returns(Promise.resolve({ blockTime: 'mockBlockTime' })),
    fetchGasEstimates: sinon.spy(),
    cancelAndClose: sinon.spy(),
    onSubmit: sinon.spy(),
  }

  afterEach(function () {
    props.fetchBasicGasAndTimeEstimates.resetHistory()
    props.fetchGasEstimates.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  it('should call props.fetchBasicGasAndTimeEstimates', function () {
    render(<GasModalPageContainer {...props} />)

    assert(props.fetchBasicGasAndTimeEstimates.calledOnce)
  })

  it('should call props.fetchGasEstimates with the block time returned by fetchBasicGasAndTimeEstimates', function () {
    render(<GasModalPageContainer {...props} />)

    setImmediate(() => {
      assert(props.fetchGasEstimates.calledOnce)
      assert.equal(props.fetchGasEstimates.getCall(0).args[0], 'mockBlockTime')
    })
  })

  it('should render a Tabs component with "Basic" and "Advanced" tabs', function () {
    const { getByText } = render(<GasModalPageContainer {...props} />)

    const basicTab = getByText(/basic/u)
    const advancedTab = getByText(/advanced/u)

    assert(basicTab)
    assert(advancedTab)
  })

  it('close', function () {
    const { getByText } = render(<GasModalPageContainer {...props} />)

    const closeButton = getByText(/close/u)
    fireEvent.click(closeButton)

    assert(props.cancelAndClose.calledOnce)
  })

  it('save', function () {
    const { getByTestId } = render(<GasModalPageContainer {...props} />)

    const saveButton = getByTestId('page-container-footer-next')
    fireEvent.click(saveButton)

    assert(props.onSubmit.calledOnce)
  })

  describe('renderBasicTabContent', function () {
    it('renders slow gas option button with expected props', function () {
      const { getAllByRole, getByText } = render(<GasModalPageContainer {...props} />)

      const slowButton = getAllByRole('button')[0]
      const slowTimeRemaining = getByText(slowProps.timeEstimate)
      const slowFee2ndCurrency = getByText(slowProps.feeInSecondaryCurrency)
      const slowFeePrimaryCurrency = getByText(slowProps.feeInPrimaryCurrency)

      assert(slowButton)
      assert(slowTimeRemaining)
      assert(slowFee2ndCurrency)
      assert(slowFeePrimaryCurrency)
    })

    it('renders average gas option button with expected props', function () {
      const { getAllByRole, getByText } = render(<GasModalPageContainer {...props} />)

      const averageButton = getAllByRole('button')[1]
      const averageTimeRemaining = getByText(averageProps.timeEstimate)
      const averageFee2ndCurrency = getByText(averageProps.feeInSecondaryCurrency)
      const averageFeePrimaryCurrency = getByText(averageProps.feeInPrimaryCurrency)

      assert(averageButton)
      assert(averageTimeRemaining)
      assert(averageFee2ndCurrency)
      assert(averageFeePrimaryCurrency)
    })

    it('renders fast gas option button with expected props', function () {
      const { getAllByRole, getByText } = render(<GasModalPageContainer {...props} />)

      const fastButton = getAllByRole('button')[2]
      const fastTimeRemaining = getByText(fastProps.timeEstimate)
      const fastFee2ndCurrency = getByText(fastProps.feeInSecondaryCurrency)
      const fastFeePrimaryCurrency = getByText(fastProps.feeInPrimaryCurrency)

      assert(fastButton)
      assert(fastTimeRemaining)
      assert(fastFee2ndCurrency)
      assert(fastFeePrimaryCurrency)
    })
  })

  it('render info rows', function () {
    const { getByText } = render(<GasModalPageContainer {...props} />)

    assert(getByText(infoRowProps.newTotalFiat))
    assert(getByText(infoRowProps.newTotalEth))
    assert(getByText(infoRowProps.transactionFee))
    assert(getByText(infoRowProps.sendAmount))

  })

})
