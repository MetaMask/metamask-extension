import assert from 'assert'
import { mapDispatchToProps } from '../confirm-transaction-base.container'

describe('Confirm Transaction Base Container', () => {
  it('should map dispatch to props correctly', () => {
    const props = mapDispatchToProps(() => 'mockDispatch')

    assert.ok(typeof props.updateCustomNonce === 'function')
    assert.ok(typeof props.clearConfirmTransaction === 'function')
    assert.ok(typeof props.clearSend === 'function')
    assert.ok(typeof props.showTransactionConfirmedModal === 'function')
    assert.ok(typeof props.showCustomizeGasModal === 'function')
    assert.ok(typeof props.updateGasAndCalculate === 'function')
    assert.ok(typeof props.showRejectTransactionsConfirmationModal === 'function')
    assert.ok(typeof props.cancelTransaction === 'function')
    assert.ok(typeof props.cancelAllTransactions === 'function')
    assert.ok(typeof props.sendTransaction === 'function')
    assert.ok(typeof props.setMetaMetricsSendCount === 'function')
  })
})
