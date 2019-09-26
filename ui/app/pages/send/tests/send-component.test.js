import React from 'react'
import assert from 'assert'
import proxyquire from 'proxyquire'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import timeout from '../../../../lib/test-timeout'

import AddRecipient from '../send-content/add-recipient/add-recipient.container'
import SendHeader from '../send-header/send-header.container'
import SendContent from '../send-content/send-content.container'
import SendFooter from '../send-footer/send-footer.container'

const mockBasicGasEstimates = {
  blockTime: 'mockBlockTime',
}

const propsMethodSpies = {
  updateAndSetGasLimit: sinon.spy(),
  updateSendErrors: sinon.spy(),
  updateSendTokenBalance: sinon.spy(),
  resetSendState: sinon.spy(),
  fetchBasicGasEstimates: sinon.stub().returns(Promise.resolve(mockBasicGasEstimates)),
  fetchGasEstimates: sinon.spy(),
  updateToNicknameIfNecessary: sinon.spy(),
}
const utilsMethodStubs = {
  getAmountErrorObject: sinon.stub().returns({ amount: 'mockAmountError' }),
  getGasFeeErrorObject: sinon.stub().returns({ gasFee: 'mockGasFeeError' }),
  doesAmountErrorRequireUpdate: sinon.stub().callsFake(obj => obj.balance !== obj.prevBalance),
}

const SendTransactionScreen = proxyquire('../send.component.js', {
  './send.utils': utilsMethodStubs,
}).default

sinon.spy(SendTransactionScreen.prototype, 'componentDidMount')
sinon.spy(SendTransactionScreen.prototype, 'updateGas')

