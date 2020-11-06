import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import CancelTransaction from '../cancel-transaction.component'
import CancelTransactionGasFee from '../cancel-transaction-gas-fee'
import Modal from '../../../modal'

describe('CancelTransaction Component', function () {
  const t = (key) => key

  it('should render a CancelTransaction modal', function () {
    const wrapper = shallow(<CancelTransaction newGasFee="0x1319718a5000" />, {
      context: { t },
    })

    assert.ok(wrapper)
    assert.equal(wrapper.find(Modal).length, 1)
    assert.equal(wrapper.find(CancelTransactionGasFee).length, 1)
    assert.equal(
      wrapper.find(CancelTransactionGasFee).props().value,
      '0x1319718a5000',
    )
    assert.equal(
      wrapper.find('.cancel-transaction__title').text(),
      'cancellationGasFee',
    )
    assert.equal(
      wrapper.find('.cancel-transaction__description').text(),
      'attemptToCancelDescription',
    )
  })

  it('should pass the correct props to the Modal component', async function () {
    const createCancelTransactionSpy = sinon
      .stub()
      .callsFake(() => Promise.resolve())
    const hideModalSpy = sinon.spy()

    const wrapper = shallow(
      <CancelTransaction
        defaultNewGasPrice="0x3b9aca00"
        createCancelTransaction={createCancelTransactionSpy}
        hideModal={hideModalSpy}
        showTransactionConfirmedModal={() => undefined}
      />,
      { context: { t } },
    )

    assert.equal(wrapper.find(Modal).length, 1)
    const modalProps = wrapper.find(Modal).props()

    assert.equal(modalProps.headerText, 'attemptToCancel')
    assert.equal(modalProps.submitText, 'yesLetsTry')
    assert.equal(modalProps.cancelText, 'nevermind')

    assert.equal(createCancelTransactionSpy.callCount, 0)
    assert.equal(hideModalSpy.callCount, 0)
    await modalProps.onSubmit()
    assert.equal(createCancelTransactionSpy.callCount, 1)
    assert.equal(hideModalSpy.callCount, 1)
    modalProps.onCancel()
    assert.equal(hideModalSpy.callCount, 2)
  })
})
