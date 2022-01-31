import React from 'react';
import { shallow } from 'enzyme';
import TransactionActivityLog from './transaction-activity-log.component';

describe('TransactionActivityLog Component', () => {
  it('should render properly', () => {
    const activities = [
      {
        eventKey: 'transactionCreated',
        hash:
          '0xe46c7f9b39af2fbf1c53e66f72f80343ab54c2c6dba902d51fb98ada08fe1a63',
        id: 2005383477493174,
        timestamp: 1543957986150,
        value: '0x2386f26fc10000',
      },
      {
        eventKey: 'transactionSubmitted',
        hash:
          '0xe46c7f9b39af2fbf1c53e66f72f80343ab54c2c6dba902d51fb98ada08fe1a63',
        id: 2005383477493174,
        timestamp: 1543957987853,
        value: '0x1319718a5000',
      },
      {
        eventKey: 'transactionResubmitted',
        hash:
          '0x7d09d337fc6f5d6fe2dbf3a6988d69532deb0a82b665f9180b5a20db377eea87',
        id: 2005383477493175,
        timestamp: 1543957991563,
        value: '0x1502634b5800',
      },
      {
        eventKey: 'transactionConfirmed',
        hash:
          '0x7d09d337fc6f5d6fe2dbf3a6988d69532deb0a82b665f9180b5a20db377eea87',
        id: 2005383477493175,
        timestamp: 1543958029960,
        value: '0x1502634b5800',
      },
    ];

    const wrapper = shallow(
      <TransactionActivityLog
        activities={activities}
        className="test-class"
        inlineRetryIndex={-1}
        inlineCancelIndex={-1}
        nativeCurrency="ETH"
        onCancel={() => undefined}
        onRetry={() => undefined}
        primaryTransactionStatus="confirmed"
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
    );

    expect(wrapper.hasClass('transaction-activity-log')).toStrictEqual(true);
    expect(wrapper.hasClass('test-class')).toStrictEqual(true);
  });

  it('should render inline retry and cancel buttons for earliest pending transaction', () => {
    const activities = [
      {
        eventKey: 'transactionCreated',
        hash: '0xa',
        id: 1,
        timestamp: 1,
        value: '0x1',
      },
      {
        eventKey: 'transactionSubmitted',
        hash: '0xa',
        id: 1,
        timestamp: 2,
        value: '0x1',
      },
      {
        eventKey: 'transactionResubmitted',
        hash:
          '0x7d09d337fc6f5d6fe2dbf3a6988d69532deb0a82b665f9180b5a20db377eea87',
        id: 2,
        timestamp: 3,
        value: '0x1',
      },
      {
        eventKey: 'transactionCancelAttempted',
        hash:
          '0x7d09d337fc6f5d6fe2dbf3a6988d69532deb0a82b665f9180b5a20db377eea87',
        id: 3,
        timestamp: 4,
        value: '0x1',
      },
    ];

    const wrapper = shallow(
      <TransactionActivityLog
        activities={activities}
        className="test-class"
        inlineRetryIndex={2}
        inlineCancelIndex={3}
        nativeCurrency="ETH"
        onCancel={() => undefined}
        onRetry={() => undefined}
        primaryTransactionStatus="pending"
        isEarliestNonce
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
    );

    expect(wrapper.hasClass('transaction-activity-log')).toStrictEqual(true);
    expect(wrapper.hasClass('test-class')).toStrictEqual(true);
    expect(wrapper.find('.transaction-activity-log__action-link')).toHaveLength(
      2,
    );
  });

  it('should not render inline retry and cancel buttons for newer pending transactions', () => {
    const activities = [
      {
        eventKey: 'transactionCreated',
        hash: '0xa',
        id: 1,
        timestamp: 1,
        value: '0x1',
      },
      {
        eventKey: 'transactionSubmitted',
        hash: '0xa',
        id: 1,
        timestamp: 2,
        value: '0x1',
      },
      {
        eventKey: 'transactionResubmitted',
        hash:
          '0x7d09d337fc6f5d6fe2dbf3a6988d69532deb0a82b665f9180b5a20db377eea87',
        id: 2,
        timestamp: 3,
        value: '0x1',
      },
      {
        eventKey: 'transactionCancelAttempted',
        hash:
          '0x7d09d337fc6f5d6fe2dbf3a6988d69532deb0a82b665f9180b5a20db377eea87',
        id: 3,
        timestamp: 4,
        value: '0x1',
      },
    ];

    const wrapper = shallow(
      <TransactionActivityLog
        activities={activities}
        className="test-class"
        inlineRetryIndex={2}
        inlineCancelIndex={3}
        nativeCurrency="ETH"
        onCancel={() => undefined}
        onRetry={() => undefined}
        primaryTransactionStatus="pending"
        isEarliestNonce={false}
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
    );

    expect(wrapper.hasClass('transaction-activity-log')).toStrictEqual(true);
    expect(wrapper.hasClass('test-class')).toStrictEqual(true);
    expect(wrapper.find('.transaction-activity-log__action-link')).toHaveLength(
      0,
    );
  });
});