describe('Send Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SendTransactionScreen
      amount={'mockAmount'}
      amountConversionRate={'mockAmountConversionRate'}
      blockGasLimit={'mockBlockGasLimit'}
      conversionRate={10}
      editingTransactionId={'mockEditingTransactionId'}
      fetchBasicGasEstimates={propsMethodSpies.fetchBasicGasEstimates}
      fetchGasEstimates={propsMethodSpies.fetchGasEstimates}
      from={ { address: 'mockAddress', balance: 'mockBalance' } }
      gasLimit={'mockGasLimit'}
      gasPrice={'mockGasPrice'}
      gasTotal={'mockGasTotal'}
      history={{ mockProp: 'history-abc'}}
      network={'3'}
      primaryCurrency={'mockPrimaryCurrency'}
      recentBlocks={['mockBlock']}
      selectedAddress={'mockSelectedAddress'}
      selectedToken={'mockSelectedToken'}
      showHexData={true}
      tokenBalance={'mockTokenBalance'}
      tokenContract={'mockTokenContract'}
      updateAndSetGasLimit={propsMethodSpies.updateAndSetGasLimit}
      updateSendErrors={propsMethodSpies.updateSendErrors}
      updateSendTokenBalance={propsMethodSpies.updateSendTokenBalance}
      resetSendState={propsMethodSpies.resetSendState}
      updateToNicknameIfNecessary={propsMethodSpies.updateToNicknameIfNecessary}
    />)
  })

  afterEach(() => {
    SendTransactionScreen.prototype.componentDidMount.resetHistory()
    SendTransactionScreen.prototype.updateGas.resetHistory()
    utilsMethodStubs.doesAmountErrorRequireUpdate.resetHistory()
    utilsMethodStubs.getAmountErrorObject.resetHistory()
    utilsMethodStubs.getGasFeeErrorObject.resetHistory()
    propsMethodSpies.fetchBasicGasEstimates.resetHistory()
    propsMethodSpies.updateAndSetGasLimit.resetHistory()
    propsMethodSpies.updateSendErrors.resetHistory()
    propsMethodSpies.updateSendTokenBalance.resetHistory()
  })

  it('should call componentDidMount', () => {
    assert(SendTransactionScreen.prototype.componentDidMount.calledOnce)
  })

  describe('componentDidMount', () => {
    it('should call props.fetchBasicGasAndTimeEstimates', () => {
      propsMethodSpies.fetchBasicGasEstimates.resetHistory()
      assert.equal(propsMethodSpies.fetchBasicGasEstimates.callCount, 0)
      wrapper.instance().componentDidMount()
      assert.equal(propsMethodSpies.fetchBasicGasEstimates.callCount, 1)
    })

    it('should call this.updateGas', async () => {
      SendTransactionScreen.prototype.updateGas.resetHistory()
      propsMethodSpies.updateSendErrors.resetHistory()
      assert.equal(SendTransactionScreen.prototype.updateGas.callCount, 0)
      wrapper.instance().componentDidMount()
      await timeout(250)
      assert.equal(SendTransactionScreen.prototype.updateGas.callCount, 1)
    })
  })

  describe('componentWillUnmount', () => {
    it('should call this.props.resetSendState', () => {
      propsMethodSpies.resetSendState.resetHistory()
      assert.equal(propsMethodSpies.resetSendState.callCount, 0)
      wrapper.instance().componentWillUnmount()
      assert.equal(propsMethodSpies.resetSendState.callCount, 1)
    })
  })

  describe('componentDidUpdate', () => {
    it('should call doesAmountErrorRequireUpdate with the expected params', () => {
      utilsMethodStubs.getAmountErrorObject.resetHistory()
      wrapper.instance().componentDidUpdate({
        from: {
          balance: '',
        },
      })
      assert(utilsMethodStubs.doesAmountErrorRequireUpdate.calledOnce)
      assert.deepEqual(
        utilsMethodStubs.doesAmountErrorRequireUpdate.getCall(0).args[0],
        {
          balance: 'mockBalance',
          gasTotal: 'mockGasTotal',
          prevBalance: '',
          prevGasTotal: undefined,
          prevTokenBalance: undefined,
          selectedToken: 'mockSelectedToken',
          tokenBalance: 'mockTokenBalance',
        }
      )
    })

    it('should not call getAmountErrorObject if doesAmountErrorRequireUpdate returns false', () => {
      utilsMethodStubs.getAmountErrorObject.resetHistory()
      wrapper.instance().componentDidUpdate({
        from: {
          balance: 'mockBalance',
        },
      })
      assert.equal(utilsMethodStubs.getAmountErrorObject.callCount, 0)
    })

    it('should call getAmountErrorObject if doesAmountErrorRequireUpdate returns true', () => {
      utilsMethodStubs.getAmountErrorObject.resetHistory()
      wrapper.instance().componentDidUpdate({
        from: {
          balance: 'balanceChanged',
        },
      })
      assert.equal(utilsMethodStubs.getAmountErrorObject.callCount, 1)
      assert.deepEqual(
        utilsMethodStubs.getAmountErrorObject.getCall(0).args[0],
        {
          amount: 'mockAmount',
          amountConversionRate: 'mockAmountConversionRate',
          balance: 'mockBalance',
          conversionRate: 10,
          gasTotal: 'mockGasTotal',
          primaryCurrency: 'mockPrimaryCurrency',
          selectedToken: 'mockSelectedToken',
          tokenBalance: 'mockTokenBalance',
        }
      )
    })

    it('should call getGasFeeErrorObject if doesAmountErrorRequireUpdate returns true and selectedToken is truthy', () => {
      utilsMethodStubs.getGasFeeErrorObject.resetHistory()
      wrapper.instance().componentDidUpdate({
        from: {
          balance: 'balanceChanged',
        },
      })
      assert.equal(utilsMethodStubs.getGasFeeErrorObject.callCount, 1)
      assert.deepEqual(
        utilsMethodStubs.getGasFeeErrorObject.getCall(0).args[0],
        {
          amountConversionRate: 'mockAmountConversionRate',
          balance: 'mockBalance',
          conversionRate: 10,
          gasTotal: 'mockGasTotal',
          primaryCurrency: 'mockPrimaryCurrency',
          selectedToken: 'mockSelectedToken',
        }
      )
    })

    it('should not call getGasFeeErrorObject if doesAmountErrorRequireUpdate returns false', () => {
      utilsMethodStubs.getGasFeeErrorObject.resetHistory()
      wrapper.instance().componentDidUpdate({
        from: { address: 'mockAddress', balance: 'mockBalance' },
      })
      assert.equal(utilsMethodStubs.getGasFeeErrorObject.callCount, 0)
    })

    it('should not call getGasFeeErrorObject if doesAmountErrorRequireUpdate returns true but selectedToken is falsy', () => {
      utilsMethodStubs.getGasFeeErrorObject.resetHistory()
      wrapper.setProps({ selectedToken: null })
      wrapper.instance().componentDidUpdate({
        from: {
          balance: 'balanceChanged',
        },
      })
      assert.equal(utilsMethodStubs.getGasFeeErrorObject.callCount, 0)
    })

    it('should call updateSendErrors with the expected params if selectedToken is falsy', () => {
      propsMethodSpies.updateSendErrors.resetHistory()
      wrapper.setProps({ selectedToken: null })
      wrapper.instance().componentDidUpdate({
        from: {
          balance: 'balanceChanged',
        },
      })
      assert.equal(propsMethodSpies.updateSendErrors.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateSendErrors.getCall(0).args[0],
        { amount: 'mockAmountError', gasFee: null }
      )
    })

    it('should call updateSendErrors with the expected params if selectedToken is truthy', () => {
      propsMethodSpies.updateSendErrors.resetHistory()
      wrapper.setProps({ selectedToken: 'someToken' })
      wrapper.instance().componentDidUpdate({
        from: {
          balance: 'balanceChanged',
        },
      })
      assert.equal(propsMethodSpies.updateSendErrors.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateSendErrors.getCall(0).args[0],
        { amount: 'mockAmountError', gasFee: 'mockGasFeeError' }
      )
    })

    it('should not call updateSendTokenBalance or this.updateGas if network === prevNetwork', () => {
      SendTransactionScreen.prototype.updateGas.resetHistory()
      propsMethodSpies.updateSendTokenBalance.resetHistory()
      wrapper.instance().componentDidUpdate({
        from: {
          balance: 'balanceChanged',
        },
        network: '3',
      })
      assert.equal(propsMethodSpies.updateSendTokenBalance.callCount, 0)
      assert.equal(SendTransactionScreen.prototype.updateGas.callCount, 0)
    })

    it('should not call updateSendTokenBalance or this.updateGas if network === loading', () => {
      wrapper.setProps({ network: 'loading' })
      SendTransactionScreen.prototype.updateGas.resetHistory()
      propsMethodSpies.updateSendTokenBalance.resetHistory()
      wrapper.instance().componentDidUpdate({
        from: {
          balance: 'balanceChanged',
        },
        network: '3',
      })
      assert.equal(propsMethodSpies.updateSendTokenBalance.callCount, 0)
      assert.equal(SendTransactionScreen.prototype.updateGas.callCount, 0)
    })

    it('should call updateSendTokenBalance and this.updateGas with the correct params', () => {
      SendTransactionScreen.prototype.updateGas.resetHistory()
      propsMethodSpies.updateSendTokenBalance.resetHistory()
      wrapper.instance().componentDidUpdate({
        from: {
          balance: 'balanceChanged',
        },
        network: '2',
      })
      assert.equal(propsMethodSpies.updateSendTokenBalance.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateSendTokenBalance.getCall(0).args[0],
        {
          selectedToken: 'mockSelectedToken',
          tokenContract: 'mockTokenContract',
          address: 'mockAddress',
        }
      )
      assert.equal(SendTransactionScreen.prototype.updateGas.callCount, 1)
      assert.deepEqual(
        SendTransactionScreen.prototype.updateGas.getCall(0).args,
        []
      )
    })
  })

  describe('updateGas', () => {
    it('should call updateAndSetGasLimit with the correct params if no to prop is passed', () => {
      propsMethodSpies.updateAndSetGasLimit.resetHistory()
      wrapper.instance().updateGas()
      assert.equal(propsMethodSpies.updateAndSetGasLimit.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateAndSetGasLimit.getCall(0).args[0],
        {
          blockGasLimit: 'mockBlockGasLimit',
          editingTransactionId: 'mockEditingTransactionId',
          gasLimit: 'mockGasLimit',
          gasPrice: 'mockGasPrice',
          recentBlocks: ['mockBlock'],
          selectedAddress: 'mockSelectedAddress',
          selectedToken: 'mockSelectedToken',
          to: '',
          value: 'mockAmount',
          data: undefined,
        }
      )
    })

    it('should call updateAndSetGasLimit with the correct params if a to prop is passed', () => {
      propsMethodSpies.updateAndSetGasLimit.resetHistory()
      wrapper.setProps({ to: 'someAddress' })
      wrapper.instance().updateGas()
      assert.equal(
        propsMethodSpies.updateAndSetGasLimit.getCall(0).args[0].to,
        'someaddress',
      )
    })

    it('should call updateAndSetGasLimit with to set to lowercase if passed', () => {
      propsMethodSpies.updateAndSetGasLimit.resetHistory()
      wrapper.instance().updateGas({ to: '0xABC' })
      assert.equal(propsMethodSpies.updateAndSetGasLimit.getCall(0).args[0].to, '0xabc')
    })
  })

  describe('render', () => {
    it('should render a page-container class', () => {
      assert.equal(wrapper.find('.page-container').length, 1)
    })

    it('should render SendHeader and AddRecipient', () => {
      assert.equal(wrapper.find(SendHeader).length, 1)
      assert.equal(wrapper.find(AddRecipient).length, 1)
    })

    it('should pass the history prop to SendHeader and SendFooter', () => {
      wrapper.setProps({
        to: '0x80F061544cC398520615B5d3e7A3BedD70cd4510',
      })
      assert.equal(wrapper.find(SendHeader).length, 1)
      assert.equal(wrapper.find(SendContent).length, 1)
      assert.equal(wrapper.find(SendFooter).length, 1)
      assert.deepEqual(
        wrapper.find(SendFooter).props(),
        {
          history: { mockProp: 'history-abc' },
        }
      )
    })

    it('should pass showHexData to SendContent', () => {
      wrapper.setProps({
        to: '0x80F061544cC398520615B5d3e7A3BedD70cd4510',
      })
      assert.equal(wrapper.find(SendContent).props().showHexData, true)
    })
  })

  describe('validate when input change', () => {
    let clock

    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it('should validate when input changes', () => {
      const instance = wrapper.instance()
      instance.onRecipientInputChange('0x80F061544cC398520615B5d3e7A3BedD70cd4510')

      assert.deepEqual(instance.state, {
        query: '0x80F061544cC398520615B5d3e7A3BedD70cd4510',
        toError: null,
        toWarning: null,
      })
    })

    it('should validate when input changes and has error', () => {
      const instance = wrapper.instance()
      instance.onRecipientInputChange('0x80F061544cC398520615B5d3e7a3BedD70cd4510')

      clock.tick(1001)
      assert.deepEqual(instance.state, {
        query: '0x80F061544cC398520615B5d3e7a3BedD70cd4510',
        toError: 'invalidAddressRecipient',
        toWarning: null,
      })
    })

    it('should validate when input changes and has error', () => {
      wrapper.setProps({ network: 'bad' })
      const instance = wrapper.instance()
      instance.onRecipientInputChange('0x80F061544cC398520615B5d3e7a3BedD70cd4510')

      clock.tick(1001)
      assert.deepEqual(instance.state, {
        query: '0x80F061544cC398520615B5d3e7a3BedD70cd4510',
        toError: 'invalidAddressRecipientNotEthNetwork',
        toWarning: null,
      })
    })

    it('should synchronously validate when input changes to ""', () => {
      wrapper.setProps({ network: 'bad' })
      const instance = wrapper.instance()
      instance.onRecipientInputChange('0x80F061544cC398520615B5d3e7a3BedD70cd4510')

      clock.tick(1001)
      assert.deepEqual(instance.state, {
        query: '0x80F061544cC398520615B5d3e7a3BedD70cd4510',
        toError: 'invalidAddressRecipientNotEthNetwork',
        toWarning: null,
      })

      instance.onRecipientInputChange('')
      assert.deepEqual(instance.state, {
        query: '',
        toError: '',
        toWarning: '',
      })
    })

    it('should warn when send to a known token contract address', () => {
      wrapper.setProps({
        selectedToken: '0x888',
      })
      const instance = wrapper.instance()
      instance.onRecipientInputChange('0x13cb85823f78Cff38f0B0E90D3e975b8CB3AAd64')

      clock.tick(1001)
      assert.deepEqual(instance.state, {
        query: '0x13cb85823f78Cff38f0B0E90D3e975b8CB3AAd64',
        toError: null,
        toWarning: 'knownAddressRecipient',
      })
    })
  })
})
