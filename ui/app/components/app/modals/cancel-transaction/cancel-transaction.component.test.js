import assert from 'assert';
import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Modal from '../../modal';
import CancelTransaction from './cancel-transaction.component';
import CancelTransactionGasFee from './cancel-transaction-gas-fee';

describe('CancelTransaction Component', function () {
  const t = (key) => key;

  it('should render a CancelTransaction modal', function () {
    const wrapper = shallow(<CancelTransaction newGasFee="0x1319718a5000" />, {
      context: { t },
    });

    assert.ok(wrapper);
    assert.strictEqual(wrapper.find(Modal).length, 1);
    assert.strictEqual(wrapper.find(CancelTransactionGasFee).length, 1);
    assert.strictEqual(
      wrapper.find(CancelTransactionGasFee).props().value,
      '0x1319718a5000',
    );
    assert.strictEqual(
      wrapper.find('.cancel-transaction__title').text(),
      'cancellationGasFee',
    );
    assert.strictEqual(
      wrapper.find('.cancel-transaction__description').text(),
      'attemptToCancelDescription',
    );
  });

  it('should pass the correct props to the Modal component', async function () {
    const createCancelTransactionSpy = sinon
      .stub()
      .callsFake(() => Promise.resolve());
    const hideModalSpy = sinon.spy();

    const wrapper = shallow(
      <CancelTransaction
        defaultNewGasPrice="0x3b9aca00"
        createCancelTransaction={createCancelTransactionSpy}
        hideModal={hideModalSpy}
        showTransactionConfirmedModal={() => undefined}
      />,
      { context: { t } },
    );

    assert.strictEqual(wrapper.find(Modal).length, 1);
    const modalProps = wrapper.find(Modal).props();

    assert.strictEqual(modalProps.headerText, 'attemptToCancel');
    assert.strictEqual(modalProps.submitText, 'yesLetsTry');
    assert.strictEqual(modalProps.cancelText, 'nevermind');

    assert.strictEqual(createCancelTransactionSpy.callCount, 0);
    assert.strictEqual(hideModalSpy.callCount, 0);
    await modalProps.onSubmit();
    assert.strictEqual(createCancelTransactionSpy.callCount, 1);
    assert.strictEqual(hideModalSpy.callCount, 1);
    modalProps.onCancel();
    assert.strictEqual(hideModalSpy.callCount, 2);
  });
});
