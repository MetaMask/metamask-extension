import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Modal from '../../modal';
import CancelTransaction from './cancel-transaction.component';
import CancelTransactionGasFee from './cancel-transaction-gas-fee';

describe('CancelTransaction Component', () => {
  const t = (key) => key;

  it('should render a CancelTransaction modal', () => {
    const wrapper = shallow(<CancelTransaction newGasFee="0x1319718a5000" />, {
      context: { t },
    });

    expect(wrapper.find(Modal)).toHaveLength(1);
    expect(wrapper.find(CancelTransactionGasFee)).toHaveLength(1);
    expect(wrapper.find(CancelTransactionGasFee).props().value).toStrictEqual(
      '0x1319718a5000',
    );
    expect(wrapper.find('.cancel-transaction__title').text()).toStrictEqual(
      'cancellationGasFee',
    );
    expect(
      wrapper.find('.cancel-transaction__description').text(),
    ).toStrictEqual('attemptToCancelDescription');
  });

  it('should pass the correct props to the Modal component', async () => {
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

    expect(wrapper.find(Modal)).toHaveLength(1);
    const modalProps = wrapper.find(Modal).props();

    expect(modalProps.headerText).toStrictEqual('attemptToCancel');
    expect(modalProps.submitText).toStrictEqual('yesLetsTry');
    expect(modalProps.cancelText).toStrictEqual('nevermind');

    expect(createCancelTransactionSpy.callCount).toStrictEqual(0);
    expect(hideModalSpy.callCount).toStrictEqual(0);
    await modalProps.onSubmit();
    expect(createCancelTransactionSpy.callCount).toStrictEqual(1);
    expect(hideModalSpy.callCount).toStrictEqual(1);
    modalProps.onCancel();
    expect(hideModalSpy.callCount).toStrictEqual(2);
  });
});
