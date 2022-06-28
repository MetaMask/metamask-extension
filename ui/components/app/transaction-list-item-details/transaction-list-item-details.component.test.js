import React from 'react';
import { shallow } from 'enzyme';
import Button from '../../ui/button';
import SenderToRecipient from '../../ui/sender-to-recipient';
import TransactionBreakdown from '../transaction-breakdown';
import TransactionActivityLog from '../transaction-activity-log';
import { TRANSACTION_STATUSES } from '../../../../shared/constants/transaction';
import { GAS_LIMITS } from '../../../../shared/constants/gas';
import TransactionListItemDetails from './transaction-list-item-details.component';

describe('TransactionListItemDetails Component', () => {
  it('should render properly', () => {
    const transaction = {
      history: [],
      id: 1,
      status: TRANSACTION_STATUSES.CONFIRMED,
      txParams: {
        from: '0x1',
        gas: GAS_LIMITS.SIMPLE,
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    };

    const transactionGroup = {
      transactions: [transaction],
      primaryTransaction: transaction,
      initialTransaction: transaction,
    };

    const wrapper = shallow(
      <TransactionListItemDetails
        onClose={() => undefined}
        title="Test Transaction Details"
        recipientAddress="0x1"
        senderAddress="0x2"
        tryReverseResolveAddress={() => undefined}
        transactionGroup={transactionGroup}
        senderNickname="sender-nickname"
        recipientNickname="recipient-nickname"
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
    );
    const child = wrapper.childAt(0);
    expect(child.hasClass('transaction-list-item-details')).toStrictEqual(true);
    expect(child.find(Button)).toHaveLength(2);
    expect(child.find(SenderToRecipient)).toHaveLength(1);
    expect(child.find(TransactionBreakdown)).toHaveLength(1);
    expect(child.find(TransactionActivityLog)).toHaveLength(1);
  });

  it('should render a retry button', () => {
    const transaction = {
      history: [],
      id: 1,
      status: TRANSACTION_STATUSES.CONFIRMED,
      txParams: {
        from: '0x1',
        gas: GAS_LIMITS.SIMPLE,
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    };

    const transactionGroup = {
      transactions: [transaction],
      primaryTransaction: transaction,
      initialTransaction: transaction,
      nonce: '0xa4',
      hasRetried: false,
      hasCancelled: false,
    };

    const wrapper = shallow(
      <TransactionListItemDetails
        onClose={() => undefined}
        title="Test Transaction Details"
        recipientAddress="0x1"
        senderAddress="0x2"
        tryReverseResolveAddress={() => undefined}
        transactionGroup={transactionGroup}
        showSpeedUp
        senderNickname="sender-nickname"
        recipientNickname="recipient-nickname"
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
    );

    const child = wrapper.childAt(0);

    expect(child.hasClass('transaction-list-item-details')).toStrictEqual(true);
    expect(child.find(Button)).toHaveLength(3);
  });

  it('should disable the Copy Tx ID and View In Etherscan buttons when tx hash is missing', () => {
    const transaction = {
      history: [],
      id: 1,
      status: 'confirmed',
      txParams: {
        from: '0x1',
        gas: GAS_LIMITS.SIMPLE,
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    };

    const transactionGroup = {
      transactions: [transaction],
      primaryTransaction: transaction,
      initialTransaction: transaction,
    };

    const wrapper = shallow(
      <TransactionListItemDetails
        onClose={() => undefined}
        title="Test Transaction Details"
        recipientAddress="0x1"
        senderAddress="0x2"
        tryReverseResolveAddress={() => undefined}
        transactionGroup={transactionGroup}
        senderNickname="sender-nickname"
        recipientNickname="recipient-nickname"
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
    );

    const child = wrapper.childAt(0);

    expect(child.hasClass('transaction-list-item-details')).toStrictEqual(true);
    const buttons = child.find(Button);
    expect(buttons.at(0).prop('disabled')).toStrictEqual(true);
    expect(buttons.at(1).prop('disabled')).toStrictEqual(true);
  });

  it('should render functional Copy Tx ID and View In Etherscan buttons when tx hash exists', () => {
    const transaction = {
      history: [],
      id: 1,
      status: 'confirmed',
      hash: '0xaa',
      txParams: {
        from: '0x1',
        gas: GAS_LIMITS.SIMPLE,
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    };

    const transactionGroup = {
      transactions: [transaction],
      primaryTransaction: transaction,
      initialTransaction: transaction,
    };

    const wrapper = shallow(
      <TransactionListItemDetails
        onClose={() => undefined}
        title="Test Transaction Details"
        recipientAddress="0x1"
        senderAddress="0x2"
        tryReverseResolveAddress={() => undefined}
        transactionGroup={transactionGroup}
        senderNickname="sender-nickname"
        recipientNickname="recipient-nickname"
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
    );

    const child = wrapper.childAt(0);

    expect(child.hasClass('transaction-list-item-details')).toStrictEqual(true);
    const buttons = child.find(Button);
    expect(buttons.at(0).prop('disabled')).toStrictEqual(false);
    expect(buttons.at(1).prop('disabled')).toStrictEqual(false);
  });
});
