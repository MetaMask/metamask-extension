import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import TransactionActivityLog from '.';

describe('TransactionActivityLog Component', () => {
  const activities = [
    {
      eventKey: 'transactionCreated',
      hash: '0xe46c7f9b39af2fbf1c53e66f72f80343ab54c2c6dba902d51fb98ada08fe1a63',
      id: 2005383477493174,
      timestamp: 1543957986150,
      value: '0x2386f26fc10000',
    },
    {
      eventKey: 'transactionSubmitted',
      hash: '0xe46c7f9b39af2fbf1c53e66f72f80343ab54c2c6dba902d51fb98ada08fe1a63',
      id: 2005383477493174,
      timestamp: 1543957987853,
      value: '0x1319718a5000',
    },
    {
      eventKey: 'transactionResubmitted',
      hash: '0x7d09d337fc6f5d6fe2dbf3a6988d69532deb0a82b665f9180b5a20db377eea87',
      id: 2005383477493175,
      timestamp: 1543957991563,
      value: '0x1502634b5800',
    },
    {
      eventKey: 'transactionConfirmed',
      hash: '0x7d09d337fc6f5d6fe2dbf3a6988d69532deb0a82b665f9180b5a20db377eea87',
      id: 2005383477493175,
      timestamp: 1543958029960,
      value: '0x1502634b5800',
    },
  ];

  const props = {
    activities,
    className: 'test-class',
    inlineRetryIndex: -1,
    inlineCancelIndex: -1,
    nativeCurrency: 'ETH',
    onCancel: jest.fn(),
    onRetry: jest.fn(),
    primaryTransactionStatus: 'confirmed',
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <TransactionActivityLog.WrappedComponent {...props} />,
    );

    expect(container).toMatchSnapshot();
  });
});
